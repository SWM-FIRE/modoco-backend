import * as uuid from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersHelper {
  constructor(private readonly configService: ConfigService) {}

  generateSignupVerifyToken() {
    return uuid.v1();
  }

  getRandomAvatar() {
    const min = 1;
    const max = this.configService.get('AVATAR_MAX_COUNT') as number;

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
