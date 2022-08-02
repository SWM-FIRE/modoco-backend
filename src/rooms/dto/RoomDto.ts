import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';

class Moderator {
  @ApiProperty({
    description: 'The user id',
    type: String,
  })
  uid: string;
}

export class CreateRoomDTO {
  @ApiProperty({
    description: 'The creater of the room',
    type: Moderator,
  })
  @IsNotEmpty()
  @IsObject()
  moderator: Moderator;

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
    description: 'The theme of the room',
    type: 'string',
  })
  @IsNotEmpty()
  @IsString()
  theme: string;
}

export class GetRoomDTO {
  @ApiProperty({
    description: 'The creater of the room',
    type: Moderator,
  })
  @IsNotEmpty()
  @IsObject()
  moderator: {
    nickname: string;
    avatar: string;
  };

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
      avatar: true,
    },
  },
  title: true,
  details: true,
  tags: true,
  current: true,
  total: true,
  theme: true,
};
