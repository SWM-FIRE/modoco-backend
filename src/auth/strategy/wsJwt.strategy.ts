import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class wsJwtStrategy extends PassportStrategy(Strategy, 'wsJwt') {
  constructor(
    private readonly prismaService: PrismaService,
    readonly configService: ConfigService,
  ) {
    const JWT_SECRET = configService.get('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
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

    if (user) delete user.hash;

    return user;
  }
}
