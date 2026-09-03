import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createValidationPipe } from './../src/common/validation';
import { PrismaService } from './../src/prisma/prisma.service';
import { SYSTEM_ROLE } from './../src/rbac/rbac.constants';

describe('AppController (e2e)', () => {
  interface AuthResponseBody {
    accessToken: string;
    tokenType: string;
    user: {
      id: string;
      email: string;
      roles: string[];
      passwordHash?: string;
    };
  }

  let app: INestApplication<App>;
  const users = new Map<
    string,
    {
      id: string;
      email: string;
      passwordHash: string;
      roles: { role: { name: string } }[];
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  const prisma = {
    user: {
      create: jest.fn(
        ({ data }: { data: { email: string; passwordHash: string } }) => {
          const user = {
            id: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
            email: data.email,
            passwordHash: data.passwordHash,
            roles: [{ role: { name: SYSTEM_ROLE.USER } }],
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          };
          users.set(user.email, user);

          return {
            id: user.id,
            email: user.email,
            roles: user.roles,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        },
      ),
      findUnique: jest.fn(
        ({ where }: { where: { email: string } }) =>
          users.get(where.email) ?? null,
      ),
    },
  };

  beforeEach(async () => {
    users.clear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'test-request-id')
      .expect(200)
      .expect('X-Request-Id', 'test-request-id')
      .expect('Hello World!');
  });

  it('replaces an unsafe request ID', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'unsafe request id')
      .expect(
        'X-Request-Id',
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
  });

  it('registers and logs in without exposing the password hash', async () => {
    const credentials = {
      email: '  USER@Example.com ',
      password: 'a sufficiently long password',
    };
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect('Cache-Control', 'no-store')
      .expect(201);
    const registrationBody = registration.body as AuthResponseBody;

    expect(typeof registrationBody.accessToken).toBe('string');
    expect(registrationBody).toMatchObject({
      tokenType: 'Bearer',
      user: {
        id: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
        email: 'user@example.com',
        roles: [SYSTEM_ROLE.USER],
      },
    });
    expect(registrationBody.user).not.toHaveProperty('passwordHash');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, email: 'USER@example.com' })
      .expect('Cache-Control', 'no-store')
      .expect(200);
    const loginBody = login.body as AuthResponseBody;

    expect(typeof loginBody.accessToken).toBe('string');
    expect(loginBody).toMatchObject({
      tokenType: 'Bearer',
      user: { email: 'user@example.com' },
    });
    expect(loginBody.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid and unexpected registration fields', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        role: 'admin',
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
