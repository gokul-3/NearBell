# UI / UX Specification

## Design direction
Calm, modern, travel-oriented. The interface should feel trustworthy rather than flashy.

### Visual system
- Background: system-adaptive neutral.
- Primary accent: one strong brand color.
- Large readable destination name.
- Rounded cards, 12–16 px radius.
- Minimum touch target: 44×44 pt.
- Strong contrast in active alarm state.
- Use system fonts unless branding requires otherwise.
- Respect Dynamic Type / font scaling.

## Navigation
Use a simple stack:
- Home
- Destination Picker
- Trip Setup
- Active Trip
- Alarm
- History
- Settings
- Permission Help

No bottom navigation is required for MVP; Home can expose History and Settings.

## Screen flows

### A. First launch
1. Welcome
2. One-sentence value proposition
3. Continue
4. Explain location permission
5. Request foreground location
6. Explain background location only when the user starts a trip
7. Home

Never show an unexplained OS permission prompt.

### B. Home
Hero:
`Where are you going?`

Primary CTA:
`Set destination`

Secondary:
- Recent destinations (post-MVP)
- Active trip card if one exists
- History
- Settings

### C. Destination Picker
Top search field.
Map occupies most of screen.
Current-location button.
Search results as accessible list.
Destination pin.
Bottom sheet:
- place name
- address
- `Set destination`

If location permission is denied, provide a clear manual map/search path where possible.

### D. Trip Setup
Show destination.
Alert distance segmented options:
`100 m | 250 m | 500 m | 1 km | 2 km`
Custom option.

Optional:
- Alarm sound
- Vibration
- Test alarm

CTA:
`Start trip`

Before starting, show a compact checklist:
- Location access: Ready / Fix
- Notifications: Ready / Fix
- Battery optimization: guidance if needed

### E. Active Trip
Large destination name.
Large distance estimate:
`1.8 km away`
Status:
`Monitoring your trip`

Map with current position and destination.

Secondary info:
- alert at 500 m
- GPS accuracy 18 m
- location status

Actions:
- Pause
- Cancel trip

A persistent status indicator should make it obvious that monitoring is active.

### F. Alarm
Large:
`You're near your destination`
Destination name.
Distance if available.
Buttons:
`Stop alarm`
`I'm not there yet`

If "I'm not there yet":
- Re-arm with a configurable secondary radius.
- Never silently resume without user feedback.

### G. Permission Help
Explain:
- Why location is required.
- Why background location may be required.
- Why notifications are required.
- How to fix denied permissions.
- Android battery optimization guidance.
- iOS background location guidance.

### H. Empty/error states
Every screen needs:
- loading
- empty
- permission denied
- no network
- location unavailable
- stale location
- unsupported device/OS
- unexpected error

## Accessibility
- VoiceOver/TalkBack labels.
- Do not communicate state by color alone.
- Announce alarm state changes.
- Respect reduced motion.
- Minimum contrast WCAG-oriented.
- Large text layouts must not clip.
- Map interactions need accessible alternatives.
