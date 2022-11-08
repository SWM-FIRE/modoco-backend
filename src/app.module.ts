import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { GatewayModule } from './gateways/gateways.module';
import { LobbyGatewayModule } from './lobbyGateways/lobbyGateways.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { RecordsModule } from './records/records.module';
import { FriendsModule } from './friends/friends.module';
import { EmailService } from './email/email.service';
import EnvironmentConfig from './config/environment-config';
import SwaggerConfig from './config/swagger-config';
import JwtConfig from './config/jwt-config';
import AuthConfig from './config/auth-config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EnvironmentConfig, SwaggerConfig, JwtConfig, AuthConfig],
      cache: true,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    RoomsModule,
    GatewayModule,
    LobbyGatewayModule,
    PrismaModule,
    AuthModule,
    SessionModule,
    RecordsModule,
    FriendsModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
