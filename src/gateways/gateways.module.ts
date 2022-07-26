import { Module } from '@nestjs/common';
import { RoomsService } from 'src/rooms/rooms.service';
import { ChatGateway } from './chat.gateway';
import { VideoGateway } from './video.gateway';

@Module({
  controllers: [],
  providers: [RoomsService, VideoGateway, ChatGateway],
})
export class GatewayModule {}
