import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { VideoGateway } from './gateways/video.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import environmentConfig from './config/environmentConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
      cache: true,
    }),
    UsersModule,
    PrismaModule,
  ],
  controllers: [AppController, RoomsController],
  providers: [AppService, RoomsService, VideoGateway, ChatGateway],
})
export class AppModule {}
