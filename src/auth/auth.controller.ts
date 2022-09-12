import {
  Controller,
  Get,
  HttpStatus,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { GetUserDecorator } from './decorator';
import { GithubGuard, KakaoGuard, GoogleGuard } from './guard';

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

  @Get('google')
  @UseGuards(GoogleGuard)
  loginGoogle() {
    return 'loginGoogle';
  }

  @Get('google/oauth')
  @UseGuards(GoogleGuard)
  @Redirect('https://modocode.com', HttpStatus.FOUND)
  loginGoogleRedirect(@GetUserDecorator() user) {
    // redirect to frontend
    return { url: `https://modocode.com?access_token=${user.access_token}` };
  }
}
