import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'socket/chat',
})
export class ChatGateway {
  @WebSocketServer()
  server;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): void {
    // `message from ${client.id}: ${payload.body}`;
    this.server.emit('message', payload.body);
  }
}
