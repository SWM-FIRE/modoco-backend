import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { SessionStore } from '../interface/SessionStore';

export enum ConnectionType {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Injectable()
export class RedisSessionStore implements SessionStore {
  private readonly SESSION_TTL = 24 * 60 * 60;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
  ) {}

  findSession(id) {
    return this.redisClient.hGetAll(`session:${id}`).then(this.mapSession);
  }

  saveSession(id, { uid, nickname, connection }: Payload) {
    const transaction = this.redisClient.multi();
    if (uid) {
      transaction.hSet(`session:${id}`, 'uid', uid);
    }
    if (nickname) {
      transaction.hSet(`session:${id}`, 'nickname', nickname);
    }
    if (connection) {
      transaction.hSet(`session:${id}`, 'connection', connection);
    }
    transaction.expire(`session:${id}`, this.SESSION_TTL).exec();
  }

  private mapSession(payload: Payload) {
    return payload.uid ? { ...payload } : undefined;
  }
}

type Payload = { uid?: number; nickname?: string; connection?: ConnectionType };
