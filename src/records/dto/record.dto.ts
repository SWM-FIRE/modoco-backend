import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { GetUserDTO } from 'src/users/dto';

@ApiTags('records')
export class CreateRecordDTO {
  @IsOptional()
  @IsNumber()
  room?: number;
}

@ApiTags('records')
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
