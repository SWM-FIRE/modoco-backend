import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const redisClientFactory = {
  provide: 'REDIS_CLIENT',
  useFactory: async (configService: ConfigService) => {
    const HOST = configService.get('REDIS').HOST;
    console.log('REDIS HOST FOR CLIENT', HOST);

    const redisClient = await getClient(HOST);
    return redisClient;
  },
  inject: [ConfigService],
};

async function getClient(redisHostAddress: string) {
  const logger: Logger = new Logger('REDIS CLIENT');
  const client = createClient({ url: redisHostAddress });

  client.on('error', (error) => logger.error({ error }));

  await client.connect();

  return client;
}
