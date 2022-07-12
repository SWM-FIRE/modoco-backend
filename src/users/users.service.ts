import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          console.warn('User not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }

  async delete(uid: string) {
    try {
      await this.prisma.user.delete({
        where: {
          uid,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          console.warn('User not found');
          console.warn(e.message);
        }
      }
      //throw e;
    }
  }
}
