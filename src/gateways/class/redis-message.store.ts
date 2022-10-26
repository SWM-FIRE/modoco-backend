import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { MessageStore } from '../interface/MessageStore';

@Injectable()
export class RedisMessageStore implements MessageStore {
  private readonly CONVERSATION_TTL = 24 * 60 * 60;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
  ) {}

  saveMessage(message: {
    from: string;
    to: string;
    type?: string;
    message: string;
    createdAt: string;
  }) {
    const value = JSON.stringify(message);
    this.redisClient
      .multi()
      .rPush(`messages:${message.from}`, value)
      .rPush(`messages:${message.to}`, value)
      .expire(`messages:${message.from}`, this.CONVERSATION_TTL)
      .expire(`messages:${message.to}`, this.CONVERSATION_TTL)
      .exec();
  }

  findMessagesForUser(
    uid: number,
  ): Promise<
    { from: string; to: string; message: string; createdAt: string }[]
  > {
    return this.redisClient.lRange(`messages:${uid}`, 0, -1).then((results) => {
      return results.map((result) => JSON.parse(result));
    });
  }
}
