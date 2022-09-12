import {
  Controller,
  Get,
  HttpStatus,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { GetUserDecorator } from './decorator';
import { GithubGuard } from './guard';
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

  @Get('github')
  @UseGuards(GithubGuard)
  loginGithub() {
    return 'loginGithub';
  }

  @Get('github/oauth')
  @UseGuards(GithubGuard)
  @Redirect('https://modocode.com', HttpStatus.FOUND)
  loginGithubRedirect(@GetUserDecorator() user) {
    // redirect to frontend
    return { url: `https://modocode.com?access_token=${user.access_token}` };
  }
}
