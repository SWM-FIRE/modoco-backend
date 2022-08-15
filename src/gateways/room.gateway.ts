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
import { RecordsService } from 'src/records/records.service';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/room/',
})
@UseGuards(WsJwtGuard)
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private roomsService: RoomsService,
    private recordsService: RecordsService,
  ) {}

  @WebSocketServer()
  server: Server;

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

    // if already in room, do nothing
    if (hasJoined) {
      client.emit(EVENT.ALREADY_JOINED, room);
      return;
    }

    // store the user in the room
    client.data.uid = uid;

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

    // get all users who in currently in the room
    const roomMembers = await this.server.in(room).fetchSockets();
    // extract data from each roomMember
    const existingMembers = roomMembers.map((roomMember) => {
      return {
        sid: roomMember.id,
        uid: roomMember.data.uid,
      };
    });

    // join the room
    client.join(room);
    client.emit(EVENT.JOINED_ROOM, { room });

    // emit a user joined event to all users in the room except the sender
    client.to(room).emit(EVENT.NEW_USER, {
      sid: client.id,
      uid,
    });

    // emit to client who is currently in the room
    client.emit(EVENT.EXISTING_ROOM_USERS, {
      users: existingMembers,
      current: { sid: client.id, uid },
    });

    // increment room current count
    this.roomsService.joinRoom(room);

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
   * record the duration of a user in a room
   * @param {Socket} client client socket
   * @param {any} data
   */
  @SubscribeMessage(EVENT.RECORD_TIME)
  public recordTime(client: Socket, data: any): void {
    const user = client.handshake['user'];
    this.recordsService.recordTime(user, data);
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
   * @note used disconnecting event of each client to notify users in the room that the user has left.
   * this cannot be done in the handleDisconnect(which is invoked after socket is emptied)
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected, sid: ${client.id}`);
    client.on('disconnecting', (reason) => {
      console.log('disconnecting', reason);
      const roomsToLeave: Set<string> = this.server.adapter['sids'].get(
        client.id,
      );
      if (roomsToLeave) {
        // rooms excluding the room the user's id room
        const rooms = [...roomsToLeave].filter((room) => room !== client.id);

        rooms.forEach((room) => {
          // decrement room current count
          this.roomsService.leaveRoom(room);

          // emit a `leftRoom` event to all users in the room except the sender
          client.to(room).emit(EVENT.LEFT_ROOM, {
            sid: client.id,
          });
        });
      }
    });
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
