import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';

@Injectable()
export class kakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(readonly configService: ConfigService) {
    const KAKAO_CLIENT_ID = configService.get('KAKAO_CLIENT_ID');
    const KAKAO_CALLBACK_URL = configService.get('KAKAO_CALLBACK_URL');

    super({
      clientID: KAKAO_CLIENT_ID,
      callbackURL: KAKAO_CALLBACK_URL,
    });
  }

  async validate(accessToken, refreshToken, profile, done) {
    const { id, kakao_account }: profileJson = profile._json;
    console.log(kakao_account);
    const payload = {
      nickname: kakao_account.profile.nickname,
      kakaoId: id,
      email: kakao_account.email,
    };

    done(null, payload);
  }
}

type profileJson = {
  id: number;
  connected_at: string;
  properties: { nickname: string };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile: { nickname: string };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
  };
};
