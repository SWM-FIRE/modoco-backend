import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

// const
const PORT = 3336;
const API_VERSION = 'api/v1';
const BASE_URL = `http://localhost:${PORT}/${API_VERSION}`;

describe('Application e2e test', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(PORT);

    prisma = app.get(PrismaService);
    //await prisma.cleanDb();
    pactum.request.setBaseUrl(BASE_URL);
  });

  afterAll(() => {
    app.close();
  });

  describe('Users', () => {
    describe('/users', () => {
      describe('GET /users', () => {
        it.todo('should return all users');
      });

      // register
      describe('POST /users', () => {
        it.todo(
          'should register(signup) a user and record information into database as new /user/:uid',
        );

        it.todo('should throw if email empty');
        it.todo('should throw if email is not valid');

        it.todo('should throw if password empty');
        it.todo('should throw if password is not valid');
      });

      // /user/:uid
      describe('/users/:uid', () => {
        describe('GET /users/:uid', () => {
          it.todo('should return a user');
        }),
          it.todo('should throw if user not found');

        describe('POST /users/:uid', () => {
          it.todo('should update new information about a user');
        });

        describe('DELETE /users/:uid', () => {
          it.todo('should delete a user');
        });

        // [고민] 비밀 번호 잊었을 때 어떻게 할까?
      });
    });
  });

  describe('Session', () => {
    // 세션 생성 (실제 DB에 반영)
    describe('POST /session', () => {
      it.todo('should create a session to be logged in');

      it.todo('should throw if email empty');
      it.todo('should throw if email not found');

      it.todo('should throw if password empty');
      it.todo('should throw if password wrong');

      it.todo('should throw if body is empty');
    });

    // 세션 삭제
    describe('Delete /session', () => {
      it.todo('should delete a session');
    });
  });

  describe('Rooms', () => {
    describe('/rooms', () => {
      // 방 생성
      describe('POST /rooms', () => {
        it.todo('should create a room');
      });

      // 모든 방 조회
      describe('GET /rooms', () => {
        it.todo('should find all rooms');
      });

      // /rooms/:roomId
      describe('/rooms/:roomId', () => {
        // 특정 방 조회
        describe('GET /rooms/:roomId', () => {
          it.todo('should find a room');
        });

        // 방 삭제
        describe('DELETE /rooms/:roomId', () => {
          it.todo('should delete a room');
        });
      });
    });
  });
});
