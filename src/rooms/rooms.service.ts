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
        id: dto.id,
        name: dto.name,
        current: dto.current,
        total: dto.total,
        image: dto.image,
      },
    });

    return room;
  }

  findAll(): RoomDto[] {
    return this.rooms;
  }

  getOne(id: string): RoomDto {
    return this.rooms.find((room) => room.id === id);
  }

  deleteOne(id: string): boolean {
    const index = this.rooms.map((room) => room.id).indexOf(id);
    if (index === -1) return false;

    this.rooms.splice(index, 1);
    return true;
  }
}
