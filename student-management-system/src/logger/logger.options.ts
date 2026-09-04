import { randomUUID } from 'node:crypto';
import type { ConfigType } from '@nestjs/config';
import type { Options } from 'pino-http';
import type { loggerConfig } from '../config/logger.config';

const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[a-zA-Z0-9._:-]{1,128}$/;

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
] as const;

function getRequestId(requestIdHeader: string | string[] | undefined): string {
  const requestId = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;

  return requestId && VALID_REQUEST_ID.test(requestId)
    ? requestId
    : randomUUID();
}

export function createPinoHttpOptions(
  config: ConfigType<typeof loggerConfig>,
): Options {
  return {
    level: config.level,
    transport: config.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            singleLine: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
    redact: {
      paths: [...REDACTED_PATHS],
      censor: '[REDACTED]',
    },
    serializers: {
      req(request: { url?: string; query?: unknown }) {
        if (request.url) {
          request.url = request.url.split('?', 1)[0];
        }
        delete request.query;
        return request;
      },
    },
    genReqId(request, response) {
      const requestId = getRequestId(request.headers[REQUEST_ID_HEADER]);
      response.setHeader('X-Request-Id', requestId);
      return requestId;
    },
    customLogLevel(_request, response, error) {
      if (error || response.statusCode >= 500) {
        return 'error';
      }
      if (response.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    customSuccessMessage(request, response) {
      return `${request.method ?? 'HTTP'} ${response.statusCode} completed`;
    },
    customErrorMessage(request, response) {
      return `${request.method ?? 'HTTP'} ${response.statusCode} failed`;
    },
  };
}
