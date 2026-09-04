import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  setupSwagger,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
} from '../src/common/swagger';
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

  it('serves Swagger UI at the documented endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${SWAGGER_PATH}`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('swagger-ui');
  });

  it('documents every API operation and bearer authentication', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${SWAGGER_JSON_PATH}`)
      .expect(200);
    const document = response.body as {
      paths: Record<
        string,
        Record<
          string,
          { summary?: string; responses?: Record<string, unknown> }
        >
      >;
      components?: {
        schemas?: Record<string, unknown>;
        securitySchemes?: Record<string, unknown>;
      };
    };

    const expectedOperations: Record<string, string[]> = {
      '/': ['get'],
      '/auth/register': ['post'],
      '/auth/login': ['post'],
      '/students': ['get', 'post'],
      '/students/{id}': ['get', 'patch', 'delete'],
      '/courses': ['get', 'post'],
      '/courses/{id}': ['get', 'patch', 'delete'],
      '/enrollments': ['post'],
      '/enrollments/{id}': ['delete'],
      '/students/{studentId}/courses': ['get'],
      '/rbac/roles': ['get', 'post'],
      '/rbac/roles/{id}': ['patch', 'delete'],
      '/rbac/permissions': ['get'],
      '/rbac/roles/{id}/permissions': ['put'],
      '/rbac/users/{userId}/roles': ['get', 'put'],
    };

    for (const [path, methods] of Object.entries(expectedOperations)) {
      expect(document.paths).toHaveProperty(path);
      for (const method of methods) {
        const operation = document.paths[path]?.[method];
        expect(operation?.summary).toEqual(expect.any(String));
        expect(operation?.responses).toBeDefined();
        expect(
          Object.keys(operation?.responses ?? {}).some((status) =>
            status.startsWith('2'),
          ),
        ).toBe(true);
      }
    }

    expect(document.components?.schemas).toEqual(
      expect.objectContaining({
        ApiErrorResponseDto: expect.any(Object),
        AuthResponseDto: expect.any(Object),
        CreateCourseDto: expect.any(Object),
        CreateEnrollmentDto: expect.any(Object),
        CreateRoleDto: expect.any(Object),
        CreateStudentDto: expect.any(Object),
        CourseResponseDto: expect.any(Object),
        PaginatedCoursesResponseDto: expect.any(Object),
        PaginatedStudentsResponseDto: expect.any(Object),
        StudentResponseDto: expect.any(Object),
      }),
    );
    expect(document.components?.securitySchemes).toHaveProperty('access-token');
  });

  afterEach(async () => {
    await app.close();
  });
});
