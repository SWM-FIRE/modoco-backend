import {
  OnGatewayConnection,
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
  namespace: 'socket/room',
})
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private roomsService: RoomsService) {}

  @WebSocketServer()
  server: Server;

  // active sockets used to track users in a room
  private activeSockets: { room: string; id: string; uid: string }[] = [];
  // logger for this class
  private logger: Logger = new Logger('RoomGateway');

  /**
   * [WEBRTC][CHAT]
   * joinRoom - join a room
   * @param {Socket} client client socket
   * @param {{string, string}} param1 data
   * @returns {void}
   */
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

    //client.join(room);
    //client.to(room).emit('joinedRoom', uid);

    this.logger.log(
      `Client::socket(${client.id})/uid(${uid}):: joined ${room}`,
    );
  }

  /**
   * [WEBRTC]
   * call-user - call a user
   * send a offer to a given user
   * @param {Socket} client client socket
   * @param {any} data data
   */
  @SubscribeMessage('call-user')
  public callUser(client: Socket, data: any): void {
    client.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: client.id,
    });
  }

  /**
   * [WEBRTC]
   * make-answer - make an answer
   * send a answer to a given user
   * @param {Socket} client client socket
   * @param {any} data data
   */
  @SubscribeMessage('make-answer')
  public makeAnswer(client: Socket, data: any): void {
    client.to(data.to).emit('answer-made', {
      socket: client.id,
      answer: data.answer,
    });
  }

  /**
   * [WEBRTC]
   * reject-call - reject a call
   * called by a user when he rejects a call
   * @param {Socket} client client socket
   * @param {any} data data
   */
  @SubscribeMessage('reject-call')
  public rejectCall(client: Socket, data: any): void {
    client.to(data.from).emit('call-rejected', {
      socket: client.id,
    });
  }

  // ***************************************************************
  // ***************************[CHAT]******************************
  // ***************************************************************

  /**
   *
   * @param {Socket} client client socket
   * @param message chat message
   * @emit a `chatMessage` event to all users in the room
   */
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

  // ***************************************************************
  // **************************[COMMON]*****************************
  // ***************************************************************

  /**
   * [COMMON]
   * onInit - on init
   */
  public afterInit(): void {
    this.logger.log('Init');
  }

  /**
   * [COMMON]
   * onConnection - on connection
   * @param {Socket} client client socket
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * [COMMON]
   * onDisconnect - on disconnect
   * emit a user left event to all users in the room
   * @param {Socket} client client socket
   * @returns {void}
   */
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

  /**
   * [COMMON]
   * leaveRoom - leave a room
   * called by a user when he leaves a room
   * @param {Socket} client client socket
   * @param {string} room room id
   * @emit a `leftRoom` event to all users in the room
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string): void {
    this.logger.log(`Client ${client.id} leaved ${room}`);
    client.leave(room);
    client.emit('leftRoom', room);
  }
}
