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
}
