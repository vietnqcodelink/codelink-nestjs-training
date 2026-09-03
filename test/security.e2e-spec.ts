import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { createValidationPipe } from '../src/common/validation';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Route protection (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
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
