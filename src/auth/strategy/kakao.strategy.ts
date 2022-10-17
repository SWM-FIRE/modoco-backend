import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { CreateKakaoUserDTO } from 'src/users/dto';
import { AuthService } from '../auth.service';
import { UsersDatabaseHelper } from '../../users/helper/users-database.helper';
import { EmailService } from 'src/email/email.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    readonly configService: ConfigService,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {
    const KAKAO_CLIENT_ID = configService.get('KAKAO_CLIENT_ID');
    const KAKAO_CALLBACK_URL = configService.get('KAKAO_CALLBACK_URL');

    super({
      clientID: KAKAO_CLIENT_ID,
      callbackURL: KAKAO_CALLBACK_URL,
    });
  }

  async validate(accessToken, refreshToken, profile, done) {
    const { id, kakao_account }: profileJson = profile._json;
    const kakaoId = id.toString();

    const createUserDTO: CreateKakaoUserDTO = {
      kakaoId,
      nickname: kakao_account.profile.nickname,
      email: kakao_account.email,
    };

    // find user in modoco db
    let user = await this.usersDatabaseHelper.findUserByKakaoId(kakaoId);
    if (!user) {
      try {
        // create user in modoco db
        user = await this.createKakaoUser(createUserDTO);
        // send signup congratulation email
        await this.emailService.sendSignupSucceedMail(
          user.nickname,
          user.email,
        );
      } catch (error) {
        done(error);
      }
    }

    // create jwt token
    const { access_token } = await this.authService.signToken(
      user.uid,
      user.email,
    );

    // attach user to express request
    done(null, {
      ...user,
      access_token,
    });
  }

  private async createKakaoUser(dto: CreateKakaoUserDTO) {
    try {
      const user = await this.usersDatabaseHelper.createKakaoUser(
        dto.nickname,
        dto?.email,
        dto.kakaoId,
      );

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // 이미 존재하는 이메일
        throw new ForbiddenException('Verification email sent');
      }
      throw error;
    }
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
