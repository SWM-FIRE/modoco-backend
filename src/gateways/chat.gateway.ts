import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'socket/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  @SubscribeMessage('chatMessage')
  handleMessage(
    client: Socket,
    message: {
      room: string;
      sender: string;
      message: string;
      createdAt: string;
    },
  ): void {
    this.server.to(message.room).emit('chatMessage', message);
  }

  @SubscribeMessage('joinChatRoom')
  handleJoinChatRoom(client: Socket, { room, uid }): void {
    this.logger.log(`Client ::room(${client.id})/uid(${uid}) joined ${room}`);
    client.join(room);
    client.to(room).emit('joinedRoom', uid);
  }

  @SubscribeMessage('leaveChatRoom')
  handleLeaveChatRoom(client: Socket, room: string): void {
    this.logger.log(`Client ${client.id} leaved ${room}`);
    client.leave(room);
    client.emit('leftRoom', room);
  }

  afterInit(server: Server): void {
    this.logger.log('Init');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
