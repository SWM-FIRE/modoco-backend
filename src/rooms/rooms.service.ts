import { Injectable } from '@nestjs/common';
import { CreateRoomDTO } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly rooms: CreateRoomDTO[] = [];

  async create(dto: CreateRoomDTO) {
    const room = await this.prisma.room.create({
      data: {
        moderator: {
          connect: { uid: dto.moderator.uid },
        },
        title: dto.title,
        details: dto.details,
        tags: dto.tags,
        current: dto.current,
        total: dto.total,
      },
      include: { moderator: true },
    });

    delete room.createdAt;
    delete room.moderatorId;
    delete room.moderator.createdAt;

    return room;
  }

  async findAll() {
    const rooms = await this.prisma.room.findMany({
      select: {
        itemId: true,
        moderator: {
          select: {
            nickname: true,
            avatar: true,
          },
        },
        title: true,
        details: true,
        tags: true,
        current: true,
        total: true,
      },
    });

    return rooms;
  }

  async getOne(id: number) {
    const room = await this.prisma.room.findFirst({
      where: { itemId: id },
    });

    return room;
  }

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

  async joinRoom(id: string) {
    try {
      const room = await this.prisma.room.update({
        where: { itemId: parseInt(id, 10) },
        data: { current: { increment: 1 } },
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

  async leaveRoom(id: string) {
    try {
      const room = await this.prisma.room.update({
        where: { itemId: parseInt(id, 10) },
        data: { current: { decrement: 1 } },
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
}
