import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private configService: ConfigService) {
    const logger = new Logger('PrismaService');

    const DATABASE_URL = configService.get('DATABASE_URL');

    super({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    logger.debug(`Connect to Database : ${DATABASE_URL.split('@')[1]}`);
  }

  /**
   * @description Clean up all the data in the database
   * @purpose To clean up the database before test begins
   */
  cleanDatabase() {
    const ENV = this.configService.get('ENV');
    if (ENV === 'test') {
      return this.$transaction([
        this.room.deleteMany(),
        this.user.deleteMany(),
      ]);
    }
  }
}
