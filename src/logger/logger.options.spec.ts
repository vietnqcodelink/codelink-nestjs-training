import { createPinoHttpOptions } from './logger.options';

describe('logger options', () => {
  const options = createPinoHttpOptions({ level: 'info', pretty: false });

  it.each([
    [200, undefined, 'info'],
    [404, undefined, 'warn'],
    [500, undefined, 'error'],
    [200, new Error('request failed'), 'error'],
  ] as const)(
    'maps HTTP status %s to %s',
    (statusCode, error, expectedLevel) => {
      const level = options.customLogLevel?.(
        {} as never,
        { statusCode } as never,
        error,
      );

      expect(level).toBe(expectedLevel);
    },
  );

  it('uses structured JSON without a pretty transport in production', () => {
    expect(options.transport).toBeUndefined();
  });

  it('does not log query strings or parsed query parameters', () => {
    const serializeRequest = options.serializers?.req;
    const result: unknown = serializeRequest?.({
      url: '/students?token=secret',
      query: { token: 'secret' },
    });

    expect(result).toEqual({ url: '/students' });
  });
});
