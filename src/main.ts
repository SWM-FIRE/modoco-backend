import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NewrelicInterceptor } from './interceptors/newrelic.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule } from '@nestjs/swagger';
import { AuthService } from './auth/auth.service';

/**
 * bootstrap server
 */
async function bootstrap() {
  // create express application
  const app = await createServer();

  // get config service
  const configService = app.get(ConfigService);
  const authService = app.get(AuthService);

  // pre init server
  preInitServer(app, configService);

  // connect to redis
  const redisIoAdapter = await connectRedis(app, configService, authService);

  // init server
  return await initServer(app, redisIoAdapter, configService);
}

/**
 * Create nestExpressApplication application
 * @returns {Promise<NestExpressApplication>} NestExpressApplication app
 */
async function createServer(): Promise<NestExpressApplication> {
  return await NestFactory.create<NestExpressApplication>(AppModule);
}

/**
 * use middleware that should be executed before server init
 * @param {NestExpressApplication} app NestExpressApplication app
 * @param {ConfigService} configService config service
 */
function preInitServer(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  const ALLOWLIST = configService.get('CORS_ALLOWLIST');
  const CSP_POLICY = configService.get('CSP_POLICY');

  /**
   * construct cors options delegate
   * @param {any} req request
   * @param {Function} callback callback expects two parameters: error and options
   */
  const corsOptions = {
    origin: ALLOWLIST,
  };

  app
    .use(
      helmet.contentSecurityPolicy({
        directives: CSP_POLICY,
      }),
    ) // helmet middleware for security enhancement
    .enableCors(corsOptions); // enable cors

  // swagger document builder
  createDocument(app, configService);
}

/**
 * create RedisIoAdapter and connect to redis
 * @param {NestExpressApplication} app NestExpressApplication app
 * @param {ConfigService} configService config service
 * @returns {Promise<RedisIoAdapter>} redis adapter
 */
async function connectRedis(
  app: NestExpressApplication,
  configService: ConfigService,
  authService: AuthService,
): Promise<RedisIoAdapter> {
  const redisIoAdapter = new RedisIoAdapter(app, configService, authService);
  await redisIoAdapter.connectToRedis();

  return redisIoAdapter;
}

/**
 *
 * @param {NestExpressApplication} app
 * @param {ConfigService} configService
 */
function createDocument(
  app: NestExpressApplication,
  configService: ConfigService,
) {
  const SWAGGER_OPTIONS = configService.get('SWAGGER_OPTIONS');
  const document = SwaggerModule.createDocument(app, SWAGGER_OPTIONS);
  SwaggerModule.setup('docs', app, document);
}

/**
 * initialize server
 * @param {NestExpressApplication} app NestExpressApplication app
 * @param {RedisIoAdapter} redisIoAdapter redis adapter
 * @param {ConfigService} configService config service
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

// logger for server
const logger = new Logger('ModocoBootstrap');

// call bootstrap
bootstrap()
  .then((port) => logger.log(`Server listening on port ${port}`))
  .catch((error) => logger.error(error.message, error));
