import { Injectable } from '@nestjs/common';
import { CreateRoomDTO, GetRoomDTO, getRoomSelector } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a room and return the room object
   * @param {CreateRoomDTO} dto create room dto
   * @returns {Promise<CreateRoomDTO>}
   */
  async create(dto: CreateRoomDTO) {
    const room = await this.prisma.room.create({
      data: {
        moderator: {
          connect: { uid: dto.moderator.uid },
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

    return room;
  }

  /**
   * find all rooms and return all rooms
   * @returns {Promise<GetRoomDTO[]>}
   */
  async findAll(): Promise<GetRoomDTO[]> {
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
  async getOne(id: number): Promise<GetRoomDTO> {
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
          console.warn('Room not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }

  /**
   * update room in DB when user join room
   * @param {number} id roomId(=itemId in DB)
   * @returns {Promise<GetRoomDTO>}
   */
  async joinRoom(id: string): Promise<GetRoomDTO> {
    try {
      const room: GetRoomDTO = await this.prisma.room.update({
        where: { itemId: parseInt(id, 10) },
        data: { current: { increment: 1 } },
        select: getRoomSelector,
      });

      if (!room) {
        throw new Error('Room not found');
      }

      return room;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          console.warn('Room not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }

  /**
   * update room in DB when user leave room
   * @param {number} id roomId(=itemId in DB)
   * @returns {Promise<GetRoomDTO>}
   */
  async leaveRoom(id: string): Promise<GetRoomDTO> {
    try {
      let room = await this.prisma.room.update({
        where: { itemId: parseInt(id, 10) },
        data: { current: { decrement: 1 } },
        select: getRoomSelector,
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.current < 0) {
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
          console.warn('Room not found');
          console.warn(e.message);
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
          console.warn('Room not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }
}
