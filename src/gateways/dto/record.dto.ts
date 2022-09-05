import { ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

@ApiTags('socket')
export class RecordPayload {
  @IsOptional()
  time: any;
}
