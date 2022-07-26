# Modoco Backend

## API Documentation

## Installation

[모도코 API 문서](https://xn--hq1br4kwqt.com/docs)

### NPM packages

```bash
# install packages
$ yarn install

# clean install packages
$ yarn ci
```

### Docker containter

```bash
# up redis and postgresql
$ yarn docker

# remove all containers
$ yarn docker:rm
```

## Running the app

```bash
# development
$ yarn start

# local development
$ yarn start:restart

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Database (ORM)

### Prisam

```bash
yarn prisma studio
```

## Deploy

```bash
yarn deploy
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```
