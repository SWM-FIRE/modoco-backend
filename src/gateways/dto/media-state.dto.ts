import { ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

@ApiTags('socket')
export class MediaStateChangePayload {
  @IsOptional()
  @IsNumber()
  uid?: number;

  @IsNotEmpty()
  @IsString()
  room: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
