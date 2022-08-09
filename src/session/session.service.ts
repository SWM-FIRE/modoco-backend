import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDTO } from './dto';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
  ) {}
  async create(dto: CreateSessionDTO) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credential incorrect');
    }

    const passwordMatches = await this.authService.passwordMatch(
      dto.password,
      user.hash,
    );

    if (!passwordMatches) {
      throw new ForbiddenException('Credential incorrect');
    }

    delete user.hash;

    return user;
  }
}
