import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './config/app.config';
import { envValidationSchema } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { createPinoHttpOptions } from './logger/logger.options';
import { PrismaModule } from './prisma/prisma.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
