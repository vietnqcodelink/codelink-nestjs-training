import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { createValidationPipe } from '../src/common/validation';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Route protection (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  const course = {
    id: '16a64c89-2ae6-460a-bf93-ff2121c59927',
    name: 'Computer Science',
    code: 'CS-101',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let grantedPermissionCount = 0;
  const prisma = {
    permission: {
      count: jest.fn(() => Promise.resolve(grantedPermissionCount)),
    },
    course: {
      create: jest.fn().mockResolvedValue(course),
      findMany: jest.fn().mockResolvedValue([course]),
      count: jest.fn().mockResolvedValue(1),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    grantedPermissionCount = 0;
    jest.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
    jwtService = app.get(JwtService);
  });

  it.each([
    ['POST', '/courses'],
    ['PATCH', '/courses/16a64c89-2ae6-460a-bf93-ff2121c59927'],
    ['DELETE', '/courses/16a64c89-2ae6-460a-bf93-ff2121c59927'],
    ['POST', '/students'],
    ['GET', '/students'],
    ['GET', '/students/16a64c89-2ae6-460a-bf93-ff2121c59927'],
    ['PATCH', '/students/16a64c89-2ae6-460a-bf93-ff2121c59927'],
    ['DELETE', '/students/16a64c89-2ae6-460a-bf93-ff2121c59927'],
    ['POST', '/enrollments'],
    ['GET', '/students/16a64c89-2ae6-460a-bf93-ff2121c59927/courses'],
    ['DELETE', '/enrollments/16a64c89-2ae6-460a-bf93-ff2121c59927'],
  ])(
    'returns 403 for %s %s without the required permission',
    async (method, path) => {
      const token = await jwtService.signAsync({
        sub: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
      });

      await request(app.getHttpServer())
        [method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete'](path)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    },
  );

  it('allows a user with course:create permission to create a course', async () => {
    grantedPermissionCount = 1;
    const token = await jwtService.signAsync({
      sub: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    });

    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: course.name, code: course.code })
      .expect(201)
      .expect(({ body }: { body: { id?: string } }) => {
        expect(body.id).toBe(course.id);
      });
  });

  it('rejects a request immediately after permission is revoked', async () => {
    grantedPermissionCount = 0;
    const token = await jwtService.signAsync({
      sub: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    });

    await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: course.name, code: course.code })
      .expect(403);
  });

  it('allows a USER to read courses', async () => {
    const token = await jwtService.signAsync({
      sub: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    });

    await request(app.getHttpServer())
      .get('/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it.each([
    '/students?sortBy=passwordHash',
    '/students?courseId=not-a-uuid',
    '/courses?sortOrder=sideways',
  ])('rejects invalid list query parameters for %s', async (path) => {
    grantedPermissionCount = 1;
    const token = await jwtService.signAsync({
      sub: '4d26ed6a-1f21-4df2-98cf-b79b7e214d0f',
    });

    await request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it.each([
    ['GET', '/students'],
    ['POST', '/students'],
    ['GET', '/courses'],
    ['POST', '/courses'],
    ['POST', '/enrollments'],
    ['GET', '/students/4d26ed6a-1f21-4df2-98cf-b79b7e214d0f/courses'],
  ])('returns 401 for %s %s without a token', async (method, path) => {
    await request(app.getHttpServer())
      [method.toLowerCase() as 'get' | 'post'](path)
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
