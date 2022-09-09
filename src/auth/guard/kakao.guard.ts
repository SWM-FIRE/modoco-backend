import { AuthGuard } from '@nestjs/passport';

export class KakaoGuard extends AuthGuard('kakao') {
  constructor() {
    super();
  }
}
