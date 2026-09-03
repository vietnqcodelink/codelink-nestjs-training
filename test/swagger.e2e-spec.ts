import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/common/swagger';
import { PrismaService } from '../src/prisma/prisma.service';

describe('OpenAPI document (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  it('documents every public API path and bearer authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs/json')
      .expect(200);
    const document = response.body as {
      paths: Record<string, unknown>;
      components?: { securitySchemes?: Record<string, unknown> };
    };

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/',
        '/auth/register',
        '/auth/login',
        '/students',
        '/students/{id}',
        '/courses',
        '/courses/{id}',
        '/enrollments',
        '/enrollments/{id}',
        '/students/{studentId}/courses',
        '/rbac/roles',
        '/rbac/roles/{id}',
        '/rbac/permissions',
        '/rbac/roles/{id}/permissions',
        '/rbac/users/{userId}/roles',
      ]),
    );
    expect(document.components?.securitySchemes).toHaveProperty('access-token');
  });

  afterEach(async () => {
    await app.close();
  });
});
