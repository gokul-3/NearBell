import { env } from '@app/config/env';
import { logger } from '@infrastructure/logging/Logger';

describe('logger', () => {
  const originalAppEnv = env.appEnv;

  afterEach(() => {
    env.appEnv = originalAppEnv;
    jest.restoreAllMocks();
  });

  it('redacts keys that look like coordinates, addresses, or secrets', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    env.appEnv = 'development';

    logger.warn('test', { latitude: 12.34, longitude: 56.78, apiKey: 'secret-key', safe: 'ok' });

    expect(spy).toHaveBeenCalledWith(
      '[NearBell] test',
      expect.objectContaining({ latitude: '[redacted]', longitude: '[redacted]', apiKey: '[redacted]', safe: 'ok' }),
    );
  });

  it('suppresses debug/info logs in production', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    env.appEnv = 'production';

    logger.debug('should not appear');
    logger.info('should not appear either');

    expect(spy).not.toHaveBeenCalled();
  });

  it('still surfaces warn/error in production', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    env.appEnv = 'production';

    logger.warn('warn in prod');
    logger.error('error in prod');

    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
