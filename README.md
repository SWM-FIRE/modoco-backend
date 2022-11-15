# Modoco Backend

Modoco Backend Server
 - `Socket.IO Server` with Redis Adapter
 - `HTTP API Server` documented with Swagger
 
Issue is tracked with JIRA

## API Documentation

[모도코 API 문서](https://api.modocode.com/docs)

## (Required) Project settings

먼저 `.env`파일을 아래의 양식을 참고해서 만듭니다. 프로젝트 루트 디렉터리 아래에 넣어야 합니다.

별도로 서버를 띄우지 않더라도 간편하게 Docker로 띄워서 바로 modoco-backend를 실행할 수 있도록 스크립트를 구성해두었습니다.

Docker와 관련된 파일은 `/dockers`에 있습니다.

만약 따로 서버를 운영하시는 경우 아래의 `.env` 양식을 참고해서 주소와 비밀번호를 세팅하시면 됩니다.

상세한 설정 값에 관해서는 `/src/config/` 아래에 있는 파일들을 참고해주세요.

```env
# *********************************************** #
#  This is an example env file for modoco server  #
# *********************************************** #

# ENV (Defaults to development)
ENV="production"

# BASE URL of this Server
BASE_URL="https://api.modocode.com/api/v1"

# Sever Port (Defaults to 3000)
PORT=3333

# Redis
REDIS_URL="redis://your_redis_url:your_redis_port"
REDIS_PASSWORD="your_redis_password"
REDIS_HOST_NAME="redis"
REDIS_PORT=6379
REDIS_PASSWORD=

# Database
DATABASE_URL="postgres://your_db_id:your_db_password@your_db_host_url:your_postgres_port"

# JWT (Defaults to 'very-very-secret')
JWT_SECRET="your_jwt_secret"

# OAuth Login
KAKAO_CLIENT_ID=
KAKAO_CALLBACK_URL=
GITHUB_CLIENT_ID=
GITHUB_CALLBACK_URL=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CALLBACK_URL=
GOOGLE_CLIENT_SECRET=

# OAuth redirect url to frontend
AUTH_FRONTEND_URL=

# Logging - for no coloring
NO_COLOR=true

# IAM for AWS SDK
# this IAM should have permission of `AmazonSES`, `Auto Scaling`, `EC2 Auto Scaling`
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

## Installation

### 1. Install npm dependency

```bash
# install packages
$ yarn install

# clean install packages
$ yarn ci
```

### 2. Run Containers

```bash
# run redis, postgresql container and migrate to postgresql
$ yarn docker:dev:up && yarn prisma:dev:deploy
```

### 3. Run NestJS app

```bash
# run app
$ yarn start

# run in watch mode
$ yarn start:dev

# production mode
$ yarn start:prod

# repl mode
$ yarn start:repl
```

## Deployment

```bash
# deploy nest app (=`yarn ci && yarn build && yarn start:prod`)
$ yarn deploy
```

## Termination

```bash
# remove test db container
$ yarn db:test:rm

# remove production db container
$ yarn db:dev:rm

# remove redis container
$ yarn redis:rm
```

## Testing

`docker`, `docker-compose` is needed.
It automatically creates test db container using docker when e2e test is ran.

```bash
# unit tests
$ yarn test

# e2e test
$ yarn test:e2e

# coverage
$ yarn test:cov
```

## Prisma

### Migration

- Migration files are in `/prisma/migrations/`.
- Schema is `/prisma/schema.prisma`
  - you have to configure `binaryTargets` depending on what OS you use

#### Migrate to production database

```bash
# migrate migration files to database
yarn prisma:dev:deploy
```

#### Create migration

```bash
yarn prisma migrate dev
```

This command

- Create migration from your schema
- Apply migrations to database
- Generate artifacts (e.g. Prisma Client)

### Management

```bash
# Pull and update schema from existing db
$ yarn prisma db pull

# Push schema state to db
$ yarn prisma db push
```

### Tool

Simple database helper embeded in prisma

```bash
yarn prisma studio
```

Generate prisma artifacts (ex. client file)

```bash
yarn prisma generate
```

### Sponsor
</details>

<p align="center"><i>This Project is Sponsored by <b>Software Maestro</b></i></p>

<p align="center">This work was supported by the Institute of Information & Communications Technology Planning & Evaluation(IITP) grant funded by the Ministry of Science and ICT(MSIT) (IITP-0000-SW Maestro training course).</p>
