import { WsException } from '@nestjs/websockets';
import { User } from '@prisma/client';
import { Server, Socket, RemoteSocket } from 'socket.io';
import { EVENT } from '../constants/event.enum';

// get all users sockets in target room
const getAllRoomSockets = (server: Server, room: string) => {
  return server.in(room).fetchSockets();
};

/**
 * get all users who in currently in the room
 * @param {string} room room id in string
 * @returns {Promise<Socket[]>} list of sockets
 */
export const getExistingRoomMembersCount = async (
  server: Server,
  room: string,
) => {
  const roomSockets = await getAllRoomSockets(server, room);
  return roomSockets.length;
};

// get all user data of sockets in target room
export const getAllRoomUsers = async (server: Server, room: string) => {
  const roomSockets = await getAllRoomSockets(server, room);

  // extract uid data from each roomSockets
  return roomSockets.map((roomMember) => {
    return {
      sid: roomMember.id,
      uid: roomMember.data.uid,
    };
  });
};

export const getMatchingSocketsBySid = async (
  server: Server,
  room: string,
  sid: string,
) => {
  const roomMembers = await server.in(room).fetchSockets();
  const targetSockets = roomMembers.filter((socket) => {
    return socket.id === sid;
  });

  if (targetSockets.length === 0) {
    throw new WsException('No matching user found in the room');
  }

  return targetSockets[0];
};

/**
 * join socket.io room session and emit event to client
 * @param {Socket} client socket.io client
 * @param {string} room room id string
 * @param existingMembers existing members in the room
 */
export const joinClientToRoom = async (
  client: Socket,
  room: string,
  existingMembers: { uid: any; sid: string }[],
) => {
  await client.join(room);
  // emit joinedRoom event to client
  client.emit(EVENT.JOINED_ROOM, { room });

  // emit to client who is currently in the room
  client.emit(EVENT.EXISTING_ROOM_USERS, {
    users: existingMembers,
    current: { sid: client.id, uid: client.data.uid },
  });
};

export const kickUserFromRoom = (
  client: RemoteSocket<any, any>,
  room: string,
) => {
  client.leave(room);
};

/**
 * notify all users in room that a new user has joined except the user itself
 * @param {Socket} client socket.io client
 * @param {string} room room id string
 * @param {string} uid user id string
 */
export const notifyNewUserJoined = async (
  client: Socket,
  room: string,
  uid: number,
) => {
  client.to(room).emit(EVENT.NEW_USER, {
    sid: client.id,
    uid,
  });
};

/**
 * notify all users in room that a user will be kicked
 * @param server socket.io server
 * @param room room id string
 * @param kickUser user id to be kicked
 */
export const notifyKickUser = async (
  server: Server,
  room: string,
  kickUser: UserToKick,
) => {
  server.to(room).emit(EVENT.KICK_USER, {
    kickUser,
  });
};

type UserToKick = {
  uid: number;
  nickname: string;
  avatar: number;
  email: string;
  status_quo: string;
  github_link: string;
  blog_link: string;
  groups: string[];
  verified: boolean;
  verify_token: string;
};
/**
 * get user data using jwt token authentication
 */
export const getSocketUser: (client: Socket) => User = (client: Socket) => {
  const user = client.handshake['user'];
  if (!user) {
    throw new WsException('Invalid socket credentials');
  }

  return user;
};
