import { Module } from '@nestjs/common';
import { LobbyGateway } from './lobby.gateway';
import { UsersService } from '../users/users.service';
import { AuthModule } from '../auth/auth.module';
import { UsersHelper } from 'src/users/helper/users.helper';
import { UsersDatabaseHelper } from 'src/users/helper/users-database.helper';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [LobbyGateway, UsersService, UsersDatabaseHelper, UsersHelper],
})
export class LobbyGatewayModule {}
