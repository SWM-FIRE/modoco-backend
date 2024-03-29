import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private configService: ConfigService) {}

  static passwordMatch(password: string, hash: string): Promise<boolean> {
    return argon.verify(hash, password);
  }

  static generateHash(password: string) {
    return argon.hash(password);
  }

  async verifyToken(token: string) {
    const JWT_SECRET = this.configService.get('JWT_SECRET');
    return this.jwt.verify(token, { secret: JWT_SECRET });
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const JWT_SECRET = this.configService.get('JWT_SECRET');
    const EXPIRES_IN = this.configService.get('JWT_EXPIRES_IN');

    const payload = {
      sub: userId,
      email,
    };

    const jwtToken = await this.jwt.signAsync(payload, {
      expiresIn: EXPIRES_IN,
      secret: JWT_SECRET,
    });

    return {
      access_token: jwtToken,
    };
  }
}
