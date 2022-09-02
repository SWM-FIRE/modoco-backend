import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { RecordsService } from 'src/records/records.service';
import { UsersService } from 'src/users/users.service';
import {
  ChatMessagePayload,
  LeaveRoomPayload,
  JoinRoomPayload,
  CallOfferPayload,
  AnswerOfferPayload,
  RecordPayload,
  CandidatePayload,
  MediaStateChangePayload,
} from './dto';
import { User } from 'src/users/dto';
import { KickUserPayload } from './dto/kick-user.dto';
import { EVENT } from './constants/event.enum';

@Injectable()
export class RoomGatewayService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
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
          await this.roomsService.leaveRoom(
            room,
            currentRoomMembers.length - 1,
          );

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
    await this.roomsService.joinRoom(room, roomMembers.length);

    this.logger.debug(
      `Client joined room(${room}), sid: ${client.id}), uid: ${uid}`,
    );
  }

  async onKickUser(moderatorSocket: Socket, payload: KickUserPayload) {
    const moderator = this.getSocketUser(moderatorSocket);
    if (!moderator) {
      return;
    }

    // check if moderator is in the room
    const hasModeratorJoined = moderatorSocket.rooms.has(payload.room);
    if (!hasModeratorJoined) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'You are not in the room');
      return;
    }

    const userUid = parseInt(payload.userToKick.uid);
    if (isNaN(userUid)) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'You tried to kick unknown user');
      return;
    }
    const userToKick = await this.usersService.findUserByUid(userUid);
    //console.log(userToKick);
    if (!userToKick) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'User not found');
      return;
    }

    const room = parseInt(payload.room);
    if (isNaN(room)) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'Invalid room');
      return;
    }

    // check if moderator is the room owner
    const isModerator = await this.roomsService.isRoomModerator(
      room,
      moderator,
    );
    if (!isModerator) {
      moderatorSocket.emit(
        EVENT.EXCEPTION,
        'You are not the moderator of the room',
      );
      return;
    }

    // check if user to be kicked is in the room
    const targetSockets = await this.getMatchingSocketsBySid(
      payload.room,
      payload.userToKick.sid,
    );
    if (targetSockets.length === 0) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'User is not in the room');
      return;
    }
    const userToKickSocket = targetSockets[0];

    // check if user to be kicked is the room owner
    if (
      userUid === moderator.uid ||
      userToKickSocket.id === moderatorSocket.id
    ) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'You cannot kick yourself');
      return;
    }

    // emit a `kicked` event to all user in the room
    this.server.to(payload.room).emit(EVENT.KICK_USER, {
      kickUser: userToKick,
    });
    
    // kick user
    userToKickSocket.leave(payload.room);
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
   * send an offer to a given user
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
   * send an answer to a given user
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
  async onRecordTime(client: Socket, payload: RecordPayload) {
    const user = this.getSocketUser(client);
    await this.recordsService.recordTime(user, payload);
  }

  /**
   * get user data using jwt token authentication
   */
  getSocketUser(client: Socket): User {
    return client.handshake['user'];
  }

  /**
   * on media(video or audio) state change
   * @param {EVENT} mediaType
   * @param {Socket} client client socket
   * @param {RecordPayload} payload Media state change event Payload
   */
  onMediaStateChange(
    mediaType: EVENT,
    client: Socket,
    payload: MediaStateChangePayload,
  ) {
    payload.sid = client.id;

    if (mediaType === EVENT.VIDEO_STATE_CHANGE) {
      this.server.to(payload.room).emit(EVENT.VIDEO_STATE_CHANGE, payload);
    } else if (mediaType === EVENT.AUDIO_STATE_CHANGE) {
      this.server.to(payload.room).emit(EVENT.AUDIO_STATE_CHANGE, payload);
    } else {
      this.logger.error(`Invalid media type onMediaStateChange: ${mediaType}`);
    }
  }

  async getMatchingSocketsBySid(room: string, sid: string) {
    const roomMembers = await this.server.in(room).fetchSockets();
    return roomMembers.filter((socket) => {
      return socket.id === sid;
    });
  }
}
