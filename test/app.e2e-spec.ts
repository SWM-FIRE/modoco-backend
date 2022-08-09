import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

// const
const PORT = 3336;
const BASE_URL = `http://localhost:${PORT}`;

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

    console.info('test server started on', BASE_URL);

    prisma = app.get(PrismaService);

    await prisma.cleanDatabase();
    pactum.request.setBaseUrl(BASE_URL);
  });

  afterAll(() => {
    app.close();
  });

  describe('Check test server', () => {
    it('should return 200', async () => {
      return await pactum
        .spec()
        .get('/')
        .expectStatus(200)
        .expectBodyContains('Welcome');
    });
  });

  describe('Users', () => {
    describe('/users', () => {
      describe('GET /users without credential', () => {
        it('should not return all users', () => {
          return pactum.spec().get('/users').expectStatus(401);
        });
      });

      // register
      describe('POST /users', () => {
        const fineBody = {
          nickname: 'test',
          password: 'test',
          email: 'test@test.com',
          avatar: 1,
        };

        it('should throw if email empty', async () => {
          const body = { ...fineBody };
          delete body.email;
          return await pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains('email should not be empty');
        });

        it('should throw if email is not valid', async () => {
          const body = { ...fineBody };
          body.email = 'not an email';
          return await pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains('email must be an email');
        });

        it('should throw if password empty', async () => {
          const body = { ...fineBody };
          delete body.password;
          return await pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains('password should not be empty');
        });

        it('should throw if password is empty string', async () => {
          const body = { ...fineBody };
          body.password = '';
          return await pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request');
        });

        it('should throw if avatar empty', async () => {
          const body = { ...fineBody };
          delete body.avatar;
          return await pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains('avatar should not be empty');
        });
        it('should throw if avatar is not valid', async () => {
          return await pactum
            .spec()
            .post('/users')
            .withBody({
              nickname: 'test',
              password: 'test',
              email: 'test@test.com',
              avatar: 'not a valid avatar',
            })
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains(
              'avatar must be a number conforming to the specified constraints',
            );
        });

        it('shoud create new user `test` and return token', async () => {
          return await pactum
            .spec()
            .post('/users')
            .withBody({
              nickname: 'test',
              password: 'test',
              email: 'test@test.com',
              avatar: 1,
            })
            .expectStatus(201)
            .stores('testToken', 'access_token');
        });

        it('duplicate email cannot register', async () => {
          return await pactum
            .spec()
            .post('/users')
            .withBody({
              nickname: 'test_duplicate',
              password: 'test',
              email: 'test@test.com',
              avatar: 7,
            })
            .expectStatus(403)
            .expectBodyContains('Forbidden')
            .expectBodyContains('User already exists');
        });

        it('shoud create new user `test2` and return token', async () => {
          return await pactum
            .spec()
            .post('/users')
            .withBody({
              nickname: 'test2',
              password: 'test',
              email: 'test2@test.com',
              avatar: 2,
            })
            .expectStatus(201)
            .stores('testToken2', 'access_token');
        });

        it('shoud read user info with valid token', async () => {
          return await pactum
            .spec()
            .get('/users/me')
            .withHeaders({
              Authorization: 'Bearer $S{testToken}',
            })
            .expectStatus(200)
            .inspect();
        });

        it('user list should return have one user', () => {
          return pactum
            .spec()
            .get('/users')
            .withHeaders({
              Authorization: 'Bearer $S{testToken}',
            })
            .expectJsonLength(2)
            .expectStatus(200);
        });
      });

      describe('read user info', () => {
        it('shoud not return user info without token', async () => {
          return await pactum.spec().get('/users/me').expectStatus(401);
        });

        it('shoud return user `test` info with token', async () => {
          return await pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken}',
            })
            .get('/users/me')
            .expectStatus(200)
            .stores('testTokenUID', 'uid');
        });

        it('shoud return user `test2` info with token', async () => {
          return await pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .get('/users/me')
            .expectStatus(200)
            .stores('testTokenUID2', 'uid');
        });
      });

      // /user/:uid
      describe('/users/:uid', () => {
        describe('GET /users/:uid', () => {
          it('should return a user by uid', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken}',
              })
              .get('/users/{uid}')
              .withPathParams('uid', '$S{testTokenUID}')
              .expectStatus(200);
          });

          it('should return no body when user is not found', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken}',
              })
              .get('/users/9999')
              .expectStatus(200)
              .expectHeader('content-length', '0')
              .expectBody('');
          });
        });

        describe('POST /users/:uid', () => {
          it.todo('should update new information about a user');
        });

        describe('DELETE /users/:uid', () => {
          it('should delete a user by uid', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken2}',
              })
              .delete('/users')
              .withBody({ uid: '$S{testTokenUID2}' })
              .expectStatus(200);
          });

          it('user list should return have one user', () => {
            return pactum
              .spec()
              .get('/users')
              .withHeaders({
                Authorization: 'Bearer $S{testToken}',
              })
              .expectJsonLength(1)
              .expectStatus(200);
          });
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
        it('room list should return without credential', () => {
          return pactum.spec().get('/rooms').expectStatus(200);
        });
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
