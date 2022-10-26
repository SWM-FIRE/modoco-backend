import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetRoomDTO, getRoomSelector } from '../dto';
import { User } from '@prisma/client';
import { isNotFoundError } from '../../common/util/prisma-error.util';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RoomsDatabaseHelper {
  constructor(private readonly prisma: PrismaService) {}

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
   * update room in DB
   * @param roomId roomId(=itemId in DB)
   * @param existingRoomMembersLength length of existing room members
   * @param delta delta of room members
   */
  async updateRoomInfoByDelta(
    roomId: number,
    existingRoomMembersLength: number,
    delta: number,
  ) {
    let room: GetRoomDTO = await this.prisma.room.update({
      where: { itemId: roomId },
      data: { current: existingRoomMembersLength + delta },
      select: getRoomSelector,
    });

    if (!room) {
      throw new WsException('Room not found');
    }

    // prevent negative room current value
    if (room.current < 0) {
      room = await this.prisma.room.update({
        where: { itemId: roomId },
        data: { current: 0 },
        select: getRoomSelector,
      });
    }

    return room;
  }

  /**
   * get room capacity(total)
   * @param {number} roomId roomId(=itemId in DB)
   * @returns {Promise<number>}
   */
  async getRoomCapacity(roomId: number): Promise<number> {
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
  }

  /**
   * get room current members count
   * @TODO : remove this function and use redis
   * @param roomId
   * @param user
   */
  async getRoomCurrentMembersCount(roomId: number): Promise<number> {
    const room = await this.prisma.room.findFirst({
      where: { itemId: roomId },
      select: {
        current: true,
      },
    });
    return room.current;
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
