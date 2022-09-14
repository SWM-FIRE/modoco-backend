import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

// const
const PORT = 3336;
const BASE_URL = `http://localhost:${PORT}`;

describe('Application integration test', () => {
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
    prisma.$disconnect();
  });

  describe('Check test server', () => {
    it('should return 200', async () => {
      return pactum
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
          return pactum
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
          return pactum
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
          return pactum
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
          return pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request');
        });

        it('should throw if avatar empty', async () => {
          const body = { ...fineBody };
          delete body.avatar;
          return pactum
            .spec()
            .post('/users')
            .withBody(body)
            .expectStatus(400)
            .expectBodyContains('Bad Request')
            .expectBodyContains('avatar should not be empty');
        });
        it('should throw if avatar is not valid', async () => {
          return pactum
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

        it('should create new user `test` and return token', async () => {
          return pactum
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
          return pactum
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

        it('should create new user `test2` and return token', async () => {
          return pactum
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

        it('should read user info with valid token', async () => {
          return pactum
            .spec()
            .get('/users/me')
            .withHeaders({
              Authorization: 'Bearer $S{testToken}',
            })
            .expectStatus(200);
        });

        it('users list should return one user', () => {
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
        it('should not return user info without token', async () => {
          return pactum.spec().get('/users/me').expectStatus(401);
        });

        it('should return user `test` info with token', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken}',
            })
            .get('/users/me')
            .expectStatus(200)
            .stores('testTokenUID', 'uid');
        });

        it('should return user `test2` info with token', async () => {
          return pactum
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
      describe('action on a specific user', () => {
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

        describe('PUT /users', () => {
          describe('should update new information about a user', () => {
            it('create new user', async () => {
              return pactum
                .spec()
                .post('/users')
                .withBody({
                  nickname: 'test_put',
                  password: 'test',
                  email: 'put@test.com',
                  avatar: 3,
                })
                .stores('testPutToken', 'access_token')
                .expectStatus(201);
            });

            it('read new user information and store uid', async () => {
              return pactum
                .spec()
                .withHeaders({
                  Authorization: 'Bearer $S{testPutToken}',
                })
                .get('/users/me')
                .expectStatus(200)
                .expectBodyContains('test_put')
                .expectBodyContains('put@test.com')
                .stores('testPutTokenUID', 'uid');
            });

            it('update nickname of a user', async () => {
              return pactum
                .spec()
                .withHeaders({
                  Authorization: 'Bearer $S{testPutToken}',
                })
                .withBody({
                  nickname: 'test_updated',
                })
                .put('/users')
                .expectStatus(200)
                .expectBodyContains('email');
            });

            it('read updated user information', async () => {
              return pactum
                .spec()
                .withHeaders({
                  Authorization: 'Bearer $S{testPutToken}',
                })
                .get('/users/me')
                .expectStatus(200)
                .expectBodyContains('test_updated')
                .expectBodyContains('put@test.com');
            });
          });
        });

        describe('DELETE /users', () => {
          it('should delete a user by uid', () => {
            return pactum
              .spec()
              .wait(500)
              .withHeaders({
                Authorization: 'Bearer $S{testPutToken}',
              })
              .withBody({ uid: '$S{testPutTokenUID}' })
              .delete('/users')
              .expectStatus(204);
          });

          it('users list should return one user', () => {
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

        // [고민] 비밀 번호 잊었을 때 어떻게 할까?
      });
    });
  });

  describe('Session', () => {
    // 세션 생성 (실제 DB에 반영)
    describe('POST /session', () => {
      it('should create a session and return login', async () => {
        return pactum
          .spec()
          .post('/session')
          .withBody({
            password: 'test',
            email: 'test@test.com',
          })
          .expectStatus(201)
          .stores('testSession', 'access_token')
          .expectBodyContains('access_token');
      });

      it('should throw if email empty', async () => {
        return pactum
          .spec()
          .post('/session')
          .withBody({
            password: 'test',
          })
          .expectStatus(400)
          .expectBodyContains('email should not be empty')
          .expectBodyContains('Bad Request');
      });

      it('should throw if email empty', async () => {
        return pactum
          .spec()
          .post('/session')
          .withBody({
            email: 'email.that@doesnt.exist',
            password: 'test',
          })
          .expectStatus(403)
          .expectBodyContains('Credential incorrect')
          .expectBodyContains('Forbidden');
      });

      it('should throw if password empty', async () => {
        return pactum
          .spec()
          .post('/session')
          .withBody({
            email: 'test@test.com',
          })
          .expectStatus(400)
          .expectBodyContains('password should not be empty')
          .expectBodyContains('Bad Request');
      });

      it('should throw if password wrong', async () => {
        return pactum
          .spec()
          .post('/session')
          .withBody({
            email: 'test@test.com',
            password: 'wrong',
          })
          .expectStatus(403)
          .expectBodyContains('Credential incorrect')
          .expectBodyContains('Forbidden');
      });

      it('should throw if body is empty', async () => {
        return pactum
          .spec()
          .post('/session')
          .expectStatus(400)
          .expectBodyContains('email should not be empty')
          .expectBodyContains('password should not be empty');
      });
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
        it('should create a room', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .post('/rooms')
            .withBody({
              title: 'test_room',
              total: 4,
              theme: 'ocean',
              tags: ['ts', 'study'],
            })
            .expectStatus(201)
            .stores('testRoomId', 'itemId');
        });

        it('should fail if no title', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .post('/rooms')
            .withBody({
              theme: 'ocean',
              tags: ['react, ts'],
              total: 4,
            })
            .expectStatus(400)
            .expectBodyContains('title should not be empty');
        });

        it('should fail if no theme', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .post('/rooms')
            .withBody({
              title: 'test_room',
              tags: ['javascript', 'react', 'ts'],
              total: 4,
            })
            .expectStatus(400)
            .expectBodyContains('theme should not be empty');
        });

        it('should fail if no total', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .post('/rooms')
            .withBody({
              title: 'test_room',
              tags: ['javascript', 'react', 'ts'],
              theme: 'ocean',
            })
            .expectStatus(400)
            .expectBodyContains('total should not be empty');
        });

        it('should fail if no tags', async () => {
          return pactum
            .spec()
            .withHeaders({
              Authorization: 'Bearer $S{testToken2}',
            })
            .post('/rooms')
            .withBody({
              title: 'test_room',
              theme: 'ocean',
              total: 4,
            })
            .expectStatus(400)
            .expectBodyContains('tags must be an array');
        });
      });

      // 모든 방 조회
      describe('GET /rooms', () => {
        it('room list should return without credential', () => {
          return pactum
            .spec()
            .get('/rooms')
            .expectStatus(200)
            .expectBodyContains('test_room')
            .expectJsonLength(1);
        });
      });

      // /rooms/:roomId
      describe('/rooms/:roomId', () => {
        // 특정 방 조회 - testRoomId
        describe('GET /rooms/:roomId', () => {
          it('should throw if find a room without token', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken2}',
              })
              .get('/rooms/$S{testRoomId}')
              .expectStatus(200)
              .expectBodyContains('test_room');
          });

          it('should throw if find a room without token', () => {
            return pactum
              .spec()
              .get('/rooms/S{testRoomId}')
              .expectStatus(401)
              .expectBodyContains('Unauthorized');
          });
        });

        // 방 삭제
        describe('DELETE /rooms/:roomId', () => {
          it('should delete a room by room itemId', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken}',
              })
              .delete('/rooms/$S{testRoomId}')
              .expectStatus(204);
          });

          it('should throw if delete a room without token', () => {
            return pactum
              .spec()
              .delete('/rooms/$S{testRoomId}')
              .expectStatus(401);
          });

          it('check if room is deleted by room list', () => {
            return pactum
              .spec()
              .get('/rooms')
              .expectStatus(200)
              .expectJsonLength(0);
          });

          it('check if room is deleted by finding with room itemId', () => {
            return pactum
              .spec()
              .withHeaders({
                Authorization: 'Bearer $S{testToken}',
              })
              .get('/rooms/$S{testRoomId}')
              .expectStatus(200)
              .withBody('');
          });
        });
      });
    });
  });

  describe('Records', () => {
    it.todo('Get + /records');
    it.todo('Delete + /records');
  });
});
