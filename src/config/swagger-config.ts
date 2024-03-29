/* eslint-disable @typescript-eslint/ban-types */
import { DocumentBuilder } from '@nestjs/swagger';

export default () => ({
  SWAGGER_OPTIONS,
});

const API_VERSION = 'api/v1';
const SWAGGER_OPTIONS = new DocumentBuilder()
  .setTitle('모도코 API')
  .setDescription('Documentation for Modoco API')
  .setVersion('1.0.1')
  .setContact('Juhyeong Ko', 'https://modocode.com', 'dury.ko@gmail.com')
  .addTag('users', 'Users API')
  .addTag('rooms', 'Rooms API')
  .addTag('sessions', 'Users Session API')
  .addTag('records', 'Records API')
  .addTag('socket', 'Socket of Rooms')
  .addTag('friendships', 'Friendship API')
  .addTag('auth', 'Authentication API')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      name: 'authorization',
      in: 'header',
    },
    'access_token',
  )
  .addServer('https://api.modocode.com/' + API_VERSION, 'Production Server')
  .addServer('https://localhost:3333/' + API_VERSION, 'Localhost Server')
  .build();
