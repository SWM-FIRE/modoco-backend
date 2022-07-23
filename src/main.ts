import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NewrelicInterceptor } from './interceptors/newrelic.interceptor';
import { join } from 'path';
import helmet from 'helmet';

const logger = new Logger('Modoco Bootstrap');

/**
 * bootstrap server
 */
async function bootstrap() {
  try {
    // create express application
    const app = await createServer();

    // pre init server
    preInitServer(app);

    // connect to redis
    const redisIoAdapter = await connectRedis(app);

    // init server
    await initServer(app, redisIoAdapter);
  } catch (error) {
    logger.error(error.message);
  }
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
function preInitServer(app: NestExpressApplication): void {
  // should be executed before helmet to bypass helmet
  hostStaticAssets(app);

  // helmet middleware for security enhancement
  app.use(helmet());

  // cors
  const allowlist = [
    'https://modocode.com',
    'https://modoco-frontend.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000',
    /\.xn--hq1br4kwqt\.com/,
  ];

  const corsOptionsDelegate = function (req, callback) {
    let corsOptions;
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
      corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
    } else {
      corsOptions = { origin: false }; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
  };

  app.enableCors(corsOptionsDelegate);
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
 * host static asset using express static middleware
 * this should be executed before helmet to bypass helmet
 * @param {NestExpressApplication} app NestExpressApplication app
 */
function hostStaticAssets(app: NestExpressApplication): void {
  app.useStaticAssets(join(__dirname, '..', 'static'));
}

/**
 * initialize server
 * @param {NestExpressApplication} app NestExpressApplication app
 * @param {RedisIoAdapter} redisIoAdapter redis adapter
 */
async function initServer(
  app: NestExpressApplication,
  redisIoAdapter: RedisIoAdapter,
) {
  app.useWebSocketAdapter(redisIoAdapter);
  app.useGlobalInterceptors(new NewrelicInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
