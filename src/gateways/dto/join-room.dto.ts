import { ApiTags } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@ApiTags('socket')
export class JoinRoomPayload {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsNumber()
  @IsNotEmpty()
  uid: number;

  @IsString()
  @MinLength(4)
  @MaxLength(4)
  @IsOptional()
  password?: string;
}
