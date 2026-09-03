import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_BEARER_AUTH = 'access-token';
export const SWAGGER_PATH = 'api/docs';
export const SWAGGER_JSON_PATH = `${SWAGGER_PATH}/json`;

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Student Management API')
    .setDescription('API for managing students, courses, and enrollments')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      SWAGGER_BEARER_AUTH,
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, documentFactory, {
    customSiteTitle: 'Student Management API Docs',
    jsonDocumentUrl: SWAGGER_JSON_PATH,
  });
}
