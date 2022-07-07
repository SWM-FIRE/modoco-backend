import { Injectable } from '@nestjs/common';
import { RoomDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly rooms: RoomDto[] = [];

  async create(dto: RoomDto) {
    const room = await this.prisma.room.create({
      data: {
        ...dto,
      },
    });

    delete room.createdAt;
    return room;
  }

  async findAll(): Promise<RoomDto[]> {
    const rooms = await this.prisma.room.findMany({
      select: {
        id: true,
        name: true,
        current: true,
        total: true,
        image: true,
        tags: true,
      },
    });
    return rooms;
  }

  async getOne(id: string): Promise<RoomDto> {
    const room = await this.prisma.room.findFirst({
      where: { id },
    });
    return room;
  }

  async deleteOne(id: string) {
    await this.prisma.room.delete({
      where: { id },
    });
  }
}
