import { Module } from '@nestjs/common';
import { LobbyGateway } from './lobby.gateway';
import { UsersService } from '../users/users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [LobbyGateway, UsersService],
})
export class LobbyGatewayModule {}
