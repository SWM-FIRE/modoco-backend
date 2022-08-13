import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtStrategy } from './strategy';
import { wsJwtStrategy } from './strategy/wsJwt.strategy';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, jwtStrategy, wsJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
