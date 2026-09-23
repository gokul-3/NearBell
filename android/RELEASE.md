# Android release build

## Signing

`app/build.gradle`'s `release` signing config reads a real keystore from
environment variables so no keystore or password is ever committed to this
repo (see `08-security-privacy.md`: never commit secrets). Until these are
set, `assembleRelease`/`bundleRelease` fall back to the debug keystore so
local release-config testing (minification, etc.) still works — that output
is **not** suitable for distribution.

To produce a real signed build:

1. Generate a keystore once, and store it somewhere outside this repo:
   ```sh
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore nearbell-release.keystore \
     -alias nearbell-release -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Set these before building (CI secrets store, or local shell env — never
   in a committed file):
   - `NEARBELL_RELEASE_STORE_FILE` — absolute path to the keystore
   - `NEARBELL_RELEASE_STORE_PASSWORD`
   - `NEARBELL_RELEASE_KEY_ALIAS`
   - `NEARBELL_RELEASE_KEY_PASSWORD`
3. Build: `./gradlew bundleRelease` (Play Store) or `./gradlew assembleRelease` (APK).

## Dev support (`useDevSupport`)

`MainApplication.kt`'s `getDefaultReactHost()` call passes
`useDevSupport = BuildConfig.DEBUG` explicitly. Without this, it defaults to
RN's own internal `ReactBuildConfig.DEBUG`, which was found — via an
on-device `assembleRelease` smoke test — to evaluate `true` even in this
app's release build type, making a release build try to load JS from the
Metro dev server (`10.0.2.2:8081`) instead of the bundled
`assets/index.android.bundle`. Also keep `com.nearbell.app.BuildConfig`
itself (`proguard-rules.pro`) — RN's `ReactConfig` locates it reflectively
by fully-qualified name, and R8 strips it as apparently-unused otherwise.

## Minification

`enableProguardInReleaseBuilds` is **`false`**. It was tried and reverted:
enabling it made R8 strip `react-native-screens`' Fabric ViewManager
registration for `RNSScreenContentWrapper` (found reflectively by name, not
referenced in code), crashing every screen with "Can't find ViewManager
'RNSScreenContentWrapper'" — confirmed on-device. `react-native-mmkv`,
`@maplibre/maplibre-react-native`, `react-native-config`, and
`play-services-location` ship their own consumer ProGuard/R8 rules and
weren't observed to have this problem in the one smoke test run, but
`react-native-screens` either doesn't publish a sufficient consumer rule for
this component or something about this project's setup defeats it. Turning
minification back on requires finding the correct keep rule (or an
upstream fix) and then a full on-device smoke test again, not just a
successful compile — a build succeeding is not evidence a release build
works.

## Before shipping

Run the full checklist in `location-alarm-claude-spec/09-release-checklist.md`
(Phase 10's job, not this doc) — this file only covers how to produce the
build artifact itself.
