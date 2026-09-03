import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponseDto } from '../dto/api-error-response.dto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= 500) {
      this.logger.error({
        event: 'application.error',
        statusCode,
        err:
          exception instanceof Error
            ? exception
            : new Error('Non-Error exception thrown'),
      });
    }

    response.status(statusCode).json({
      statusCode,
      message: this.getMessage(exception),
    } satisfies ApiErrorResponseDto);
  }

  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (!response || typeof response !== 'object' || !('message' in response)) {
      return exception.message;
    }

    const message = response.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string => typeof item === 'string',
      );
      if (messages.length > 0) {
        return messages.join('; ');
      }
    }

    return exception.message;
  }
}
