# Feature Specification: WeatherKit Showcase Module

**Feature Branch**: `046-weatherkit`
**Feature Number**: 046
**Created**: 2026-05-09
**Status**: Approved (autonomous, no clarifications)
**Parent Branch**: `045-carplay`

## Summary

iOS 16+ educational module that demonstrates **Apple WeatherKit** —
fetching current weather, hourly forecast, daily forecast, and
weather alerts via `WeatherService.shared`. Adds a "WeatherKit" card
to the 006 iOS Showcase registry (`id: 'weatherkit-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '16.0'`).

WeatherKit requires the Apple-issued
`com.apple.developer.weatherkit` entitlement (active Apple Developer
account, 500K calls/month free tier). The module ships its own thin
Swift bridge (`native/ios/weatherkit/WeatherKitBridge.swift`)
wrapping `WeatherService` plus a JS bridge (`src/native/weatherkit.ts`)
with platform-specific siblings that throw `WeatherKitNotSupported`
on Android and Web. The bridge is mocked at the import boundary in
unit tests.

The accompanying Expo config plugin `plugins/with-weatherkit/`
injects the single entitlement key required by WeatherKit
(`com.apple.developer.weatherkit`). The plugin is **idempotent**,
**coexists** byte-cleanly with every prior plugin, and never deletes
or mutates unrelated keys.

## Sections / UX

1. **Location picker** — pick from preset cities (San Francisco /
   Tokyo / London / Sydney / Paris) or use current location (uses 025
   `expo-location`).
2. **Current weather card** — temperature, condition, SF Symbol icon,
   humidity, wind speed.
3. **Hourly forecast** — next 24h horizontal scroll with temp/icon.
4. **Daily forecast** — next 10 days list view with hi/lo and icon.
5. **Weather alerts** — list active alerts; tap for details.
6. **Attribution footer** — "Weather data provided by Apple Weather"
   (required by Apple) with link to legal attribution page.
7. **Unit picker** — Metric / Imperial / Scientific.

## Decisions

- **No web fallback (e.g., OpenWeatherMap).** Scope-tight: Android
  and Web throw `WeatherKitNotSupported` and render the
  `IOSOnlyBanner`.
- **Preset cities** are a frozen catalog (5 entries, lat/lng baked
  in); no live geocoding.
- **Condition → SF Symbol mapping** is a frozen lookup table covering
  all WeatherKit `WeatherCondition` cases; unknown codes fall back
  to `cloud.fill`.
- **Tests** are JS-pure; the native bridge is mocked at the import
  boundary via `__setWeatherBridgeForTests`.
