import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { GetUserDTO } from 'src/users/dto';

export class CreateRecordDTO {
  @IsOptional()
  @IsString()
  room?: string;
}

export class GetRecordDTO {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  createdAt: Date;

  @IsNotEmpty()
  updatedAt: Date;

  @IsNotEmpty()
  user: GetUserDTO;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  duration: number;

  @IsOptional()
  @IsString()
  room?: string;
}
