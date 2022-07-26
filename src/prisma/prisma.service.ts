import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private configService: ConfigService) {
    const DATABASE_URL = configService.get('DATABASE_URL');

    super({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });
    // console.log database url
    console.log(`Connect to Database : ${DATABASE_URL.split('@')[1]}`);
  }
}
