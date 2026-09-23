import { env } from '@app/config/env';
import { track } from '@infrastructure/analytics/Analytics';

describe('track', () => {
  const originalEnabled = env.analyticsEnabled;
  const originalAppEnv = env.appEnv;

  afterEach(() => {
    env.analyticsEnabled = originalEnabled;
    env.appEnv = originalAppEnv;
    jest.restoreAllMocks();
  });

  it('does nothing when analytics is disabled', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    env.analyticsEnabled = false;

    track({ name: 'app_opened' });

    expect(spy).not.toHaveBeenCalled();
  });

  it('logs the event when analytics is enabled', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    env.analyticsEnabled = true;
    env.appEnv = 'development';

    track({ name: 'trip_started', properties: { radiusMeters: 500 } });

    expect(spy).toHaveBeenCalledWith(
      '[NearBell] analytics: trip_started',
      expect.objectContaining({ radiusMeters: 500 }),
    );
  });
});
