import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

@ApiTags('users')
export class CreateUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  avatar: number;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

@ApiTags('users')
export class GetUserDTO {
  @ApiProperty({
    description: "The user's uid",
    type: Number,
  })
  @IsString()
  @IsNotEmpty()
  uid: number;

  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  avatar: string;
}
