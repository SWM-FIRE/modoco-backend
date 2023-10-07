import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { CreateGoogleUserDTO } from 'src/users/dto';
import { AuthService } from '../auth.service';
import { UsersDatabaseHelper } from '../../users/helper/users-database.helper';
import { Prisma } from '@prisma/client';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private logger: Logger = new Logger('GoogleStrategy');

  constructor(
    readonly configService: ConfigService,
    readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {
    const GOOGLE_CLIENT_ID = configService.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = configService.get('GOOGLE_CLIENT_SECRET');
    const GOOGLE_CALLBACK_URL = configService.get('GOOGLE_CALLBACK_URL');

    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      //state: true,
    });
  }

  async validate(accessToken, refreshToken, profile: profile, done) {
    const googleId = profile.id;
    const nickname = profile.displayName;
    let email: string = null;
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    }

    const createUserDTO: CreateGoogleUserDTO = {
      googleId,
      nickname,
      email,
    };

    // find user in modoco db
    let user = await this.usersDatabaseHelper.findUserByGoogleId(googleId);
    if (!user) {
      try {
        // create user in modoco db
        user = await this.createGoogleUser(createUserDTO);
        // send signup congratulation email
        await this.emailService.sendSignupSucceedMail(
          user.nickname,
          user.email,
        );
      } catch (error) {
        this.logger.error('[GoogleStrategy] Error creating user', error.stack);
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

  private async createGoogleUser(dto: CreateGoogleUserDTO) {
    try {
      const user = await this.usersDatabaseHelper.createGoogleUser(
        dto.nickname,
        dto.email,
        dto.googleId,
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

type profile = {
  id: string;
  displayName: string;
  name: { familyName: string; givenName: string };
  emails: [{ value: string; verified: boolean }];
  photos: [
    {
      value: string;
    },
  ];
  provider: string;
  _raw: string;
  _json: profileJson;
};

type profileJson = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
};
