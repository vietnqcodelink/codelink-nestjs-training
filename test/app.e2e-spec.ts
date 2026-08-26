import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

  afterEach(async () => {
    await app.close();
  });
});
