import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecordsService } from './records.service';

@ApiTags('records')
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}
}
