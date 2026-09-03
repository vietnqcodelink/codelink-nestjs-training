<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

Use Node.js 24, which is also used by CI and the production image:

```bash
$ nvm use
$ npm install
$ cp .env.example .env
```

## Environment configuration

Configuration is validated when the application starts. Invalid values fail fast
instead of silently falling back at runtime.

| Variable                         | Required | Default           | Description                                   |
| -------------------------------- | -------- | ----------------- | --------------------------------------------- |
| `NODE_ENV`                       | No       | `development`     | `development`, `test`, or `production`        |
| `HOST`                           | No       | `0.0.0.0`         | Hostname or IP address the server binds       |
| `PORT`                           | No       | `3000`            | Valid TCP port used by the HTTP listener      |
| `LOG_LEVEL`                      | No       | Environment-based | Minimum application log level                 |
| `DATABASE_URL`                   | Yes      | —                 | PostgreSQL runtime connection URL             |
| `DIRECT_URL`                     | No       | —                 | Direct URL for migrations when using a pooler |
| `DATABASE_POOL_MAX`              | No       | `10`              | Connections per application instance          |
| `DATABASE_CONNECTION_TIMEOUT_MS` | No       | `5000`            | Pool/client connection timeout                |
| `JWT_SECRET`                     | Yes      | —                 | Secret used to sign access tokens (32+ chars) |
| `JWT_ACCESS_TOKEN_TTL_SECONDS`   | No       | `900`             | Access-token lifetime in seconds              |

Keep local values in `.env`. Environment files are ignored by Git; only
`.env.example` should be committed, and it must never contain real secrets.

Logs are human-readable in development and structured JSON in production.
Every HTTP response includes `X-Request-Id`; a valid incoming request ID is
preserved to support tracing across services. Authorization, cookie, API key,
and set-cookie values are redacted from logs; query parameters are omitted to
reduce accidental PII or token exposure.

## Database

Start the local PostgreSQL infrastructure after copying `.env.example`:

```bash
$ npm run infra:up

# stop containers without deleting database data
$ npm run infra:down
```

The database is exposed only on host loopback (`127.0.0.1`), persists in a
named Docker volume, and reports readiness through a healthcheck. To remove all
local data intentionally, run `docker compose down -v`.

Prisma uses `DATABASE_URL` at runtime. In production, use a dedicated
least-privilege application user and require TLS (for example,
`?sslmode=require`). If the runtime URL points to PgBouncer or another pooler,
set `DIRECT_URL` to a direct PostgreSQL connection for migrations.

```bash
# after editing prisma/schema.prisma
$ npm run prisma:migrate:dev -- --name describe_change

# deployment/release step; never run migrate dev in production
$ npm run prisma:migrate:deploy
```

`DATABASE_POOL_MAX` applies to each application instance. Keep the total
(`pool max × instance count`) within the database connection budget.

The Compose file is intended for local/development infrastructure. Production
credentials must come from a secret manager or Docker secrets, and production
PostgreSQL also needs an explicit backup/restore and monitoring policy.

## Authentication

The API supports email/password registration and login:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "a sufficiently long password"
}
```

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "a sufficiently long password"
}
```

Both endpoints return a short-lived bearer access token and a safe user object.
Passwords are hashed with Argon2id and are never returned by the API. The local
auth rate limiter is per application instance; use a shared gateway or storage
when enforcing limits across multiple replicas. JWT secrets must come from a
secret manager in production.

All Student, Course, and Enrollment endpoints require the access token:

```http
Authorization: Bearer <access-token>
```

Missing, malformed, invalid, or expired tokens return `401 Unauthorized`.

## Students API

The API exposes a focused CRUD resource for students:

| Method   | Path            | Description                            |
| -------- | --------------- | -------------------------------------- |
| `POST`   | `/students`     | Create a student                       |
| `GET`    | `/students`     | List students using `page` and `limit` |
| `GET`    | `/students/:id` | Get one student                        |
| `PATCH`  | `/students/:id` | Update one or more student fields      |
| `DELETE` | `/students/:id` | Delete a student                       |

