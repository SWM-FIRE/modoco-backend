import { ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

@ApiTags('rooms')
class Moderator {
  @ApiProperty({
    description: 'The user id',
    type: Number,
  })
  uid: number;
}

@ApiTags('rooms')
export class CreateRoomDTO {
  @ApiProperty({
    description: 'The name of the room',
    type: String,
  })
  @MaxLength(21)
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Whether it is public or private',
    type: Boolean,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPublic: boolean;

  @ApiProperty({
    description: 'Password of the room. Should be exactly 4 characters.',
    type: String,
    maxLength: 4,
    minLength: 4,
  })
  @ValidateIf((o) => o.isPublic === false) // if isPublic is false, password is required
  @MinLength(4)
  @MaxLength(4)
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'The description of the room',
    required: false,
    type: String,
  })
  @IsOptional()
  @MaxLength(31)
  @IsString()
  details?: string;

  @ApiProperty({
    description: 'The tags of the room',
    type: 'array',
    items: {
      type: 'string',
    },
  })
  @MaxLength(15, { each: true, message: '최대 15자까지 입력 가능합니다.' })
  @IsArray()
  tags: string[];

  @ApiProperty({
    description: 'The max number of users in the room',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  @Max(4)
  @Min(2)
  total: number;

  @ApiProperty({
    description: 'The theme of the room',
    type: 'string',
  })
  @IsNotEmpty()
  @MaxLength(30)
  @IsString()
  theme: string;
}

@ApiTags('rooms')
export class GetRoomDTO {
  @ApiProperty({
    description: 'The creater of the room',
    type: Moderator,
  })
  @IsNotEmpty()
  @IsObject()
  moderator: {
    nickname: string;
    uid: number;
    avatar: number;
  };

  @ApiProperty({
    description: 'Whether it is public or private',
    type: Boolean,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPublic: boolean;

  @ApiProperty({
    description: 'The name of the room',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The description of the room',
    required: false,
    type: String,
  })
  @IsString()
  details?: string;

  @ApiProperty({
    description: 'The tags of the room',
    type: 'array',
    items: {
      type: 'string',
    },
  })
  @IsArray()
  tags: string[];

  @ApiProperty({
    description: 'The max number of users in the room',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'The current number of users in the room',
    type: 'number',
  })
  @IsNotEmpty()
  @IsNumber()
  current: number;

  @ApiProperty({
    description: 'The theme of the room',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  theme: string;
}

export const getRoomSelector = {
  itemId: true,
  moderator: {
    select: {
      nickname: true,
      uid: true,
      avatar: true,
    },
  },
  title: true,
  details: true,
  tags: true,
  current: true,
  total: true,
  theme: true,
  isPublic: true,
  createdAt: true,
};
