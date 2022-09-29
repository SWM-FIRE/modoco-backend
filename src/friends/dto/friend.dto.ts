import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ApiTags('friendships')
export class CreateFriendDto {
  @ApiProperty({
    description: 'Friend uid',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}

@ApiTags('friendships')
export class UpdateFriendDto {
  @ApiProperty({
    description: 'Friend uid',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}

@ApiTags('friendships')
export class DeleteFriendDto {
  @ApiProperty({
    description: 'Friend uid',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}
