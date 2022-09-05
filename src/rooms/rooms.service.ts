import { Injectable, Logger } from '@nestjs/common';
import { CreateRoomDTO, GetRoomDTO, getRoomSelector } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { User } from '../users/dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private logger = new Logger('RoomsService');

  /**
   * Create a room and return the room object
   * @param {User} user
   * @param {CreateRoomDTO} dto create room dto
   * @returns {Promise<CreateRoomDTO>}
   */
  async createRoom(user: User, dto: CreateRoomDTO) {
    const room = await this.prisma.room.create({
      data: {
        moderator: {
          connect: { uid: user.uid },
        },
        title: dto.title,
        details: dto.details,
        tags: dto.tags,
        total: dto.total,
        theme: dto.theme,
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

  /**
   * return all rooms
   * @returns {Promise<GetRoomDTO[]>}
   */
  async findAllRooms() {
    const rooms: GetRoomDTO[] = await this.prisma.room.findMany({
      select: getRoomSelector,
    });

    return rooms;
  }

  /**
   * find one room and return room object
   * @param {number} roomId roomId(=itemId in DB)
   * @returns {Promise<GetRoomDTO>}
   */
  async findRoomById(roomId: number) {
    const room: GetRoomDTO = await this.prisma.room.findFirst({
      where: { itemId: roomId },
      select: getRoomSelector,
    });

    return room;
  }

  /**
   * delete one room
   * @param {number} roomId roomId(=itemId in DB)
   */
  async removeRoomById(roomId: number) {
    try {
      await this.prisma.room.delete({
        where: { itemId: roomId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          this.logger.debug('Room not found');
        }
      }
      //throw e;
    }
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
    try {
      const room: GetRoomDTO = await this.prisma.room.update({
        where: { itemId: roomId },
        data: { current: existingRoomMembersLength + 1 },
        select: getRoomSelector,
      });

      if (!room) {
        this.logger.warn('Room not found :: no data');
      }

      return room;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.debug('Room not found');
        }
      }
      //throw e;
    }
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
        this.logger.warn('Room not found :: no data');
      }

      if (room.current < 0) {
        this.logger.warn('[ASSERT] Tried to set room current value to minus');
        room = await this.prisma.room.update({
          where: { itemId: roomId },
          data: { current: 0 },
          select: getRoomSelector,
        });
      }

      return room;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          this.logger.debug('Room not found');
        }
      }
      //throw e;
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
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          this.logger.debug('Room not found');
        }
      }
      //throw e;
    }
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
  async isRoomModerator(roomId: number, user: User) {
    const roomModerator = await this.getRoomModerator(roomId);
    if (!roomModerator) {
      return false;
    }

    return roomModerator.uid === user.uid;
  }
}
