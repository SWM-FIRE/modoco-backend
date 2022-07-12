import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';

class Moderator {
  uid: string;
}

export class CreateRoomDTO {
  @IsNotEmpty()
  @IsObject()
  moderator: Moderator;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  details?: string;

  @IsArray()
  tags: string[];

  @IsNotEmpty()
  @IsNumber()
  current: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;
}
