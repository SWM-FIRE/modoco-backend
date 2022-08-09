import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async signToken(userId: any, email: string): Promise<string> {
    const JWT_SECRET = this.configService.get('JWT_SECRET');

    const payload = {
      sub: userId,
      email,
    };

    return this.jwt.signAsync(payload, { expiresIn: '5m', secret: JWT_SECRET });
  }
}
