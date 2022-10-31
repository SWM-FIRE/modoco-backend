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
  kickUserFromRoom,
  notifyKickUser,
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
import { DirectMessagePayload } from './dto/direct-message.dto';
import { AuthService } from 'src/auth/auth.service';
import { ConnectionType, RedisSessionStore } from './class/redis-session.store';
import { RedisMessageStore } from './class/redis-message.store';
import { FriendsDatabaseHelper } from 'src/friends/helper/friends-database.helper';

@Injectable()
export class RoomGatewayService {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly roomsDatabaseHelper: RoomsDatabaseHelper,
    private readonly usersDatabaseHelper: UsersDatabaseHelper,
    private readonly roomGatewayHelper: RoomGatewayHelper,
    private readonly authService: AuthService,
    private readonly redisSessionStore: RedisSessionStore,
    private readonly redisMessageStore: RedisMessageStore,
    private readonly friendDatabaseHelper: FriendsDatabaseHelper,
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
   * [COMMON]
   * onConnection - on connection
   * @param {Socket} client client socket
   * @note used disconnecting event of each client to notify users in the room that the user has left.
   * this cannot be done in the handleDisconnect(which is invoked after socket is emptied)
   */
  async onConnection(client: Socket) {
    try {
      // 1. pull authentification data
      const { sub } = await this.authService.verifyToken(
        client.handshake.query.token as string,
      );
      const uid = sub as number;

      // 2. attach user data
      client.data.uid = uid;
      client.data.nickname =
        await this.usersDatabaseHelper.getUserNicknameByUid(uid);

      // 3. enable socket session (if not exist, create one)
      await this.createRedisSession(uid, client.data.nickname);

      // 4. join uid room for direct message
      client.join(uid.toString());

      // 5. fetch message history
      // should be moved to a separate event
      const messages = await this.redisMessageStore.findMessagesForUser(uid);
      const messageDict = new Map<number, any[]>();
      messages.forEach((message) => {
        const { from, to } = message;
        const key = uid === from ? to : from;
        if (!messageDict.has(key)) {
          messageDict.set(key, []);
        }
        messageDict.get(key).push(message);
      });

      // 7. find all friends of the user
      const friendlist = await this.friendDatabaseHelper.getAcceptedFriendships(
        uid,
      );

      // 8. send friends status and messages they have sent
      const friendStatusList = [];
      for (const friend of friendlist) {
        const friendData =
          friend.friendship_friendFromTousers.uid === uid
            ? friend.friendship_friendToTousers
            : friend.friendship_friendFromTousers;
        const friendSession = await this.redisSessionStore.findSession(
          friendData.uid,
        );

        friendStatusList.push({
          friend: friendData,
          connection:
            friendSession === undefined
              ? ConnectionType.OFFLINE
              : friendSession.connection,
          messages: messageDict.get(friendData.uid) || [],
        });
      }
      client.emit('friend:sync-all', friendStatusList);

      // 9. notify existing user - that new user is connected
      // TODO: notify only to the friends of the user who is connected
      client.broadcast.emit('friend:connection', {
        uid,
        nickname: client.data.nickname,
        connection: ConnectionType.ONLINE,
      });

      // 10. log the new connection
      this.logger.log(`[Connection] Client uid: ${uid}, sid: ${client.id}`);
    } catch (error) {
      this.logger.error(error);
    }

    // 11. attach handler to disconnecting event
    client.on('disconnecting', () => this.onDisconnecting(client));
  }

  /**
   * onDisconnect - on disconnect
   * emit a user left event to all users in the room
   * @param {Socket} client client socket
   */
  onDisconnect(client: Socket) {
    // 1. log the disconnection
    this.logger.log(
      `[Disconnect] Client uid: ${client.data.uid},sid: ${client.id}`,
    );

    // 2. disable socket session
    this.disableRedisSession(client.data.uid);

    // 3. notify existing user to update their friend list
    client.broadcast.emit('friend:disconnection', {
      uid: client.data.uid,
      nickname: client.data.nickname,
      connection: ConnectionType.OFFLINE,
    });
  }

