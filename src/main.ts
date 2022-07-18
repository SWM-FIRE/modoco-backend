import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NewrelicInterceptor } from './interceptors/newrelic.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // helmet middleware should be placed before any other middleware
  app.use(helmet());

  // cors
  const allowlist = [
    'https://modocode.com',
    'https://modoco-frontend.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000',
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

  // redis
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // newrelic interceptor
  app.useGlobalInterceptors(new NewrelicInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
