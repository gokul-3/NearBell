# Location Alarm — Claude Code Build Specification

This directory is the implementation specification for a production-ready mobile app whose core job is:

> A user selects a destination, starts a trip, and the app alerts them when they are approaching/reaching that destination.

## Product goals
- Extremely simple setup: destination → alert distance → start.
- Reliable background behavior on Android and iOS.
- Battery-conscious location handling.
- Clear permission education and failure recovery.
- Works without a backend for the core alarm flow.
- Production-quality accessibility, error states, testing, analytics hooks, privacy, and release readiness.

## Recommended build order
1. Read `01-product-requirements.md`
2. Read `02-architecture.md`
3. Read `03-ui-ux.md`
4. Read `04-location-engine.md`
5. Read `05-data-model.md`
6. Read `06-technical-implementation.md`
7. Read `07-testing.md`
8. Read `08-security-privacy.md`
9. Read `09-release-checklist.md`
10. Read `10-claude-code-workflow.md`

## Non-negotiable product rule
Never promise that an alarm will fire at an exact physical point. GPS accuracy, OS scheduling, connectivity, and device power management introduce uncertainty. The UI should communicate an alert radius and status.

## Initial scope
Android + iOS. No account required. No server required for MVP. Local data only.

## Suggested product name
Use a temporary working name such as `NearStop`. Keep naming configurable so branding can change later.
