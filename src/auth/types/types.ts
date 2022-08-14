import { Socket } from 'socket.io';

type AuthPayload = {
  uid: string;
  email: string;
};

export type SocketWithAuth = Socket & AuthPayload;
