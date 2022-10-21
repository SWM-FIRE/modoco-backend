import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { UsersHelper } from '../../users/helper/users.helper';
import { GetRoomDTO, getRoomSelector } from '../dto';
import { User } from '@prisma/client';
import { isNotFoundError } from '../../common/util/prisma-error.util';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RoomsDatabaseHelper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly usersHelper: UsersHelper,
  ) {}

  async createRoom(
    moderatorUid: number,
    title: string,
    details: string,
    tags: string[],
    total: number,
    theme: string,
  ) {
    const room = await this.prisma.room.create({
      data: {
        moderator: {
          connect: { uid: moderatorUid },
        },
        title,
        details,
        tags,
        total,
        theme,
      },
      include: { moderator: true },
    });

    // delete unnecessary fields
    delete room.createdAt;
    delete room.moderatorId;
    delete room.moderator.createdAt;
    delete room.moderator.updatedAt;
    delete room.moderator.hash;
    delete room.moderator.email;

    return room;
  }

  findAllRooms() {
    return this.prisma.room.findMany({
      select: getRoomSelector,
    });
  }

  findRoomById(roomId: number) {
    return this.prisma.room.findFirst({
      where: { itemId: roomId },
      select: getRoomSelector,
    });
  }

  async deleteRoomById(roomId: number) {
    await this.prisma.room.delete({
      where: { itemId: roomId },
    });
  }

  /**
   * get moderator of the room by roomId
   * @param {number} roomId roomId(=itemId in DB)
   */
  async getRoomModerator(roomId: number) {
    const room = await this.findRoomById(roomId);
    if (!room) {
      return null;
    }

    return room.moderator;
  }

  /**
   * check if user is room moderator
   * @param {number} roomId roomId(=itemId in DB)
   * @param {User} user user
   * @returns {Promise<boolean>} true if user is moderator of the room
   */
  async isRoomModerator(user: User, roomId: number) {
    const roomModerator = await this.getRoomModerator(roomId);
    if (!roomModerator) {
      return false;
    }

    return roomModerator.uid === user.uid;
  }

  /**
   *
   */
  async updateRoomInfoByDelta(
    roomId: number,
    existingRoomMembersLength: number,
    delta: number,
  ) {
    const room: GetRoomDTO = await this.prisma.room.update({
      where: { itemId: roomId },
      data: { current: existingRoomMembersLength + delta },
      select: getRoomSelector,
    });

    if (!room) {
      throw new WsException('Room not found');
    }

    return room;
  }

  /**
   * update room in DB when user join room
   * @param {number} roomId roomId(=itemId in DB)
   * @param {number} existingRoomMembersLength length of existing room members
   * @returns {Promise<GetRoomDTO>}
   */
  async joinRoom(
    roomId: number,
    existingRoomMembersLength: number,
  ): Promise<GetRoomDTO> {
    const room: GetRoomDTO = await this.prisma.room.update({
      where: { itemId: roomId },
      data: { current: existingRoomMembersLength + 1 },
      select: getRoomSelector,
    });

    if (!room) {
      throw new WsException('Room not found');
    }

    return room;
  }

  /**
   * update room in DB when user leave room
   * @param {number} roomId roomId(=itemId in DB)
   * @param {number} currentRoomMembersLength length of current room members
   * @returns {Promise<GetRoomDTO>}
   */
  async leaveRoom(
    roomId: number,
    currentRoomMembersLength: number,
  ): Promise<GetRoomDTO> {
    try {
      let room = await this.prisma.room.update({
        where: { itemId: roomId },
        data: { current: currentRoomMembersLength },
        select: getRoomSelector,
      });

      if (!room) {
        //this.logger.warn('Room not found :: no data');
      }

      if (room.current < 0) {
        //this.logger.warn('[ASSERT] Tried to set room current value to minus');
        room = await this.prisma.room.update({
          where: { itemId: roomId },
          data: { current: 0 },
          select: getRoomSelector,
        });
      }

      return room;
    } catch (error) {
      if (isNotFoundError(error)) {
        //this.logger.debug('[LeaveRoom] Room not found');
      }
    }
  }

  /**
   * get room capacity(total)
   * @param {number} roomId roomId(=itemId in DB)
   * @returns {Promise<number>}
   */
  async getRoomCapacity(roomId: number): Promise<number> {
    try {
      if (roomId < 0) {
        return 0;
      }

      const room = await this.prisma.room.findFirst({
        where: { itemId: roomId },
        select: {
          total: true,
        },
      });
      return room.total;
    } catch (error) {
      if (isNotFoundError(error)) {
        //this.logger.debug('[RoomCapacity] Room not found');
      }
    }
  }

  /**
   * get room current members count
   * @TODO : remove this function and use redis
   * @param roomId
   * @param user
   */
  async getRoomCurrentMembersCount(roomId: number): Promise<number> {
    try {
      const room = await this.prisma.room.findFirst({
        where: { itemId: roomId },
        select: {
          current: true,
        },
      });
      return room.current;
    } catch (error) {
      if (isNotFoundError(error)) {
        //this.logger.debug('[RoomCurrentCount] Room not found');
      }
    }
  }

  async canDeleteRoom(roomId: number, user: User) {
    const isModerator = await this.isRoomModerator(user, roomId);
    if (!isModerator) {
      throw new ForbiddenException('You are not moderator of this room');
    }

    const currentUser = await this.getRoomCurrentMembersCount(roomId);
    if (currentUser > 0) {
      throw new ForbiddenException('Room is not empty');
    }

    return true;
  }
}
