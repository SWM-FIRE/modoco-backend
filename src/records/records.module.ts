import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';

@Module({
  providers: [RecordsService],
  controllers: [RecordsController],
})
export class RecordsModule {}
