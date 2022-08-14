import { Injectable } from '@nestjs/common';
import { Record, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecordDTO } from './dto/CreateRecordDto';

@Injectable()
export class RecordsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async recordTime(user: User, dto) {
    const count = await this.getRecordCount(user);

    // check if record exists
    if (count === 0) {
      // create record
      this.createRecord(user, dto);
    } else {
      // update record
      const recordId = await this.getRecentRecordId(user);
      this.updateRecord(user, recordId);
    }
  }

  private async createRecord(user: User, dto: CreateRecordDTO) {
    await this.prismaService.record.create({
      data: {
        user: {
          connect: {
            uid: user.uid,
          },
        },
        duration: 1,
      },
    });
  }

  private async updateRecord(user: User, recordId: number) {
    await this.prismaService.record.update({
      where: {
        id: recordId,
      },
      data: {
        duration: {
          increment: 1,
        },
      },
    });
  }

  findAllRecord(user: User) {
    const records = this.prismaService.record.findMany({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });

    return records;
  }

  async getRecentRecordId(user: User) {
    // assume only one record existsx
    const record = await this.prismaService.record.findFirst({
      where: {
        user: {
          uid: user.uid,
        },
      },
      select: {
        id: true,
      },
    });

    return record.id;
  }

  public deleteAllRecords(user: User) {
    const record = this.prismaService.record.deleteMany({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });

    return record;
  }

  // check number of records that user has
  private async getRecordCount(user: User) {
    const count = await this.prismaService.record.count({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });

    return count;
  }
}
