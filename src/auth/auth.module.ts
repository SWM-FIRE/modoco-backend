import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtStrategy, wsJwtStrategy, kakaoStrategy } from './strategy/';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, jwtStrategy, wsJwtStrategy, kakaoStrategy],
  exports: [AuthService],
})
export class AuthModule {}
