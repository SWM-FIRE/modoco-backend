import { Module } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';
import { ChatGateway } from './chat.gateway';
import { RoomGateway } from './room.gateway';
import { VideoGateway } from './video.gateway';

@Module({
  controllers: [],
  providers: [RoomsService, VideoGateway, ChatGateway, RoomGateway],
})
export class GatewayModule {}
