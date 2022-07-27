import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/video',
})
export class VideoGateway implements OnGatewayInit, OnGatewayDisconnect {
  constructor(private roomsService: RoomsService) {}

  @WebSocketServer()
  server: Server;

  private activeSockets: { room: string; id: string; uid: string }[] = [];

  private logger: Logger = new Logger('VideoGateway');

  @SubscribeMessage('joinRoom')
  public joinRoom(client: Socket, { room, uid }): void {
    const existingSocket = this.activeSockets?.find(
      (socket) => socket.room === room && socket.id === client.id,
    );

    if (!existingSocket) {
      // increment room current count
      this.roomsService.joinRoom(room);

      this.activeSockets = [
        ...this.activeSockets,
        { id: client.id, room, uid },
      ];

      client.emit(`${room}-update-user-list`, {
        users: this.activeSockets
          .filter((socket) => socket.room === room && socket.id !== client.id)
          .map((existingSocket) => {
            return {
              id: existingSocket.id,
              uid: existingSocket.uid,
            };
          }),
        current: { id: client.id, uid: uid },
      });

      client.broadcast.emit(`${room}-add-user`, {
        user: client.id,
        uid: uid,
      });
    }
    return this.logger.log(
      `Client::socket(${client.id})/uid(${uid}):: joined ${room}`,
    );
  }

  @SubscribeMessage('call-user')
  public callUser(client: Socket, data: any): void {
    client.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: client.id,
    });
  }

  @SubscribeMessage('make-answer')
  public makeAnswer(client: Socket, data: any): void {
    client.to(data.to).emit('answer-made', {
      socket: client.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('reject-call')
  public rejectCall(client: Socket, data: any): void {
    client.to(data.from).emit('call-rejected', {
      socket: client.id,
    });
  }

  public afterInit(): void {
    this.logger.log('Init');
  }

  public handleDisconnect(client: Socket): void {
    const existingSocket = this.activeSockets.find(
      (socket) => socket.id === client.id,
    );

    if (!existingSocket) return;

    this.activeSockets = this.activeSockets.filter(
      (socket) => socket.id !== client.id,
    );

    // decrement room current count
    this.roomsService.leaveRoom(existingSocket.room);

    client.broadcast.emit(`${existingSocket.room}-remove-user`, {
      socketId: client.id,
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
