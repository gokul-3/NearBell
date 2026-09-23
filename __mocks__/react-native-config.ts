// Jest manual mock: react-native-config reads native build-time env vars
// (via a native module) that don't exist outside a real RN runtime. Tests
// get a fixed, safe-default config instead of the real .env — matches
// .env.example so behavior in tests mirrors a fresh checkout.

export default {
  APP_ENV: 'development',
  MAP_PROVIDER: '',
  MAP_API_KEY_ANDROID: '',
  MAP_API_KEY_IOS: '',
  ANALYTICS_ENABLED: 'false',
  CRASH_REPORTING_ENABLED: 'false',
};
