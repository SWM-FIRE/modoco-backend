import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { SocketWithAuth } from 'src/auth/types/types';

export class RedisIoAdapter extends IoAdapter {
  constructor(
    appOrHttpServer: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(appOrHttpServer);
  }

  private logger = new Logger('RedisIoAdapter');
  private REDIS_HOST = this.configService.get('REDIS').HOST;
  private adapterConstructor: ReturnType<typeof createAdapter>;

  /**
   * connect to redis and create redis adapter
   * @param {NestExpressApplication} app NestExpressApplication app
   * @returns {Promise<void>}
   */
  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: this.REDIS_HOST,
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);

    this.logger.debug(`Connect to Redis : ${this.REDIS_HOST}`);
  }

  /**
   * create socket.io server using redis adapter
   * @param {number} port port of server
   * @param {ServerOptions} options options of socket.io server
   * @returns {Promise<Server>}
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);

    this.logger.log(`Create SocketIO Server using redis adapter`);

    return server;
  }
}
