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
  getExistingRoomMembersCount,
  getMatchingSocketsBySid,
  getSocketUser,
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
import { KICK_USER_EXCEPTION } from './constants/validation-exceptions.enum';

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

  async onKickUser(moderatorSocket: Socket, payload: KickUserPayload) {
    try {
      // 1. get user info from socket
      const moderator = getSocketUser(moderatorSocket);

      // 2. validate and get user to kick
      const { userToKick, userToKickSocket } =
        await this.validateKickUserPayload(moderator, moderatorSocket, payload);

      // 3. emit a `kicked` event to all user in the room
      this.server.to(payload.room).emit(EVENT.KICK_USER, {
        kickUser: userToKick,
      });

      // 4. kick user
      userToKickSocket.leave(payload.room);

      // 5. decrement room current count
      const currentRoomMembersCount = await getExistingRoomMembersCount(
        this.server,
        payload.room,
      );
      await this.roomsDatabaseHelper.leaveRoom(
        parseInt(payload.room, 10),
        currentRoomMembersCount,
      );
    } catch (error) {
      if (error instanceof WsException) {
        const message = error.message;
        if (message === KICK_USER_EXCEPTION.INVALID_CREDENTIAL) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.INVALID_CREDENTIAL,
          );
          return;
        }
        if (message === KICK_USER_EXCEPTION.USER_NOT_IN_ROOM) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.USER_NOT_IN_ROOM,
          );
          return;
        }
        if (message === KICK_USER_EXCEPTION.NO_SESSION) {
          moderatorSocket.emit(EVENT.EXCEPTION, KICK_USER_EXCEPTION.NO_SESSION);
          return;
        }
        if (message === KICK_USER_EXCEPTION.INVALID_TARGET) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.INVALID_TARGET,
          );
          return;
        }
        if (message === KICK_USER_EXCEPTION.INVALID_ROOM) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.INVALID_ROOM,
          );
          return;
        }
        if (message === KICK_USER_EXCEPTION.NOT_MODERATOR) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.NOT_MODERATOR,
          );
          return;
        }
        if (message === KICK_USER_EXCEPTION.IS_MODERATOR) {
          moderatorSocket.emit(
            EVENT.EXCEPTION,
            KICK_USER_EXCEPTION.IS_MODERATOR,
          );
          return;
        }
      }
      throw error;
    }
  }

  private async validateKickUserPayload(
    moderator: User,
    moderatorSocket: Socket,
    payload: KickUserPayload,
  ) {
    // 1. check if moderator is in the room
    const hasModeratorJoined = moderatorSocket.rooms.has(payload.room);
    if (!hasModeratorJoined) {
      throw new WsException(KICK_USER_EXCEPTION.USER_NOT_IN_ROOM);
    }

    // 2. check if user to be kicked has socket.io session
    const userUid = payload.userToKick.uid;
    if (isNaN(userUid)) {
      throw new WsException(KICK_USER_EXCEPTION.NO_SESSION);
    }

    // 3. check if user to be kicked exists
    const userToKick = await this.usersDatabaseHelper.getUserByUid(userUid);
    if (!userToKick) {
      throw new WsException(KICK_USER_EXCEPTION.INVALID_TARGET);
    }

    // 4. check room is valid
    const room = parseInt(payload.room);
    if (isNaN(room)) {
      throw new WsException(KICK_USER_EXCEPTION.INVALID_ROOM);
    }

    // 5. check if moderator is the room owner
    const isModerator = await this.roomsDatabaseHelper.isRoomModerator(
      moderator,
      room,
    );
    if (!isModerator) {
      throw new WsException(KICK_USER_EXCEPTION.NOT_MODERATOR);
    }

    // 6. check if user to be kicked is in the room
    const userToKickSocket = await getMatchingSocketsBySid(
      this.server,
      payload.room,
      payload.userToKick.sid,
    );

    // 7. check if user to be kicked is the room owner
    if (
      userUid === moderator.uid ||
      userToKickSocket.id === moderatorSocket.id
    ) {
      throw new WsException(KICK_USER_EXCEPTION.IS_MODERATOR);
    }

    // return user to kick
    return { userToKick, userToKickSocket };
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

    const currentRoomMembersCount = await getExistingRoomMembersCount(
      this.server,
      room,
    );
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
    const user = getSocketUser(client);
    await this.recordsService.recordTime(user, payload);
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
}
