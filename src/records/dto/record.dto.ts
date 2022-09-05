import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { GetUserDTO } from 'src/users/dto';

export class CreateRecordDTO {
  @IsOptional()
  @IsNumber()
  room?: number;
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
  @IsNumber()
  room?: number;
}
