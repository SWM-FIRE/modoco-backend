import { ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiTags('socket')
export class CandidatePayload {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
  candidate: RTCIceCandidateInit;
}
