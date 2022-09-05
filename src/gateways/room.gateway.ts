import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { RoomGatewayService } from './room.gateway.service';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/guard/wsJwt.guard';
import { UseGuards, UsePipes } from '@nestjs/common';
import { EVENT } from './constants/event.enum';
import { WebsocketValidationPipe } from './pipes/socket-validation.pipe';
import {
  AnswerOfferPayload,
  CallOfferPayload,
  ChatMessagePayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  RecordPayload,
  CandidatePayload,
  MediaStateChangePayload,
  KickUserPayload,
} from './dto';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  namespace: 'socket/room/',
})
@UsePipes(new WebsocketValidationPipe())
@UseGuards(WsJwtGuard)
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly roomGatewayService: RoomGatewayService) {}

  // OnGatewayInit
  afterInit(server: Server) {
    this.roomGatewayService.onAfterInit(server);
  }

  // OnGatewayConnection
  handleConnection(client: Socket) {
    this.roomGatewayService.onConnection(client);
  }

  // OnGatewayDisconnect
  handleDisconnect(client: Socket) {
    this.roomGatewayService.onDisconnect(client);
  }

  @SubscribeMessage(EVENT.JOIN_ROOM)
  async onJoinRoom(client: Socket, payload: JoinRoomPayload) {
    await this.roomGatewayService.onJoinRoom(client, payload);
  }

  @SubscribeMessage(EVENT.LEAVE_ROOM)
  async handleLeaveRoom(client: Socket, payload: LeaveRoomPayload) {
    await this.roomGatewayService.onLeaveRoom(client, payload);
  }

  @SubscribeMessage(EVENT.KICK_USER)
  async onKickUser(client: Socket, payload: KickUserPayload) {
    await this.roomGatewayService.onKickUser(client, payload);
  }

  @SubscribeMessage(EVENT.CHAT_MESSAGE)
  onChatMessage(client: Socket, message: ChatMessagePayload) {
    this.roomGatewayService.onChatMessage(client, message);
  }

  @SubscribeMessage(EVENT.CALL_USER)
  onCallUser(client: Socket, payload: CallOfferPayload) {
    this.roomGatewayService.onCallUser(client, payload);
  }

  @SubscribeMessage(EVENT.MAKE_ANSWER)
  onMakeAnswer(client: Socket, payload: AnswerOfferPayload) {
    this.roomGatewayService.onMakeAnswer(client, payload);
  }

  @SubscribeMessage(EVENT.ICE_CANDIDATE)
  onIceCandidate(client: Socket, payload: CandidatePayload) {
    this.roomGatewayService.onIceCandidate(client, payload);
  }

  @SubscribeMessage(EVENT.RECORD_TIME)
  async recordTime(client: Socket, payload: RecordPayload) {
    await this.roomGatewayService.onRecordTime(client, payload);
  }

  @SubscribeMessage(EVENT.VIDEO_STATE_CHANGE)
  onVideoStateChange(client: Socket, payload: MediaStateChangePayload) {
    this.roomGatewayService.onMediaStateChange(
      EVENT.VIDEO_STATE_CHANGE,
      client,
      payload,
    );
  }

  @SubscribeMessage(EVENT.AUDIO_STATE_CHANGE)
  onAudioStateChange(client: Socket, payload: MediaStateChangePayload) {
    this.roomGatewayService.onMediaStateChange(
      EVENT.AUDIO_STATE_CHANGE,
      client,
      payload,
    );
  }
}
