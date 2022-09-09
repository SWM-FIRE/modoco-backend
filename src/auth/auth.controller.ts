import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetUserDecorator } from './decorator';
import { KakaoGuard } from './guard/kakao.guard';

@Controller('auth')
export class AuthController {
  @Get('kakao')
  @UseGuards(KakaoGuard)
  loginKakao() {
    return 'loginKakao';
  }

  @Get('kakao/oauth')
  @UseGuards(KakaoGuard)
  loginKakaoRedirect(@GetUserDecorator() user, @Query('code') code) {
    return {
      user,
      code,
    };
  }
}
