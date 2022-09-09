import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { GetUserDecorator } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  loginKakao(@GetUserDecorator() user) {
    return user;
  }
}
