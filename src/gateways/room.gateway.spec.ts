import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';

describe('RoomGateway', () => {
  let gateway: RoomGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomGateway, RoomsService, PrismaService, ConfigService],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
