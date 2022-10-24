import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { RoomGatewayService } from './room.gateway.service';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/guard/wsJwt.guard';
import { Logger, UseGuards, UsePipes } from '@nestjs/common';
import { EVENT } from './constants/event.enum';
import { WebsocketValidationPipe } from './pipes/socket-validation.pipe';
import {
  JoinRoomPayload,
  LeaveRoomPayload,
  MediaStateChangePayload,
} from './dto';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/playlist/',
})
@UsePipes(new WebsocketValidationPipe())
@UseGuards(WsJwtGuard)
export class PlaylistGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private logger: Logger = new Logger('PlaylistGateway');

  constructor(private readonly roomGatewayService: RoomGatewayService) {}

  // OnGatewayInit
  afterInit() {
    this.logger.log('[Init] Initialized PlaylistGateway');
  }

  // OnGatewayConnection
  handleConnection(client: Socket) {
    this.logger.log('[Connection] : ' + client.id);
  }

  // OnGatewayDisconnect
  handleDisconnect(client: Socket) {
    this.logger.log('[Disconnection] : ' + client.id);
  }

  @SubscribeMessage('playlist:join')
  async onJoinRoom(
    client: Socket,
    payload: { room: string; playlistName: string },
  ) {
    await client.join(payload.room + payload.playlistName);
    console.log('joined');
  }

  @SubscribeMessage('playlist:leave')
  async handleLeaveRoom(
    client: Socket,
    payload: { room: string; playlistName: string },
  ) {
    await client.leave(payload.room + payload.playlistName);
    console.log('left');
  }

  @SubscribeMessage('playlist:sync')
  onPlaylistSync(
    client: Socket,
    payload: {
      room: string;
      playlistName: string;
      type: 'sync' | 'add' | 'delete';
      playlist: any[];
    },
  ) {
    this.server
      .to(payload.room + payload.playlistName)
      .emit('playlist:sync', { ...payload });
  }
}
