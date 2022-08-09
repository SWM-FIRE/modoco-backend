import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@ApiTags('sessions')
export class CreateSessionDTO {
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
