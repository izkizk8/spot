---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (WeatherKit requires native iOS build)
  - iPhone running iOS 16+
  - Paid Apple Developer account (WeatherKit entitlement + WeatherKit capability enabled)
---

# How to verify WeatherKit on iPhone

## Goal
Confirm WeatherKit returns a complete `Weather` object for a requested location,
the current conditions, hourly/daily forecasts, and minute-by-minute precipitation
(where available) all render correctly.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- Paid Apple Developer account (WeatherKit service enabled in the Developer Portal
  and `com.apple.developer.weatherkit` entitlement in the build)
- `with-weatherkit` plugin registered in `app.json`

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
4. In the app, navigate to **"WeatherKit"** in the Modules tab.
5. Grant location permission when prompted (the module uses device location by default).
6. Confirm the Current Conditions card populates: temperature, condition description,
   UV index, wind speed.
7. Confirm the Hourly Forecast section shows at least 12 future hourly entries.
8. Confirm the Daily Forecast section shows 5–10 days.
9. Tap **Custom Location** → enter a different city → **Fetch** → confirm data updates.
10. Observe the Apple WeatherKit attribution logo is rendered (required by Apple TOS).

## Verify
- Current conditions card populates with temperature and condition string
- Hourly and daily forecasts render non-empty rows
- Custom location fetch returns data for the entered city
- Attribution logo is visible (WeatherKit TOS compliance)
- On iOS < 16: in-app banner "WeatherKit requires iOS 16+"
- On Android: alternative weather API path (if configured) tested

## Troubleshooting
- **"WeatherKit service not enabled"** error → enable WeatherKit in the Developer
  Portal under Certificates, Identifiers & Profiles → Identifiers → your App ID →
  Additional Capabilities → WeatherKit
- **nil weather object returned** → check Xcode console; also ensure the device
  is connected to the internet and location permission is granted
- **Attribution logo missing** → add the Apple WeatherKit attribution as required
  by the WeatherKit terms of service; this must be visible whenever weather data is shown

## Implementation references
- Spec: `specs/046-weatherkit/spec.md`
- Plan: `specs/046-weatherkit/plan.md`
- Module: `src/modules/weatherkit-lab/`
- Native bridge: `src/native/weatherkit.ts`
- Plugin: `plugins/with-weatherkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows