import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { RoomGateway } from './gateways/room.gateway';
import { ChatGateway } from './gateways/chat.gateway';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    UsersModule,
    PrismaModule,
  ],
  controllers: [AppController, RoomsController],
  providers: [AppService, RoomsService, RoomGateway, ChatGateway],
})
export class AppModule {}
