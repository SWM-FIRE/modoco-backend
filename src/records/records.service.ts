import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecordDTO } from './dto';

@Injectable()
export class RecordsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async recordTime(user: User, dto) {
    const count = await this.getRecordCount(user);

    // check if record exists
    if (count === 0) {
      // create record
      await this.createRecord(user, dto);
    } else {
      // update record
      const recordId = await this.getRecentRecordId(user);

      await this.updateRecord(user, recordId);
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
    //console.log(this.longerThen1min(user));
    if (await this.longerThen1min(user)) {
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
      return;
    }
  }

  findAllRecord(user: User) {
    return this.prismaService.record.findMany({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });
  }

  async getRecentRecordId(user: User) {
    // assume only one record exists
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
    return this.prismaService.record.deleteMany({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });
  }

  // check number of records that user has
  private async getRecordCount(user: User) {
    return await this.prismaService.record.count({
      where: {
        user: {
          uid: user.uid,
        },
      },
    });
  }

  private async longerThen1min(user: User) {
    const ADVANTAGE_SECOND = 5000;

    try {
      const record = await this.prismaService.record.findFirst({
        where: {
          user: {
            uid: user.uid,
          },
        },
        select: {
          updatedAt: true,
        },
      });

      // check if record is older than 1 minute
      const deltaTime = Date.now() - new Date(record.updatedAt).getTime();
      const deltaMinutes = Math.floor(
        (deltaTime + ADVANTAGE_SECOND) / (60 * 1000),
      );

      return deltaMinutes >= 1;
    } catch (e) {
      console.log(e);
    }
  }
}
