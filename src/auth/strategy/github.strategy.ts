import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { CreateGithubUserDTO } from 'src/users/dto';
import { AuthService } from '../auth.service';
import { UsersDatabaseHelper } from '../../users/helper/users-database.helper';
import { Prisma } from '@prisma/client';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private logger: Logger = new Logger('GithubStrategy');

  constructor(
    readonly configService: ConfigService,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {
    const GITHUB_CLIENT_ID = configService.get('GITHUB_CLIENT_ID');
    const GITHUB_CLIENT_SECRET = configService.get('GITHUB_CLIENT_SECRET');
    const GITHUB_CALLBACK_URL = configService.get('GITHUB_CALLBACK_URL');

    super({
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
      scope: ['user:email'],
      userAgent: 'modocode',
    });
  }

  async validate(accessToken, refreshToken, profile, done) {
    const { id, name, email }: profileJson = profile._json;
    const githubId = id.toString();

    const createUserDTO: CreateGithubUserDTO = {
      githubId,
      nickname: name,
      email: email,
    };

    // find user in modoco db
    let user = await this.usersDatabaseHelper.findUserByGithubId(githubId);
    if (!user) {
      try {
        // create user in modoco db
        user = await this.createGithubUser(createUserDTO);
        // send signup congratulation email
        await this.emailService.sendSignupSucceedMail(
          user.nickname,
          user.email,
        );
      } catch (error) {
        this.logger.error('[GithubStrategy] Error creating user', error.stack);
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

  private async createGithubUser(dto: CreateGithubUserDTO) {
    try {
      const user = await this.usersDatabaseHelper.createGithubUser(
        dto.nickname,
        dto.email,
        dto.githubId,
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
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: false;
  name: string;
  company: string;
  blog: string;
  location: string | null;
  email: string;
  hireable: string | null;
  bio: string;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};
