# Implementation Plan — 046-weatherkit

## Files

### Native (iOS)
- `native/ios/weatherkit/WeatherKitBridge.swift` — Expo module
  wrapping `WeatherService.shared`. Methods: `getCurrent(lat,lng)`,
  `getHourly(lat,lng)`, `getDaily(lat,lng)`, `getAlerts(lat,lng)`,
  `getAttribution()`.
- `native/ios/weatherkit/WeatherKit.podspec`
- `native/ios/weatherkit/expo-module.config.json`

### JS bridge
- `src/native/weatherkit.types.ts` — shared types (records,
  `WeatherKitNotSupported` error, `UnitSystem` enum,
  `WeatherCondition` type, `WeatherKitBridge` interface).
- `src/native/weatherkit.ts` — iOS variant via
  `requireOptionalNativeModule`.
- `src/native/weatherkit.android.ts` — rejects with
  `WeatherKitNotSupported`.
- `src/native/weatherkit.web.ts` — rejects with
  `WeatherKitNotSupported`.

### Module
- `src/modules/weatherkit-lab/index.tsx` — manifest.
- `src/modules/weatherkit-lab/screen.tsx` — iOS screen.
- `src/modules/weatherkit-lab/screen.android.tsx` — IOSOnlyBanner.
- `src/modules/weatherkit-lab/screen.web.tsx` — IOSOnlyBanner.
- `src/modules/weatherkit-lab/preset-cities.ts` — frozen catalog.
- `src/modules/weatherkit-lab/weather-symbols.ts` — condition →
  SF Symbol map.
- `src/modules/weatherkit-lab/hooks/useWeather.ts` — hook with
  `__setWeatherBridgeForTests`.
- `src/modules/weatherkit-lab/components/{LocationPicker,
  CurrentWeatherCard, HourlyForecast, DailyForecast, AlertsList,
  AttributionFooter, UnitPicker, IOSOnlyBanner}.tsx`.

### Plugin
- `plugins/with-weatherkit/index.ts` — adds
  `com.apple.developer.weatherkit` entitlement (boolean true).
- `plugins/with-weatherkit/package.json`.

### Tests (JS-pure)
- `test/unit/native/weatherkit.test.ts` — bridge contract.
- `test/unit/plugins/with-weatherkit/index.test.ts` — idempotency,
  coexistence, app.json shape.
- `test/unit/modules/weatherkit-lab/preset-cities.test.ts`.
- `test/unit/modules/weatherkit-lab/weather-symbols.test.ts`.
- `test/unit/modules/weatherkit-lab/manifest.test.ts`.
- `test/unit/modules/weatherkit-lab/registry.test.ts`.
- `test/unit/modules/weatherkit-lab/screen.test.tsx`.
- `test/unit/modules/weatherkit-lab/screen.android.test.tsx`.
- `test/unit/modules/weatherkit-lab/screen.web.test.tsx`.
- `test/unit/modules/weatherkit-lab/hooks/useWeather.test.tsx`.
- `test/unit/modules/weatherkit-lab/components/*.test.tsx` (×8).

### Wiring
- `src/modules/registry.ts` — append `weatherkitLab`.
- `app.json` — append `./plugins/with-weatherkit` to plugins array
  (count 36 → 37).
- `test/unit/plugins/with-mapkit/index.test.ts` — bump asserted
  plugin count 36 → 37.

## Constraints

- Additive-only.
- No `eslint-disable`.
- `pnpm format` before commit.
- Native bridges mocked at import boundary.
