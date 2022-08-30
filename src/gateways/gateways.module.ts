import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';
import { RoomGatewayService } from './room.gateway.service';

@Module({
  controllers: [],
  providers: [RoomsService, RoomGateway, RoomGatewayService, RecordsService],
})
export class GatewayModule {}
