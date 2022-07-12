import { Injectable } from '@nestjs/common';
import { CreateRoomDTO } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
    await this.prisma.room.delete({
      where: { itemId: id },
    });
  }
}
