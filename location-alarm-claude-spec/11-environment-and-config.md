# Environment & Configuration

## Environments
Use:
- development
- staging
- production

## Configuration categories
```text
APP_ENV
MAP_PROVIDER
MAP_API_KEY_ANDROID
MAP_API_KEY_IOS
ANALYTICS_ENABLED
CRASH_REPORTING_ENABLED
```

Do not place secrets in `.env` files that are committed.

## Git
Commit:
- source
- lockfile
- configuration templates
- tests
- documentation

Ignore:
- `.env`
- signing keys
- keystores
- provisioning secrets
- service account keys
- local build artifacts

## CI
CI should run:
1. install dependencies
2. typecheck
3. lint
4. unit tests
5. build Android
6. build iOS on macOS runner
7. E2E on scheduled/device runners if configured

## Branching
Simple trunk-based workflow:
- feature branches
- PR
- CI
- review
- merge

## Versioning
Use semantic versioning for app releases where practical:
`MAJOR.MINOR.PATCH`

Keep Android versionCode and iOS build numbers monotonically increasing.
