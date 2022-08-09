import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // async login(email: string) {
  //   this.authService.signToken(1, 'email');
  // }
}
