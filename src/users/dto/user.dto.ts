import { ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

@ApiTags('users')
export class CreateUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
  })
  @IsString()
  @MaxLength(15)
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(30)
  @Min(1)
  avatar: number;

  @ApiProperty({
    description: 'The email of the user. Max length is 60',
    type: String,
  })
  @IsNotEmpty()
  @MaxLength(60)
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
  })
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(8)
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

  @IsString()
  @IsNotEmpty()
  kakaoId: string;

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

  @IsString()
  @IsNotEmpty()
  githubId: string;

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
    description: 'The status quo of the user',
    type: String,
  })
  @IsString()
  @IsOptional()
  status_quo: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  avatar: string;

  @ApiProperty({
    description: 'The github link of the user',
    format: 'url',
    type: String,
  })
  @IsString()
  @IsOptional()
  github_link?: string;

  @ApiProperty({
    description: 'The blog link of the user',
    format: 'url',
    type: String,
  })
  @IsString()
  @IsOptional()
  blog_link?: string;

  @ApiProperty({
    description: 'The group list of the user',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true, message: '최대 100자까지 입력 가능합니다.' })
  @IsOptional()
  groups: string[];

  @ApiProperty({
    description: 'The badge list of the user',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  badges: string[];
}

@ApiTags('users')
export class UpdateUserDTO {
  @ApiProperty({
    description: 'The nickname of the user',
    required: false,
    type: String,
  })
  @IsString()
  @MaxLength(15)
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: 'The email of the user',
    required: false,
    type: String,
  })
  @IsEmail()
  @MaxLength(60)
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'The password of the user',
    required: false,
    type: String,
  })
  @IsString()
  @MaxLength(20)
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'The status quo of the user',
    required: false,
    default: '내 상태 메시지를 입력해주세요.',
    type: String,
  })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  status_quo?: string;

  @ApiProperty({
    description: 'The avatar type of the user',
    required: false,
    default: 1,
    type: Number,
  })
  @IsNumber()
  @Max(30)
  @Min(1)
  @IsOptional()
  avatar?: number;

  @ApiProperty({
    description: 'The github link of the user. It must be a valid URL',
    required: false,
    format: 'url',
    default: 'https://shouldbe.url.com',
    type: String,
  })
  @IsOptional()
  @MaxLength(100)
  @IsString()
  github_link?: string;

  @ApiProperty({
    description: 'The blog link of the user. It must be a valid URL',
    required: false,
    format: 'url',
    default: 'https://shouldbe.url.com',
    type: String,
  })
  @IsOptional()
  @MaxLength(100)
  @IsString()
  blog_link?: string;

  @ApiProperty({
    description:
      'The group list of the user. Items shoud be unique, and max length is 100',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  @MaxLength(100, { each: true, message: '최대 100자까지 입력 가능합니다.' })
  @IsOptional()
  groups?: string[];
}
