import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prismaService: PrismaService,
    readonly configService: ConfigService,
  ) {
    const JWT_SECRET = configService.get('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // perform validate logic here
    const user = await this.prismaService.user.findUnique({
      where: {
        uid: payload.sub,
      },
    });

    // email not verified
    if (!user?.verified) {
      return false;
    }

    // email verified
    if (user) delete user.hash;
    return user;
  }
}
