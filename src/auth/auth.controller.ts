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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  AUTH_FRONTEND_URL: string = this.configService.get('AUTH_FRONTEND_URL');

  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({
    summary: 'Kakao Login',
    description: 'FE에서 Kakao Login을 위한 Endpoint입니다.',
  })
  @Get('kakao')
  @UseGuards(KakaoGuard)
  loginKakao() {
    return 'loginKakao';
  }

  @ApiOperation({
    summary: 'Kakao Login Callback URL',
    description:
      'Kakao Auth 서버에서 code를 담아 리다이렉션 해줄 Callback URL입니다.',
  })
  @Get('kakao/oauth')
  @UseGuards(KakaoGuard)
  @UseFilters(OAuthFilter)
  @Redirect('https://modocode.com/auth', HttpStatus.FOUND)
  loginKakaoRedirect(@GetUserDecorator() user) {
    return {
      url: `${this.AUTH_FRONTEND_URL}?access_token=${user.access_token}`,
    };
  }

  @ApiOperation({
    summary: 'GitHub Login',
    description: 'FE에서 GitHub Login을 위한 Endpoint입니다.',
  })
  @Get('github')
  @UseGuards(GithubGuard)
  loginGithub() {
    return 'loginGithub';
  }

  @ApiOperation({
    summary: 'GitHub Login Callback URL',
    description:
      'GitHub Auth 서버에서 code를 담아 리다이렉션 해줄 Callback URL입니다.',
  })
  @Get('github/oauth')
  @UseGuards(GithubGuard)
  @UseFilters(OAuthFilter)
  @Redirect('https://modocode.com/auth', HttpStatus.FOUND)
  loginGithubRedirect(@GetUserDecorator() user) {
    return {
      url: `${this.AUTH_FRONTEND_URL}?access_token=${user.access_token}`,
    };
  }

  @ApiOperation({
    summary: 'Google Login',
    description: 'FE에서 Google Login을 위한 Endpoint입니다.',
  })
  @Get('google')
  @UseGuards(GoogleGuard)
  loginGoogle() {
    return 'loginGoogle';
  }

  @ApiOperation({
    summary: 'Google Login Callback URL',
    description:
      'Google Auth 서버에서 code를 담아 리다이렉션 해줄 Callback URL입니다.',
  })
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
