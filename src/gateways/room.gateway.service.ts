import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { EVENT } from './constants/event.enum';
import { RecordsService } from 'src/records/records.service';
import { ChatMessagePayload } from './dto/chat-message.dto';
import { LeaveRoomPayload } from './dto/leave-room.dto';
import {
  JoinRoomPayload,
  CallOfferPayload,
  AnswerOfferPayload,
  RecordPayload,
  CandidatePayload,
} from './dto';
import { User } from 'src/users/dto';

@Injectable()
export class RoomGatewayService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly recordsService: RecordsService,
  ) {}

  private server: Server;
  private logger: Logger = new Logger('RoomGateway');

  /**
   * onInit - on init
   * set server instance
   * @param {Server} server server instance
   */
  onAfterInit(server: Server) {
    this.setServer(server);
    this.logger.log('Initialized RoomGateway');
  }

  /**
   * set server instance
   * @param {Server} server server instance
   */
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * [COMMON]
   * onConnection - on connection
   * @param {Socket} client client socket
   * @note used disconnecting event of each client to notify users in the room that the user has left.
   * this cannot be done in the handleDisconnect(which is invoked after socket is emptied)
   */
  onConnection(client: Socket) {
    this.logger.debug(`Client connected, sid: ${client.id}`);

    // before leaving the room, notify all users in the room that the user has left
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client.on('disconnecting', (reason) => {
      //this.logger.debug('disconnecting', reason);
      const roomsToLeave: Set<string> = this.server.adapter['sids'].get(
        client.id,
      );
      if (roomsToLeave) {
        // rooms excluding the room the user's id room
        const rooms = [...roomsToLeave].filter((room) => room !== client.id);

        rooms.forEach(async (room) => {
          // get all users who in currently in the room
          const currentRoomMembers = await this.server.in(room).fetchSockets();
          // decrement room current count
          // minus one because current user, who is leaving, is still in the room
          this.roomsService.leaveRoom(room, currentRoomMembers.length - 1);

          // emit a `leftRoom` event to all users in the room except the sender
          client.to(room).emit(EVENT.LEFT_ROOM, {
            sid: client.id,
          });
        });
      }
    });
  }

  /**
   * onDisconnect - on disconnect
   * emit a user left event to all users in the room
   * @param {Socket} client client socket
   */
  onDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected, sid: ${client.id}`);
  }

  /**
   * [WEBRTC][CHAT]
   * joinRoom - join a room
   * @param {Socket} client client socket
   * @param {JoinRoomPayload} payload
   */
  async onJoinRoom(client: Socket, { room, uid }: JoinRoomPayload) {
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
    this.roomsService.joinRoom(room, roomMembers.length);

    this.logger.debug(
      `Client joined room(${room}), sid: ${client.id}), uid: ${uid}`,
    );
  }

  /**
   * [COMMON]
   * leaveRoom - leave a room
   * called by a user when he leaves a room
   * @param {Socket} client client socket
   * @param {LeaveRoomPayload} payload leave room payload, contains room id
   * @emit emit a `leftRoom` event to all users in the room
   */
  async onLeaveRoom(client: Socket, payload: LeaveRoomPayload) {
    const room = payload.room;

    client.leave(room);

    // get all users who in currently in the room
    const currentRoomMembers = await this.server.in(room).fetchSockets();
    // decrement room current count
    await this.roomsService.leaveRoom(room, currentRoomMembers.length);

    client.emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    client.to(room).emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    this.logger.debug(`Client leaved ${room}, sid: ${client.id})`);
  }

  /**
   * [CHAT]
   * chatMessage - send chat message to all users in the room
   * @param {Socket} client client socket
   * @param {ChatMessagePayload} messagePayload chatMessage event payload
   * @emit emit a `chatMessage` event to all users in the room
   */
  onChatMessage(client: Socket, messagePayload: ChatMessagePayload) {
    this.server
      .to(messagePayload.room)
      .emit(EVENT.CHAT_MESSAGE, messagePayload);
  }

  /**
   * [WEBRTC]
   * call-user - call a user
   * send a offer to a given user
   * @param {Socket} client client socket
   * @param {CallOfferPayload} payload call-user event payload
   */
  onCallUser(client: Socket, payload: CallOfferPayload) {
    client.to(payload.to).emit(EVENT.CALL_MADE, {
      sid: client.id,
      offer: payload.offer,
    });
  }

  /**
   * [WEBRTC]
   * make-answer - make an answer
   * send a answer to a given user
   * @param {Socket} client client socket
   * @param {AnswerOfferPayload} payload make-answer event payload
   */
  onMakeAnswer(client: Socket, payload: AnswerOfferPayload) {
    client.to(payload.to).emit(EVENT.ANSWER_MADE, {
      sid: client.id,
      answer: payload.answer,
    });
  }

  /**
   * send ice-candidate to all users in the room except the sender
   * @param {Socket} client client socket
   * @param {CandidatePayload} payload ice-candidate event payload
   */
  onIceCandidate(client: Socket, payload: CandidatePayload) {
    client.to(payload.to).emit(EVENT.ICE_CANDIDATE, {
      sid: client.id,
      candidate: payload.candidate,
    });
  }

  /**
   * record the duration of a user in a room
   * @param {Socket} client client socket
   * @param {RecordPayload} payload Record event Payload
   */
  onRecordTime(client: Socket, payload: RecordPayload) {
    const user = this.getSocketUser(client);
    this.recordsService.recordTime(user, payload);
  }

  /**
   * get user data using jwt token authentication
   */
  getSocketUser(client: Socket): User {
    return client.handshake['user'];
  }
}
