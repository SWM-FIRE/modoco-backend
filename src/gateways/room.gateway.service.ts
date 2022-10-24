import { Inject, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RecordsService } from 'src/records/records.service';
import { RoomsDatabaseHelper } from '../rooms/helper/rooms-database.helper';
import { UsersDatabaseHelper } from '../users/helper/users-database.helper';
import { RoomGatewayHelper } from './helper/room-gateway.helper';
import { WsException } from '@nestjs/websockets';
import { isNotFoundError } from '../common/util/prisma-error.util';
import {
  getAllRoomUsers,
  joinClientToRoom,
  notifyNewUserJoined,
} from './helper/socket.util';
import { User } from '@prisma/client';
import { EVENT } from './constants/event.enum';
import {
  ChatMessagePayload,
  LeaveRoomPayload,
  JoinRoomPayload,
  KickUserPayload,
  CallOfferPayload,
  AnswerOfferPayload,
  RecordPayload,
  CandidatePayload,
  MediaStateChangePayload,
} from './dto';
import { RedisClientType } from '@redis/client';

@Injectable()
export class RoomGatewayService {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly roomsDatabaseHelper: RoomsDatabaseHelper,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly roomGatewayHelper: RoomGatewayHelper,
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
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
    this.logger.log('[Init] Initialized RoomGateway');
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
    this.logger.debug(`[Connection] Client sid: ${client.id}`);

    // attach handler to disconnecting event
    client.on('disconnecting', () => this.onDisconnecting(client));
  }

  /**
   * onDisconnect - on disconnect
   * emit a user left event to all users in the room
   * @param {Socket} client client socket
   */
  onDisconnect(client: Socket) {
    this.logger.debug(`[Disconnect] Client sid: ${client.id}`);
  }

  /**
   * [WEBRTC][CHAT]
   * joinRoom - join a room
   * @param {Socket} client client socket
   * @param {JoinRoomPayload} payload
   */
  async onJoinRoom(client: Socket, { room, uid }: JoinRoomPayload) {
    try {
      // 1. validate payload
      await this.validateJoinRoomPayload(client, room);
      // 2. store the user in the room
      client.data.uid = uid;
      // 3. get all users who in currently in the room
      const existingMembers = await getAllRoomUsers(this.server, room);
      // 4. join client into the room
      await joinClientToRoom(client, room, existingMembers);
      // 5. notify that new user has joined, to all users in the room, except the sender(client)
      await notifyNewUserJoined(client, room, uid);
      // 6. update realtime data
      await this.roomGatewayHelper.updateRoomInformationByDelta(
        room,
        existingMembers.length,
        1,
      );
      // 7. log the event
      this.logger.debug(`[JoinRoom #${room}] uid: ${uid}, sid: ${client.id}`);
    } catch (error) {
      if (error instanceof WsException) {
        if (error.message === EVENT.ALREADY_JOINED) {
          client.emit(EVENT.ALREADY_JOINED, room);
          return;
        }
        if (error.message === EVENT.ROOM_FULL) {
          client.emit(EVENT.ROOM_FULL, { room });
          return;
        }
      } else if (isNotFoundError(error)) {
        throw new WsException('Room not found');
      }

      throw error;
    }
  }

  private async validateJoinRoomPayload(client: Socket, room: string) {
    // check if client is already in the room
    const hasJoined = client.rooms.has(room);
    if (hasJoined) {
      throw new WsException(EVENT.ALREADY_JOINED);
    }

    // check if room exceeds max capacity
    const roomCapacity = await this.roomsDatabaseHelper.getRoomCapacity(
      parseInt(room),
    );
    let roomCurrentCount = 0;
    if (this.server.adapter['rooms'].get(room) !== undefined) {
      roomCurrentCount = this.server.adapter['rooms'].get(room).size;
    }

    if (roomCurrentCount >= roomCapacity) {
      throw new WsException(EVENT.ROOM_FULL);
    }
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

    const userUid = payload.userToKick.uid;
    if (isNaN(userUid)) {
      moderatorSocket.emit(EVENT.EXCEPTION, 'You tried to kick unknown user');
      return;
    }
    const userToKick = await this.usersDatabaseHelper.getUserByUid(userUid);
    //getAnotherUserByUid(userUid);
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
    const isModerator = await this.roomsDatabaseHelper.isRoomModerator(
      moderator,
      room,
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
    // decrement room current count
    const currentRoomMembersCount = await this.getCurrentRoomMembersCount(
      payload.room,
    );
    await this.roomsDatabaseHelper.leaveRoom(
      parseInt(payload.room, 10),
      currentRoomMembersCount,
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

    const currentRoomMembersCount = await this.getCurrentRoomMembersCount(room);
    // decrement room current count
    await this.roomsDatabaseHelper.leaveRoom(
      parseInt(room, 10),
      currentRoomMembersCount,
    );

    client.emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    client.to(room).emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    this.logger.debug(
      `[LeaveRoom #${room}] Client uid: ${
        client.data.uid ? client.data.uid : '?'
      }, sid: ${client.id}`,
    );
  }

  /**
   * get all users who in currently in the room
   * @param {string} room room id in string
   * @returns {Promise<Socket[]>} list of sockets
   */
  private async getCurrentRoomMembersCount(room: string) {
    const roomMemberSockets = await this.server.in(room).fetchSockets();
    return roomMemberSockets.length;
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
    payload.uid = client.data.uid;

    if (mediaType === EVENT.VIDEO_STATE_CHANGE) {
      this.server.to(payload.room).emit(EVENT.VIDEO_STATE_CHANGE, payload);
    } else if (mediaType === EVENT.AUDIO_STATE_CHANGE) {
      this.server.to(payload.room).emit(EVENT.AUDIO_STATE_CHANGE, payload);
    } else {
      this.logger.error(
        `[MediaStateChange] Invalid media type onMediaStateChange: ${mediaType}`,
      );
    }
  }

  private async getMatchingSocketsBySid(room: string, sid: string) {
    const roomMembers = await this.server.in(room).fetchSockets();
    return roomMembers.filter((socket) => {
      return socket.id === sid;
    });
  }

  // before leaving the room, notify all users in the room that the user has left
  private onDisconnecting(client) {
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
        await this.roomsDatabaseHelper.leaveRoom(
          parseInt(room, 10),
          currentRoomMembers.length - 1,
        );

        // emit a `leftRoom` event to all users in the room except the sender
        client.to(room).emit(EVENT.LEFT_ROOM, {
          sid: client.id,
        });
      });
    }
  }
}
