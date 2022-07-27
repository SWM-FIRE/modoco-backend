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
  //private activeSockets: { room: string; id: string; uid: string }[] = [];

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
    const hasJoined = client.rooms.has(room);

    // if already in room, do nothing
    if (hasJoined) {
      client.emit('alreadyJoined', room);
      return;
    }

    // if room does not exist, join it
    client.join(room);
    client.emit('joinedRoom', room);

    // increment room current count
    this.roomsService.joinRoom(room);

    // emit a user joined event to all users in the room except the sender
    client.to(room).emit('newUser', {
      sid: client.id,
      uid,
    });

    // existing users in the room
    client.emit('existingRoomUsers', {
      users: {},
      current: { sid: client.id, uid },
    });

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

  /**
   *
   * @param {Socket} client client socket
   * @param {any} message chat message
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

  /**
   * [COMMON]
   * onInit - on init
   */
  public afterInit(): void {
    this.logger.log('Initialized RoomGateway');
  }

  /**
   * [COMMON]
   * onConnection - on connection
   * @param {Socket} client client socket
   * @note in here we overide onClose handler in order to notify users in the room that the user has left.
   * this could be done in the handleDisconnect(which is invoked after socket is emptied) method
   * but we want to notify users in the room
   *
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    client._onclose = function (reason) {
      //this.logger.log(`OnClose Client(${client.id})`);
      const roomsToLeave = this.server.adapter['sids'].get(client.id);

      if (!roomsToLeave) {
        return Object.getPrototypeOf(client)._onclose.call(client, reason);
      }

      const rooms = [...roomsToLeave];
      rooms.forEach((room) => {
        // decrement room current count
        this.roomsService.leaveRoom(room);

        // emit a `leftRoom` event to all users in the room except the sender
        client.to(room).emit('leftRoom', {
          sid: client.id,
        });
      });

      return Object.getPrototypeOf(client)._onclose.call(client, reason);
    }.bind(this);
  }

  /**
   * [COMMON]
   * onDisconnect - on disconnect
   * emit a user left event to all users in the room
   * @param {Socket} client client socket
   * @returns {void}
   */
  public handleDisconnect(client: Socket): void {
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
    client.leave(room);
    client.emit('leftRoom', room);

    this.logger.log(`Client ${client.id} leaved ${room}`);
  }
}
