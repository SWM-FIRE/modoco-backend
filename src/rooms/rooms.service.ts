import { Injectable, Logger } from '@nestjs/common';
import { CreateRoomDTO, GetRoomDTO, getRoomSelector } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private logger = new Logger('RoomsService');

  /**
   * Create a room and return the room object
   * @param user
   * @param {CreateRoomDTO} dto create room dto
   * @returns {Promise<CreateRoomDTO>}
   */
  async create(user, dto: CreateRoomDTO) {
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
   * find all rooms and return all rooms
   * @returns {Promise<GetRoomDTO[]>}
   */
  async findAll() {
    const rooms: GetRoomDTO[] = await this.prisma.room.findMany({
      select: getRoomSelector,
    });

    return rooms;
  }

  /**
   * find one room and return room object
   * @param {number} id roomId(=itemId in DB)
   * @returns {Promise<GetRoomDTO>}
   */
  async getOne(id: number) {
    const room: GetRoomDTO = await this.prisma.room.findFirst({
      where: { itemId: id },
      select: getRoomSelector,
    });

    return room;
  }

  /**
   * delete one room
   * @param {number} id roomId(=itemId in DB)
   */
  async deleteOne(id: number) {
    try {
      await this.prisma.room.delete({
        where: { itemId: id },
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
   * @param {number} id roomId(=itemId in DB)
   * @param {number} existingRoomMembersLength length of existing room members
   * @returns {Promise<GetRoomDTO>}
   */
  async joinRoom(
    id: string,
    existingRoomMembersLength: number,
  ): Promise<GetRoomDTO> {
    try {
      const itemId = parseInt(id, 10);
      if (isNaN(itemId)) {
        this.logger.warn('Room not found :: room id is NaN');
      }

      const room: GetRoomDTO = await this.prisma.room.update({
        where: { itemId },
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
   * @param {number} id roomId(=itemId in DB)
   * @param {number} currentRoomMembersLength length of current room members
   * @returns {Promise<GetRoomDTO>}
   */
  async leaveRoom(
    id: string,
    currentRoomMembersLength: number,
  ): Promise<GetRoomDTO> {
    try {
      const itemId = parseInt(id, 10);
      if (isNaN(itemId)) {
        this.logger.warn('Room not found :: room id is NaN');
      }

      let room = await this.prisma.room.update({
        where: { itemId },
        data: { current: currentRoomMembersLength },
        select: getRoomSelector,
      });

      if (!room) {
        this.logger.warn('Room not found :: no data');
      }

      if (room.current < 0) {
        this.logger.warn('[ASSERT] Tried to set room current value to minus');
        room = await this.prisma.room.update({
          where: { itemId: parseInt(id, 10) },
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
   * @param {number} id roomId(=itemId in DB)
   * @returns {Promise<number>}
   */
  async getRoomCapacity(id: number): Promise<number> {
    try {
      if (isNaN(id)) {
        return 0;
      }

      const room = await this.prisma.room.findFirst({
        where: { itemId: id },
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
}
