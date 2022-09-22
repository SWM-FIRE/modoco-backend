import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessagePayload } from 'src/gateways/dto';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/lobby/',
})
export class LobbyGateway {
  private logger: Logger = new Logger('LobbyGateway');
  private server: Server;

  afterInit(server: Server) {
    this.logger.debug('LobbyGateway initialized');
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.logger.debug(`LobbyGateway client connected ${client.id}`);
    // console.log('LobbyGateway client connected', client);

    client.on('disconnecting', (reason) => {
      const lobby = 'lobby';
      this.logger.debug('disconnecting', reason);
      client.to(lobby).emit('leftLobby', {
        sid: client.id,
      });
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`LobbyGateway client disconnected ${client.id}`);
  }

  @SubscribeMessage('joinLobby')
  async handleMessage(client: Socket, { uid }: { uid: number }) {
    const lobby = 'lobby';
    const hasJoined = client.rooms.has('lobby');
    // if already in room, return
    if (hasJoined) {
      this.logger.debug(`LobbyGateway client already in lobby ${client}`);
      return;
    }

    // join lobby
    client.join(lobby);
    client.data.uid = uid;
    client.emit('joinedLobby');

    // emit a user joined event to all users in the room except the sender
    client.to(lobby).emit('newUserJoinedLobby', {
      sid: client.id,
      uid: client.data.uid,
    });

    // get all users who in currently in the room

    const roomMembers = await this.server.in('lobby').fetchSockets();
    // extract data from each roomMember
    const existingMembers = roomMembers.map((member) => {
      return {
        sid: member.id,
        uid: member.data.uid,
      };
    });

    // emit to client who is currently in the room
    client.emit('existingUsers', {
      users: existingMembers,
      current: { sid: client.id, uid: uid },
    });

    this.logger.debug(`Client joined lobby, sid: ${client.id}), uid: ${uid}`);
  }

  @SubscribeMessage('chatMessage')
  onChatMessage(client: Socket, messagePayload: ChatMessagePayload) {
    this.server.to(messagePayload.room).emit('chatMessage', messagePayload);
  }

  // when leave lobby
  @SubscribeMessage('leaveLobby')
  async onLeaveRoom(client: Socket) {
    const lobby = 'lobby';

    client.leave(lobby);

    client.emit('LeftLobby', {
      sid: client.id,
    });

    client.to(lobby).emit('LeftLobby', {
      sid: client.id,
    });

    this.logger.debug(`Client leaved lobby, sid: ${client.id})`);
  }
}
