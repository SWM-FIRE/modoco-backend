import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import { SessionStore } from '../interface/SessionStore';

export enum ConnectionType {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Injectable()
export class RedisSessionStore implements SessionStore {
  private readonly SESSION_TTL = 24 * 60 * 60;

  private REDIS_HOST = this.configService.get('REDIS').HOST;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    private configService: ConfigService,
  ) {}

  findSession(id) {
    return this.redisClient.hGetAll(`session:${id}`).then(this.mapSession);
  }

  saveSession(id, { uid, nickname, connected }: Payload) {
    const transaction = this.redisClient.multi();
    if (uid) {
      transaction.hSet(`session:${id}`, 'uid', uid);
    }
    if (nickname) {
      transaction.hSet(`session:${id}`, 'nickname', nickname);
    }
    if (connected) {
      transaction.hSet(`session:${id}`, 'connection', connected);
    }
    transaction.expire(`session:${id}`, this.SESSION_TTL).exec();
  }

  private mapSession(payload: Payload) {
    return payload.uid ? { ...payload } : undefined;
  }
}

type Payload = { uid?: string; nickname?: string; connected?: ConnectionType };
