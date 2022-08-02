import { Module } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';

@Module({
  controllers: [],
  providers: [RoomsService, RoomGateway],
})
export class GatewayModule {}
