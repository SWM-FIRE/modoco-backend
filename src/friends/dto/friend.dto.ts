import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

@ApiTags('friends')
export class CreateFriendDto {
  @IsNotEmpty()
  @IsNumber()
  friend: number;
}
