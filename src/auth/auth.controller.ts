import {
  Controller,
  Get,
  HttpStatus,
  Redirect,
  UseGuards,
} from '@nestjs/common';
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
  @Redirect('https://modocode.com', HttpStatus.FOUND)
  loginKakaoRedirect(@GetUserDecorator() user) {
    // redirect to frontend
    return { url: `https://modocode.com?access_token=${user.access_token}` };
  }
}
