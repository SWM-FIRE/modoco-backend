import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';
import { UsersHelper } from 'src/users/helper/users.helper';
import { UsersService } from 'src/users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  JwtStrategy,
  WsJwtStrategy,
  KakaoStrategy,
  GithubStrategy,
  GoogleStrategy,
} from './strategy/';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    WsJwtStrategy,
    KakaoStrategy,
    UsersService,
    GithubStrategy,
    GoogleStrategy,
    UsersDatabaseHelper,
    UsersHelper,
    EmailService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
