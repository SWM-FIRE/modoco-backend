import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(readonly configService: ConfigService) {
    const GITHUB_CLIENT_ID = configService.get('GITHUB_CLIENT_ID');
    const GITHUB_CLIENT_SECRET = configService.get('GITHUB_CLIENT_SECRET');
    const GITHUB_CALLBACK_URL = configService.get('GITHUB_CALLBACK_URL');

    super({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
    });
  }

  async validate(accessToken, refreshToken, profile, done) {
    // unimplemented
  }
}
