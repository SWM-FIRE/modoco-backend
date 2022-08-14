import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecordDTO } from './dto/CreateRecordDto';

@Injectable()
export class RecordsService {
  constructor(private readonly prismaService: PrismaService) {}

  async recordTime(user: User) {
    // check if record exists

    // if not exists, create record
    // if exists, update record

    return 'Update duration';
  }

  private async create(user: User, dto: CreateRecordDTO) {
    return 'Create Record if not exists';
  }

  async findAllRecord(user: User) {
    // find all records of user
    return 'Find All Records';
  }

  private async getRecordCount(user: User) {
    return 'Get Record Count';
  }
}
