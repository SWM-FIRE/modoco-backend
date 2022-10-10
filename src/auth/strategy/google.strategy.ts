import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { CreateGoogleUserDTO } from 'src/users/dto';
import { AuthService } from '../auth.service';
import { UsersDatabaseHelper } from '../../users/helper/users-database.helper';
import { generateSignupVerifyToken } from 'src/users/helper/user.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    readonly configService: ConfigService,
    readonly usersDatabaseHelper: UsersDatabaseHelper,
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
        // send verification email
        await this.emailService.sendVerificationMail(
          user.uid,
          user.email,
          user.verify_token,
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

  private async createGoogleUser(dto: CreateGoogleUserDTO) {
    try {
      const verifyToken = generateSignupVerifyToken();

      const user = await this.usersDatabaseHelper.createGoogleUser(
        dto.nickname,
        dto.email,
        dto.googleId,
        verifyToken,
      );

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
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
