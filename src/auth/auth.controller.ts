import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('kakao')
  loginKakao(): string {
    return 'works';
  }
}
