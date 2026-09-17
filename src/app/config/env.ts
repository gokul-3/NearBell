import Config from 'react-native-config';

export type AppEnv = 'development' | 'staging' | 'production';

function parseBoolean(value: string | undefined): boolean {
  return value === 'true';
}

function parseAppEnv(value: string | undefined): AppEnv {
  if (value === 'staging' || value === 'production') {
    return value;
  }
  return 'development';
}

export type EnvConfig = {
  appEnv: AppEnv;
  mapProvider: string | undefined;
  mapApiKeyAndroid: string | undefined;
  mapApiKeyIos: string | undefined;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
};

export const env: EnvConfig = {
  appEnv: parseAppEnv(Config.APP_ENV),
  mapProvider: Config.MAP_PROVIDER,
  mapApiKeyAndroid: Config.MAP_API_KEY_ANDROID,
  mapApiKeyIos: Config.MAP_API_KEY_IOS,
  analyticsEnabled: parseBoolean(Config.ANALYTICS_ENABLED),
  crashReportingEnabled: parseBoolean(Config.CRASH_REPORTING_ENABLED),
};
