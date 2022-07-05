import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomsController } from './rooms/rooms.controller';
import { RoomsService } from './rooms/rooms.service';
import { ScreenShareGateway } from './gateways/screenshare.gateway';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    UsersModule,
  ],
  controllers: [AppController, RoomsController],
  providers: [AppService, RoomsService, ScreenShareGateway],
})
export class AppModule {}
