# Modoco Backend

## Installation

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
