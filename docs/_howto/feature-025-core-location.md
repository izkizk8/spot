---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; expo-location works in simulator)
  - iPhone running iOS 13+ (physical device for real GPS accuracy)
  - Apple Developer account (free tier sufficient)
---

# How to verify Core Location on iPhone

## Goal
Confirm CLLocationManager delivers continuous location updates, the accuracy tier
selector works, region monitoring triggers entry/exit events, and permissions
(when-in-use and always) are handled correctly.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-location` installed (`npx expo install expo-location`)
- `with-core-location` plugin registered in `app.json` (adds UIBackgroundModes:
  location, NSLocationWhenInUseUsageDescription, NSLocationAlwaysUsageDescription)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Core Location"** in the Modules tab.
5. Tap **Request When-In-Use** — grant location permission.
6. Confirm the Location Card shows latitude, longitude, and accuracy updating at
   the configured frequency.
7. Switch accuracy tier from **Best** to **HundredMeters** — confirm accuracy value
   changes accordingly.
8. Tap **Request Always** — iOS presents an upgrade prompt.
9. Open the **Region Monitor** card, tap **Add Region** centered at current location
   with 100 m radius → walk away and back to trigger entry/exit events.
10. Tap **Stop** — updates cease; last fix remains displayed.

## Verify
- Location updates appear with correct lat/lon/accuracy after permission granted
- Accuracy tier switch changes the `desiredAccuracy` level
- Region monitoring triggers entry and exit callbacks
- Denied permission shows inline notice with Open Settings affordance
- On Android: `expo-location` equivalent works with ACCESS_FINE_LOCATION
- On web: browser Geolocation API used; one-shot fixes only (no streaming)

## Troubleshooting
- **Location never updates** → confirm permission granted in
  Settings → Privacy → Location Services → Spot
- **Always permission not upgradeable** → iOS 13+ requires the app to request
  Always from within a when-in-use session; verify the bridge uses the correct
  `requestAlwaysAuthorization` call path
- **Region monitoring not firing** → requires real device with GPS; simulator
  region monitoring is unreliable

## Implementation references
- Spec: `specs/025-core-location/spec.md`
- Plan: `specs/025-core-location/plan.md`
- Module: `src/modules/core-location-lab/`
- Native bridge: `src/native/core-location.ts`
- Plugin: `plugins/with-core-location/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows