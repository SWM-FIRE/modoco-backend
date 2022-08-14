import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetUserDecorator } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { RecordsService } from './records.service';

@ApiTags('records')
@Controller('records')
@UseGuards(JwtGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  findAllRecord(@GetUserDecorator() user) {
    return this.recordsService.findAllRecord(user);
  }

  @Delete()
  deleteAllRecords(@GetUserDecorator() user) {
    return this.recordsService.deleteAllRecords(user);
  }
}
