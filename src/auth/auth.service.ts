import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  passwordMatch(password: string, hash: string): Promise<boolean> {
    return argon.verify(hash, password);
  }

  generateHash(password: string) {
    return argon.hash(password);
  }

  async signToken(userId: any, email: string): Promise<string> {
    const JWT_SECRET = this.configService.get('JWT_SECRET');

    const payload = {
      sub: userId,
      email,
    };

    return this.jwt.signAsync(payload, { expiresIn: '5m', secret: JWT_SECRET });
  }
}
