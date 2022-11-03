import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  static active = true;

  /**
   * used for health check
   */
  getWelcomeMessage(): string {
    if (!AppService.active) {
      throw new ForbiddenException('App is shutting down');
    }
    return 'Welcome to Modoco API Server.';
  }
}
