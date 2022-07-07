import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly users: User[] = [];

  async create(dto: User): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        ...dto,
      },
    });

    delete user.createdAt;

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async update(dto: User) {
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
