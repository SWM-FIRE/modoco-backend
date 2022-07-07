import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from './interfaces/room.interface';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly rooms: Room[] = [];

  create(room: Room) {
    this.rooms.push(room);
  }

  findAll(): Room[] {
    return this.rooms;
  }

  getOne(id: string): Room {
    return this.rooms.find((room) => room.id === id);
  }

  deleteOne(id: string): boolean {
    const index = this.rooms.map((room) => room.id).indexOf(id);
    if (index === -1) return false;

    this.rooms.splice(index, 1);
    return true;
  }
}
