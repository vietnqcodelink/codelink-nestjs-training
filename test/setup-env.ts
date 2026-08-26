process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL ??=
  'postgresql://test:test@127.0.0.1:5432/student_management_test';
process.env.JWT_SECRET ??= 'test-only-secret-with-at-least-32-characters';
process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ??= '900';
