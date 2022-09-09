import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtStrategy, wsJwtStrategy, kakaoStrategy } from './strategy/';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    jwtStrategy,
    wsJwtStrategy,
    kakaoStrategy,
    UsersService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
