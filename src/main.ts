import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  // ssl certificate
  const httpsOptions = {
    key: fs.readFileSync('./secrets/server.key'),
    cert: fs.readFileSync('./secrets/server.crt'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // redis
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // cors
  const allowlist = ['*']; // 나중에 프론트엔드 웹 주소로 변경할 것
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

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
