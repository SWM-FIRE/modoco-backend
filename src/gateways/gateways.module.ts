import { Module } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomGateway } from './room.gateway';

@Module({
  controllers: [],
  providers: [RoomsService, RoomGateway, RecordsService],
})
export class GatewayModule {}
