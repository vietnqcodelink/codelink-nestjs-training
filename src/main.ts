import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { host, port } = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  await app.listen(port, host);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Application failed to start',
    error instanceof Error ? error.stack : undefined,
  );
  process.exitCode = 1;
});
