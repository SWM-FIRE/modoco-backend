import { AuthGuard } from '@nestjs/passport';

export class GoogleGuard extends AuthGuard('google') {
  constructor() {
    super();
  }
}