  /**
   * [WEBRTC][CHAT]
   * joinRoom - join a room
   * @param {Socket} client client socket
   * @param {JoinRoomPayload} payload
   */
  async onJoinRoom(client: Socket, { room, uid, password }: JoinRoomPayload) {
    try {
      // 1. validate payload
      await this.validateJoinRoomPayload(client, room, password);

      // 2. get all users who in currently in the room
      const existingMembers = await getAllRoomUsers(this.server, room);

      // 3. join client into the room
      await joinClientToRoom(client, room, existingMembers);

      // 4. notify that new user has joined, to all users in the room, except the sender(client)
      await notifyNewUserJoined(client, room, uid);

      // 5. update realtime data
      await this.roomGatewayHelper.updateRoomInformationByDelta(
        room,
        existingMembers.length,
        1,
      );

      // 6. log the event
      this.logger.log(`[JoinRoom #${room}] uid: ${uid}, sid: ${client.id}`);
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
      const { userToKick, userToKickSocket } = await this.getUserToKick(
        moderator,
        moderatorSocket,
        payload,
      );

      // 3. notify user to kick
      notifyKickUser(this.server, payload.room, userToKick);

      // 4. kick user from room
      await kickUserFromRoom(userToKickSocket, payload.room);

      // 5. decrement room current count
      const count = await getExistingRoomMembersCount(
        this.server,
        payload.room,
      );
      await this.roomsDatabaseHelper.updateRoomInfoByDelta(
        parseInt(payload.room, 10),
        count,
        0,
      );

      // 6. log the event
      this.logger.log(
        `[KickUser Room #${payload.room}] User(${moderator.uid}) kicks ${userToKick.uid}`,
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

  private async getUserToKick(
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

    // 8. return user to kick
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

    // 1. remove user from room
    client.leave(room);

    // 2. decrement room current count
    const currentRoomMembersCount = await getExistingRoomMembersCount(
      this.server,
      room,
    );
    await this.roomsDatabaseHelper.updateRoomInfoByDelta(
      parseInt(room, 10),
      currentRoomMembersCount,
      0,
    );

    // 3. notify to user who is leaving & other users in the room
    client.emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });
    client.to(room).emit(EVENT.LEFT_ROOM, {
      sid: client.id,
    });

    // 4. log the event
    this.logger.log(
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

  async onDirectMessage(client: Socket, messagePayload: DirectMessagePayload) {
    // 1. send direct message to target user & sender(`from`)
    const from = getSocketUser(client).uid;
    this.server
      .to(messagePayload.to.toString())
      .to(from.toString())
      .emit(EVENT.DIRECT_MESSAGE, {
        from,
        ...messagePayload,
      });

    // 2. save direct message to database
    await this.redisMessageStore.saveMessage({ from, ...messagePayload });
  }

  /**
   * [WEBRTC]
   * call-user - call a user
   * send an offer to a given user
   * @param {Socket} client client socket
   * @param {CallOfferPayload} payload call-user event payload
   */
  onCallUser(client: Socket, payload: CallOfferPayload) {
    client.to(payload.to.toString()).emit(EVENT.CALL_MADE, {
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
    client.to(payload.to.toString()).emit(EVENT.ANSWER_MADE, {
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
    client.to(payload.to.toString()).emit(EVENT.ICE_CANDIDATE, {
      sid: client.id,
      candidate: payload.candidate,
    });
  }

  /**
   * on media(video or audio) state change
   * @param {EVENT} mediaType media type
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

  /**
   * record the duration of a user in a room
   * @warning this function has many bugs
   * @param {Socket} client client socket
   * @param {RecordPayload} payload Record event Payload
   */
  async onRecordTime(client: Socket, payload: RecordPayload) {
    const user = getSocketUser(client);
    await this.recordsService.recordTime(user, payload);
  }

  /**
   * set server instance
   * @param {Server} server server instance
   * @private
   */
  private setServer(server: Server) {
    this.server = server;
  }

  /**
   * called when a user disconnects.
   * before leaving the room, notify all users in the room that the user has left
   * @param {Socket} client client socket which is about to leave the room
   * @private
   */
  private onDisconnecting(client: Socket) {
    // 1. get all rooms the user is in
    const roomsToLeave: Set<string> = this.server.adapter['sids'].get(
      client.id,
    );
    if (!roomsToLeave) {
      return;
    }

    // 2. get rooms excluding the room, which the user's id is the same as the room id
    const rooms = [...roomsToLeave].filter(
      (room) => room !== client.id && room !== client.data.uid.toString(),
    );

    // 3. notify to all user that this user is leaving the room
    rooms.forEach(async (room) => {
      // 3-1. get all users who in currently in the room
      const currentRoomMembers = await this.server.in(room).fetchSockets();
      // 3-2. decrement room current count
      // NOTE: minus one because current user, who is leaving, is still in the room
      await this.roomsDatabaseHelper.updateRoomInfoByDelta(
        parseInt(room, 10),
        currentRoomMembers.length,
        -1,
      );

      // 3-3. emit a `leftRoom` event to all users in the room except the sender
      client.to(room).emit(EVENT.LEFT_ROOM, {
        sid: client.id,
      });
    });
  }

  /**
   * validate join room payload
   * @param {Socket} client client socket
   * @param {string} room room id
   */
  private async validateJoinRoomPayload(
    client: Socket,
    room: string,
    password?: string,
  ) {
    // 1. check if client is already in the room
    const hasJoined = client.rooms.has(room);
    if (hasJoined) {
      throw new WsException(EVENT.ALREADY_JOINED);
    }

    // 2. get room data from db
    const { isPublic, hash, total } =
      await this.roomsDatabaseHelper.getRoomData(parseInt(room, 10));

    // 2. check if room exceeds max capacity
    let roomCurrentCount = 0;
    if (this.server.adapter['rooms'].get(room) !== undefined) {
      roomCurrentCount = this.server.adapter['rooms'].get(room).size;
    }
    if (roomCurrentCount >= total) {
      throw new WsException(EVENT.ROOM_FULL);
    }

    // 3. check password if room is private
    if (isPublic) return;
    const isValid = await AuthService.passwordMatch(password, hash);
    if (!isValid) {
      throw new WsException('Invalid password');
    }
  }

  /**
   * [REDIS]
   * create a user session in the redis store
   * @param {number} uid user id
   * @param {string} nickname nickname
   */
  private async createRedisSession(uid: number, nickname?: string) {
    // 1. find user in the redis store
    const session = await this.redisSessionStore.findSession(uid);

    // 2. if no session found, create a new one
    if (!session) {
      return this.redisSessionStore.saveSession(uid, {
        uid,
        nickname,
        connection: ConnectionType.ONLINE,
      });
    }

    // 3. session found, update the session
    return this.redisSessionStore.saveSession(uid, {
      connection: ConnectionType.ONLINE,
    });
  }

  /**
   * [REDIS]
   * disable a user session in the redis store
   * @param {number} uid user id
   */
  private async disableRedisSession(uid: number) {
    return this.redisSessionStore.saveSession(uid, {
      connection: ConnectionType.OFFLINE,
    });
  }
}
