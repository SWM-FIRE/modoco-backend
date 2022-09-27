import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ApiTags('friendships')
export class CreateFriendDto {
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}

@ApiTags('friendships')
export class UpdateFriendDto {
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}