`page` defaults to `1`; `limit` defaults to `20` and is capped at `100`.
Student emails are normalized to lowercase and must be unique. Dates of birth
use the `YYYY-MM-DD` format and cannot be in the future.

## Courses and enrollments API

| Method   | Path           | Description                       |
| -------- | -------------- | --------------------------------- |
| `POST`   | `/courses`     | Create a course                   |
| `GET`    | `/courses`     | List courses using page and limit |
| `GET`    | `/courses/:id` | Get one course                    |
| `PATCH`  | `/courses/:id` | Update one or more course fields  |
| `DELETE` | `/courses/:id` | Delete a course                   |

Course codes are normalized to uppercase and must be unique. Deleting a course
also removes its enrollments through the database relation.

| Method   | Path                           | Description                   |
| -------- | ------------------------------ | ----------------------------- |
| `POST`   | `/enrollments`                 | Enroll a student in a course  |
| `GET`    | `/students/:studentId/courses` | List all courses of a student |
| `DELETE` | `/enrollments/:id`             | Remove an enrollment          |

Duplicate enrollments return `409 Conflict`. Unknown students, courses, or
enrollments return `404 Not Found`.

## API documentation

Swagger UI is available at `http://127.0.0.1:3000/docs`, with the OpenAPI JSON
at `http://127.0.0.1:3000/docs/json`. Use **Authorize** in Swagger UI to set the
JWT bearer token for protected endpoints.

### Bruno collection

Start the API, open the `bruno` directory as a collection in Bruno, select the
`local` environment, then run the collection, the `auth` folder, or the
`students` folder, or the `courses-enrollments` folder. Run Authentication first
when executing an individual protected folder. The complete collection handles
that ordering and removes its Student, Course, and Enrollment test records.
Register is safe to run repeatedly; an existing local account returns `409`,
after which login reuses the same credentials and keeps the access token only
for the current Bruno runtime.

With Bruno CLI installed, the auth requests can also be run with:

```bash
$ cd bruno
$ bru run --env local --bail -r
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

Run the same quality gate used by pre-push and CI:

```bash
$ npm run verify
```

## Git hooks

`npm install` runs Husky's prepare script and installs the repository hooks:

- Pre-commit runs ESLint and Prettier only for staged files through lint-staged.
- Pre-push runs `npm run verify` (format check, lint, unit tests, e2e tests,
  build, and Prisma validation).

Hooks provide fast local feedback; GitHub Actions remains the authoritative
quality gate.

## CI/CD and deployment

The GitHub Actions workflow runs for pull requests and pushes to `main`. It uses
`npm ci`, executes `npm run verify`, checks for critical runtime dependency
vulnerabilities, and builds the Docker image. After a successful `main` build,
the image is published to GitHub Container Registry with `latest` and immutable
`sha-<commit>` tags:

```text
ghcr.io/<owner>/<repository>:sha-<commit>
```

The workflow uses the repository `GITHUB_TOKEN`; no additional registry token
is required. For a real repository, protect `main` and require the
**Quality checks** job before merging.

Build and test the production image locally:

```bash
$ docker build -t student-management-system:local .
```

For a basic single-host/VPS deployment, create an ignored `.env.production`
with the production database and JWT values, authenticate Docker to GHCR when
the package is private, then run:

```bash
$ export APP_IMAGE=ghcr.io/<owner>/<repository>:sha-<commit>
$ docker compose -f compose.deploy.yaml up -d
```

The deployment Compose file binds to `127.0.0.1:3000` by default so a reverse
proxy can terminate TLS. Set `APP_BIND_ADDRESS=0.0.0.0` only when direct public
binding is intentional.

Database migrations remain an explicit release step and are never run during
application startup:

```bash
$ npm run prisma:migrate:deploy
```

Run migrations with a direct, least-privilege migration connection before
updating the application container. Automated SSH/platform deployment can be
added later when a concrete hosting target and secret strategy are chosen.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
