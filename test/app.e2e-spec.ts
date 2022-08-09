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

  describe('Auth', () => {
    // 회원가입
    describe('/auth/register', () => {
      it.todo('should register(signup) a user');

      it.todo('should throw if email empty');
      it.todo('should throw if email is not valid');

      it.todo('should throw if password empty');
      it.todo('should throw if password is not valid');
    });
    // 로그인
    describe('/auth/login', () => {
      it.todo('should login(signin) a user');

      it.todo('should throw if email empty');
      it.todo('should throw if email not found');

      it.todo('should throw if password empty');
      it.todo('should throw if password wrong');

      it.todo('should throw if body is empty');
    });

    // 로그아웃
    describe('/auth/logout', () => {
      it.todo('should logout a user');
    });
  });

  describe('Rooms', () => {
    describe('/rooms', () => {
      // 방 생성
      describe('POST + /rooms', () => {
        it.todo('should create a room');
      });

      // 모든 방 조회
      describe('GET + /rooms', () => {
        it.todo('should find all rooms');
      });
    }),
      describe('/rooms/:roomId', () => {
        // 특정 방 조회
        describe('GET + /rooms/:roomId', () => {
          it.todo('should find a room');
        });

        // 방 삭제
        describe('DELETE + /rooms/:roomId', () => {
          it.todo('should delete a room');
        });
      });
  });

  // describe('User', () => {
  //   // 모든 사용자 조회
  //   describe('GET all /users', () => {
  //     it.todo('should get users list');
  //   });
  //   // 사용자 정보 수정
  //   describe('PUT + /users', () => {
  //     it.todo('should update user');
  //   });
  //   // 사용자 정보 삭제
  //   describe('DELETE + /users', () => {
  //     it.todo('should delete user');
  //   });
  //   // 사용자 정보 조회
  //   describe('GET /users/:uid', () => {
  //     it.todo('should get user info');
});
