import {
  Controller,
  Get,
  HttpStatus,
  Redirect,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetUserDecorator } from './decorator';
import { GithubGuard, KakaoGuard, GoogleGuard } from './guard';
import { OAuthFilter } from './filters/oauth.filter';

@Controller('auth')
export class AuthController {
  AUTH_FRONTEND_URL: string = this.configService.get('AUTH_FRONTEND_URL');

  constructor(private readonly configService: ConfigService) {}

  @Get('kakao')
  @UseGuards(KakaoGuard)
  loginKakao() {
    return 'loginKakao';
  }

  @Get('kakao/oauth')
  @UseGuards(KakaoGuard)
  @UseFilters(OAuthFilter)
  @Redirect('https://modocode.com/auth', HttpStatus.FOUND)
  loginKakaoRedirect(@GetUserDecorator() user) {
    return {
      url: `${this.AUTH_FRONTEND_URL}?access_token=${user.access_token}`,
    };
  }

  @Get('github')
  @UseGuards(GithubGuard)
  loginGithub() {
    return 'loginGithub';
  }

  @Get('github/oauth')
  @UseGuards(GithubGuard)
  @UseFilters(OAuthFilter)
  @Redirect('https://modocode.com/auth', HttpStatus.FOUND)
  loginGithubRedirect(@GetUserDecorator() user) {
    return {
      url: `${this.AUTH_FRONTEND_URL}?access_token=${user.access_token}`,
    };
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  loginGoogle() {
    return 'loginGoogle';
  }

  @Get('google/oauth')
  @UseGuards(GoogleGuard)
  @UseFilters(OAuthFilter)
  @Redirect('https://modocode.com/auth', HttpStatus.FOUND)
  loginGoogleRedirect(@GetUserDecorator() user) {
    return {
      url: `${this.AUTH_FRONTEND_URL}?access_token=${user.access_token}`,
    };
  }
}
