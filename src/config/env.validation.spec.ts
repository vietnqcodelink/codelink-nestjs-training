import { envValidationSchema } from './env.validation';

const validationOptions = { abortEarly: false, allowUnknown: true };

describe('environment validation', () => {
  it('applies safe defaults and converts the port to a number', () => {
    const result = envValidationSchema.validate(
      { PORT: '8080' },
      validationOptions,
    );

    expect(result.error).toBeUndefined();
    if (result.error) {
      throw result.error;
    }
    expect(result.value).toMatchObject({
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 8080,
    });
  });

  it('reports all invalid known variables at once', () => {
    const { error } = envValidationSchema.validate(
      {
        NODE_ENV: 'staging',
        HOST: 'bad host',
        PORT: 'not-a-port',
        LOG_LEVEL: 'everything',
      },
      validationOptions,
    );

    expect(error?.details).toHaveLength(4);
  });
});
