import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeMessage(): string {
    return 'Welcome to Modoco Server';
  }
}
