/* eslint-disable @typescript-eslint/ban-types */
import { DocumentBuilder } from '@nestjs/swagger';

export default () => ({
  SWAGGER_OPTIONS,
});

const API_VERSION = 'api/v1';
// USER CONFIG
const SWAGGER_OPTIONS = new DocumentBuilder()
  .setTitle('모도코 API')
  .setDescription('Documentation for Modoco API')
  .setVersion('0.0.1')
  .setContact('Juhyeong Ko', 'https://modocode.com', 'dury.ko@gmail.com')
  .setBasePath('/api/v1')
  .addTag('users', 'Users API')
  .addTag('rooms', 'Rooms API')
  .addServer('https://모도코.com/' + API_VERSION, 'Production Server')
  .addServer('http://localhost:3333/' + API_VERSION, 'Localhost Server')
  .build();
