import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import { Logger as PinoLogger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { createValidationPipe } from './common/validation';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(createValidationPipe());
  app.enableShutdownHooks();

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
