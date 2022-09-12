import { ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
export class CreateKakaoUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsNumber()
  @IsNotEmpty()
  kakaoId: number;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

@ApiTags('users')
export class CreateGithubUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsNumber()
  @IsNotEmpty()
  githubId: number;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email: string;
}

@ApiTags('users')
export class CreateGoogleUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  googleId: string;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email: string;
}

@ApiTags('users')
export class GetUserDTO {
  @ApiProperty({
    description: "The user's uid",
    type: Number,
  })
  @IsNumber()
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

@ApiTags('users')
export class UpdateUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    required: false,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  avatar?: number;

  @ApiProperty({
    description: 'The email of the user',
    required: false,
    type: String,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The password of the user',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

/**
 * jwtToken UserDTO
 * User without hash
 */
export type User = {
  uid: number;
  createdAt: Date;
  updatedAt: Date;
  nickname: string;
  email: string;
  hash?: string;
  avatar: number;
};
