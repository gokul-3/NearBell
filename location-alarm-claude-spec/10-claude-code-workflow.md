# Claude Code Implementation Workflow

## Role
Claude Code should act as a senior mobile engineer and implement the product incrementally. Do not generate a giant untested codebase in one pass.

## Phase 0 — inspect
Before changing code:
1. Inspect repository.
2. Detect existing package manager and RN version.
3. Detect whether Android/iOS projects exist.
4. Identify New Architecture status.
5. Check installed dependencies.
6. Identify existing lint/test/format commands.
7. Produce a short implementation plan.
8. Do not overwrite existing project files without understanding them.

## Phase 1 — scaffold
Implement:
- project configuration
- TypeScript strictness
- ESLint
- Prettier
- path aliases
- environment configuration
- error boundary
- theme
- navigation
- base screen/component primitives

Acceptance:
- app builds on Android and iOS
- lint passes
- typecheck passes
- tests run

## Phase 2 — domain
Implement pure domain modules:
- entities
- state machine
- distance calculations
- arrival evaluator
- errors

Write tests first where practical.

Acceptance:
- domain tests pass
- no React Native imports in domain

## Phase 3 — persistence/state
Implement:
- trip store
- settings store
- schema versioning
- migrations
- recovery

Acceptance:
- active trip survives app restart simulation
- corrupted data falls back safely

## Phase 4 — UI
Build:
- Welcome
- Home
- Destination Picker
- Trip Setup
- Active Trip
- Alarm
- History
- Settings
- Permission Help

Use realistic loading/error/empty states.

Acceptance:
- all flows navigable
- accessibility labels exist
- no placeholder buttons

## Phase 5 — map
Implement map provider abstraction and one production provider.
Implement:
- search
- map selection
- current location
- destination pin

Acceptance:
- API keys supplied through environment
- map failure has fallback UI

## Phase 6 — native location
Implement Android and iOS adapters separately.
Do not fake background location with JS timers.

Implement:
- permission state
- geofence registration
- native callbacks
- active trip reconciliation
- monitoring start/stop
- lifecycle recovery

Acceptance:
- physical-device tests pass

## Phase 7 — alarm
Implement local notification + sound + vibration.
Test:
- foreground
- background
- locked screen where supported
- duplicate events
- stop action
- test alarm

Acceptance:
- alarm cannot get stuck
- duplicate events are suppressed

## Phase 8 — hardening
Add:
- structured logging
- analytics abstraction
- crash reporting hook
- performance checks
- privacy checks
- error taxonomy
- release configuration

## Phase 9 — testing
Run:
```text
typecheck
lint
unit tests
integration tests
android release build
ios build/archive
e2e tests
```

Fix failures before moving forward.

## Phase 10 — final audit
Claude must review the repository against every checklist in:
- 01-product-requirements.md
- 04-location-engine.md
- 07-testing.md
- 09-release-checklist.md

Output:
1. Implemented features
2. Known limitations
3. Platform-specific limitations
4. Required secrets/configuration
5. Tests run and results
6. Manual device tests still required

## Coding rules
- TypeScript strict.
- No `any` unless justified.
- No dead code.
- No TODO placeholders for core functionality.
- Small focused modules.
- Explicit interfaces at infrastructure boundaries.
- Pure functions for domain logic.
- Comments explain why, not what.
- No secrets in source.
- No raw coordinates in analytics.
- Handle every permission/error state.
- Do not claim background reliability that has not been tested on physical devices.

## Important implementation judgment
If a library's current API conflicts with this specification, adapt the specification to the library/platform rather than forcing an obsolete API. Check current official platform documentation and current library documentation before implementation.
