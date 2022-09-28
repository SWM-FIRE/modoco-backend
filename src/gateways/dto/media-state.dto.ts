import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@ApiTags('socket')
export class MediaStateChangePayload {
  @IsOptional()
  @IsString()
  uid?: string;

  @IsNotEmpty()
  @IsString()
  room: string;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;
}
