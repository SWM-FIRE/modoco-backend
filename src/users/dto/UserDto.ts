import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @ApiProperty({
    description: "The user's id",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  avatar: string;
}
