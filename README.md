# NearBell

A location-triggered destination alarm app for travelers (bus, train, cab, car). You set a
destination and an alert radius, start a trip, and NearBell alerts you when you're approaching or
have reached it.

The full product and engineering specification lives in
[`location-alarm-claude-spec/`](location-alarm-claude-spec/) and is being implemented incrementally
following the phased workflow in
[`location-alarm-claude-spec/10-claude-code-workflow.md`](location-alarm-claude-spec/10-claude-code-workflow.md).

## Status

- **Phase 0 — inspect**: done.
- **Phase 1 — scaffold**: done (React Native 0.87.1 + TypeScript strict, ESLint/Prettier, path
  aliases, navigation shell, theme, error boundary, env config).
- Remaining phases (domain, persistence, UI, map, native location/geofencing, alarm, hardening,
  testing, final audit) are in progress.

iOS native code is written to spec but **not build-verified** in this environment (no macOS/Xcode
available). Android is build- and run-verified on an emulator during development.

## Requirements

- Node.js >= 22.11
- JDK 17
- Android SDK (platform 35, build-tools 35.0.0) with `ANDROID_HOME` set
- For iOS: macOS + Xcode + CocoaPods (not available in this repo's primary dev environment)

## Getting started

```sh
npm install
cp .env.example .env   # fill in map provider keys when available
npm run android        # requires an emulator/device
npm run ios             # requires macOS
```

## Scripts

- `npm run android` / `npm run ios` — run the app
- `npm start` — start the Metro bundler
- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript typecheck
- `npm test` — Jest unit tests
