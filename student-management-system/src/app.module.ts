import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { appConfig } from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { createPinoHttpOptions } from './logger/logger.options';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, loggerConfig],
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [loggerConfig.KEY],
      useFactory: (config: ConfigType<typeof loggerConfig>) => ({
        pinoHttp: createPinoHttpOptions(config),
      }),
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    CoursesModule,
    EnrollmentsModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
