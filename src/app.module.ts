import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { GatewayModule } from './gateways/gateways.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { RecordsModule } from './records/records.module';
import { FriendsModule } from './friends/friends.module';
import environmentConfig from './config/environmentConfig';
import swaggerConfig from './config/swaggerConfig';
import jwtConfig from './config/jwtConfig';
import authConfig from './config/authConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig, swaggerConfig, jwtConfig, authConfig],
      cache: true,
    }),
    UsersModule,
    RoomsModule,
    GatewayModule,
    PrismaModule,
    AuthModule,
    SessionModule,
    RecordsModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
