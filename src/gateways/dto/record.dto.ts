import { IsOptional } from 'class-validator';

export class RecordPayload {
  @IsOptional()
  time: any;
}
