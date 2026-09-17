module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          '@app': './src/app',
          '@domain': './src/domain',
          '@application': './src/application',
          '@infrastructure': './src/infrastructure',
          '@presentation': './src/presentation',
          '@state': './src/state',
          '@utils': './src/utils',
          '@types': './src/types',
        },
      },
    ],
  ],
};
