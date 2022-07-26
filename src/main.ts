import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NewrelicInterceptor } from './interceptors/newrelic.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * logging server start message
 */
const logger = new Logger('Modoco Bootstrap');

/**
 * bootstrap server
 */
async function bootstrap() {
  // create express application
  const app = await createServer();

  // get config service
  const configService = app.get(ConfigService);

  // pre init server
  preInitServer(app, configService);

  // connect to redis
  const redisIoAdapter = await connectRedis(app);

  // init server
  return await initServer(app, redisIoAdapter, configService);
}

/**
 * Create nestExpressApplication application
 * @returns {Promise<NestExpressApplication>} NestExpressApplication app
 */
async function createServer(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  return app;
}

/**
 * use middleware that should be executed before server init
 * @param {NestExpressApplication} app NestExpressApplication app
 */
function preInitServer(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  const ALLOWLIST = configService.get('CORS_ALLOWLIST');
  const STATIC_ASSETS_PATH = configService.get<string>('STATIC_ASSETS_PATH');

  /**
   * construct cors options delegate
   * @param {any} req request
   * @param {Function} callback callback expects two parameters: error and options
   */
  const corsOptionsDelegate = function (req, callback) {
    const origin = ALLOWLIST.includes(req.header('Origin'));
    const corsOptions = {
      origin,
    };

    callback(null, corsOptions);
  };

  app
    .useStaticAssets(STATIC_ASSETS_PATH) // should be executed before helmet to bypass helmet
    .use(helmet()) // helmet middleware for security enhancement
    .enableCors(corsOptionsDelegate); // enable cors
}

/**
 * create RedisIoAdapter and connect to redis
 * @param {NestExpressApplication} app NestExpressApplication app
 * @returns {Promise<RedisIoAdapter>} redis adapter
 */
async function connectRedis(
  app: NestExpressApplication,
): Promise<RedisIoAdapter> {
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  return redisIoAdapter;
}

/**
 * initialize server
 * @param {NestExpressApplication} app NestExpressApplication app
 * @param {RedisIoAdapter} redisIoAdapter redis adapter
 */
async function initServer(
  app: NestExpressApplication,
  redisIoAdapter: RedisIoAdapter,
  configService: ConfigService,
) {
  const PORT = configService.get<number>('PORT');
  const API_VERSION = configService.get<string>('API_VERSION');

  await app
    .useWebSocketAdapter(redisIoAdapter)
    .useGlobalPipes(new ValidationPipe({ whitelist: true }))
    .useGlobalInterceptors(new NewrelicInterceptor())
    .setGlobalPrefix(`/api/${API_VERSION}`)
    .listen(PORT);

  return PORT;
}

bootstrap()
  .then((port) => logger.log(`Server listening on port ${port}`))
  .catch((error) => logger.error(error.message, error));
