# Security & Privacy

## Privacy principle
The core feature should require as little data as possible.

## MVP data
Store locally:
- selected destination
- active trip
- trip metadata
- settings

Do not upload location to a server.

## Permissions
Explain:
- foreground location: used to identify current position and configure trip
- background location: used so the app can monitor the trip while not visible
- notifications: used to alert the user
- audio/vibration: used for the alarm experience

Do not request contacts, microphone, camera, photos, or unrelated permissions.

## Secrets
- Never commit map/API keys.
- Use environment-specific configuration.
- Rotate exposed keys.
- Restrict provider keys by app/package/bundle identifier where supported.

## Threat model
Consider:
- tampered local storage
- replayed native events
- duplicate callbacks
- malformed location data
- permission revocation
- corrupted persisted state
- malicious deep links
- notification spoofing

## Defensive rules
- Validate all coordinates.
- Validate radius bounds.
- Clamp custom radius to a safe product-defined range.
- Reject NaN/Infinity.
- Treat native events as untrusted input.
- Version persisted state.
- Never execute arbitrary strings as code/config.

## Privacy UI
Include:
- Privacy Policy
- Data collection summary
- Location usage explanation
- Delete history
- Clear all local app data

If analytics is enabled later, provide consent controls where legally/regionally required.

## Store compliance
Before release, verify current Google Play and Apple App Store rules for background location, disclosure, permissions, privacy labels, and review requirements. Do not copy old permission text from this specification.
