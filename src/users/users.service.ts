import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDTO } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDTO): Promise<CreateUserDTO> {
    const user = await this.prisma.user.create({
      data: {
        ...dto,
      },
    });

    delete user.createdAt;

    return user;
  }

  async findAll(): Promise<CreateUserDTO[]> {
    const users = await this.prisma.user.findMany({
      select: {
        uid: true,
        nickname: true,
        avatar: true,
      },
    });
    return users;
  }

  async update(dto: CreateUserDTO) {
    try {
      const user = await this.prisma.user.update({
        where: {
          uid: dto.uid,
        },
        data: {
          ...dto,
        },
      });
      delete user.createdAt;

      return user;
    } catch (error) {
      throw new ForbiddenException('User not found');
    }
  }

  delete(uid: string) {
    try {
      this.prisma.user.delete({
        where: {
          uid,
        },
      });
    } catch (error) {
      throw new ForbiddenException('User not found');
    }
  }
}
