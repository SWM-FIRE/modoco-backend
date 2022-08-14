import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { EVENT } from './constants/event.enum';
import { WsJwtGuard } from 'src/auth/guard/wsJwt.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/room',
})
@UseGuards(WsJwtGuard)
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private roomsService: RoomsService) {}

  @WebSocketServer()
  server: Server;

  // Map<clientID, userID> used to track users in a room
  private userList = new Map<string, string>();

  // logger for this class
  private logger: Logger = new Logger('RoomGateway');

  /**
   * [WEBRTC][CHAT]
   * joinRoom - join a room
   * @param {Socket} client client socket
   * @param {{string, string}} param1 data
   * @returns {void}
   */
  @SubscribeMessage(EVENT.JOIN_ROOM)
  async joinRoom(client: Socket, { room, uid }): Promise<void> {
    const hasJoined = client.rooms.has(room);
    // console.log(client.user);
    // if already in room, do nothing
    if (hasJoined) {
      client.emit(EVENT.ALREADY_JOINED, room);
      return;
    }

    // check if room exceeds max capacity
    const roomCapacity = await this.roomsService.getRoomCapacity(
      parseInt(room),
    );
    let roomCurrentCount = 0;
    if (this.server.adapter['rooms'].get(room) !== undefined) {
      roomCurrentCount = this.server.adapter['rooms'].get(room).size;
    }
    if (roomCurrentCount >= roomCapacity) {
      client.emit(EVENT.ROOM_FULL, { room });
      return;
    }

    // if room does not exist, join it
    client.join(room);
    client.emit(EVENT.JOINED_ROOM, { room });

    // emit a user joined event to all users in the room except the sender
    client.to(room).emit(EVENT.NEW_USER, {
      sid: client.id,
      uid,
    });

    // [temporary] get existing users in the room
    const existingRoomUsers = [...this.server.adapter['rooms'].get(room)];
    const users = existingRoomUsers
      .filter((sid) => sid !== client.id)
      .map((sid) => {
        return {
          sid,
          uid: this.userList.get(sid),
        };
      });

    // existing users in the room
    client.emit(EVENT.EXISTING_ROOM_USERS, {
      users: users,
      current: { sid: client.id, uid },
    });

    // increment room current count
    this.roomsService.joinRoom(room);

    // [temporary] store the user in the room
    this.userList.set(client.id, uid);

    this.logger.log(
      `Client joined room(${room}), sid: ${client.id}), uid: ${uid}`,
    );
  }

  /**
   * [WEBRTC]
   * call-user - call a user
   * send a offer to a given user
   * @param {Socket} client client socket
   * @param {any} data data
   */
  @SubscribeMessage(EVENT.CALL_USER)
  public callUser(client: Socket, data: any): void {
    client.to(data.to).emit(EVENT.CALL_MADE, {
      sid: client.id,
      offer: data.offer,
    });
  }

  /**
   * [WEBRTC]
   * make-answer - make an answer
   * send a answer to a given user
   * @param {Socket} client client socket
   * @param {any} data data
   */
  @SubscribeMessage(EVENT.MAKE_ANSWER)
  public makeAnswer(client: Socket, data: any): void {
    client.to(data.to).emit(EVENT.ANSWER_MADE, {
      sid: client.id,
      answer: data.answer,
    });
  }

  /**
   * [CHAT]
   * chatMessage - send chat message to all users in the room
   * @param {Socket} client client socket
   * @param {any} message chat message
   * @emit a `chatMessage` event to all users in the room
   */
  @SubscribeMessage(EVENT.CHAT_MESSAGE)
  handleMessage(
    client: Socket,
    message: {
      room: string;
      sender: string;
      message: string;
      createdAt: string;
    },
  ): void {
    this.server.to(message.room).emit(EVENT.CHAT_MESSAGE, message);
  }

  /**
   * send ice-candidate to all users in the room except the sender
   * @param {Socket} client client socket
   * @param {any} data ice-candidate data
   */
  @SubscribeMessage(EVENT.ICE_CANDIDATE)
  public handleIceCandidate(client: Socket, data: any): void {
    client.to(data.to).emit(EVENT.ICE_CANDIDATE, {
      sid: client.id,
      candidate: data.candidate,
    });
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
    this.logger.log(`Client connected, sid: ${client.id}`);

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
        client.to(room).emit(EVENT.LEFT_ROOM, {
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
    this.logger.log(`Client disconnected, sid: ${client.id}`);

    // [temporary] delete the user from the room
    this.userList.delete(client.id);
  }

  /**
   * [COMMON]
   * leaveRoom - leave a room
   * called by a user when he leaves a room
   * @param {Socket} client client socket
   * @param {string} room room id
   * @emit a `leftRoom` event to all users in the room
   */
  @SubscribeMessage(EVENT.LEAVE_ROOM)
  handleLeaveRoom(client: Socket, room: string): void {
    client.leave(room);

    // decrement room current count
    this.roomsService.leaveRoom(room);

    client.emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    client.to(room).emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    this.logger.log(`Client leaved ${room}, sid: ${client.id})`);
  }
}
