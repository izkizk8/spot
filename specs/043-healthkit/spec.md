# Feature Specification: HealthKit Showcase Module

**Feature Branch**: `043-healthkit`
**Feature Number**: 043
**Created**: 2026-05-01
**Status**: Approved (autonomous, no clarifications needed)
**Parent Branch**: `042-app-clips`

## Summary

iOS 9+ educational module that demonstrates **Apple HealthKit** —
querying daily step counts, heart-rate readings, sleep stages, and
workouts from HealthKit; writing samples (manual heart-rate / weight);
and observing live updates via `HKObserverQuery`. Adds a "HealthKit"
card to the 006 iOS Showcase registry (`id: 'healthkit-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '9.0'`).

The module wraps the `react-native-health` community package because
no first-party `expo-health` exists. The package ships its own Expo
config plugin which we wrap in `plugins/with-healthkit/` to inject the
two required Info.plist usage descriptions
(`NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription`)
and the `com.apple.developer.healthkit` entitlement. The wrapper
plugin is **idempotent**, **coexists** with all prior plugins, and
restricts itself to a single, well-documented set of keys.

## User Scenarios

- **US1** — Open the lab screen on iOS. The Authorization card shows
  the current per-type status (undetermined / authorized / denied) and
  a "Request access" button.
- **US2** — Press "Request access" → HealthKit permission sheet
  appears, status updates to "authorized" (or "denied") on each type.
- **US3** — Step Count card renders a 7-day daily-step bar chart
  reusing the 011 sensors-playground BarChart pattern.
- **US4** — Heart Rate card shows the most-recent reading and a 24h
  sparkline. "Add manual reading" button writes a synthetic sample.
- **US5** — Sleep card renders last night's sleep stages (in-bed,
  asleep, awake fractions).
- **US6** — Workout card lists the last 10 workouts with type,
  duration, and active calories.
- **US7** — Live updates demo: toggle the `HKObserverQuery`
  subscription. While on, the card increments a "received updates"
  counter every time HealthKit notifies of new step data.
- **US8** — On Android / web, an IOSOnlyBanner explains HealthKit is
  Apple-only.

## Functional Requirements

- FR-1 The module manifest MUST declare `id: 'healthkit-lab'`,
  `platforms: ['ios','android','web']`, `minIOS: '9.0'`.
- FR-2 The iOS screen MUST compose the seven cards in source order:
  Authorization, StepCount, HeartRate, Sleep, Workout, LiveUpdates,
  plus an IOSOnlyBanner only on non-iOS variants.
- FR-3 The hook `useHealthKit` MUST encapsulate all
  `react-native-health` interactions and expose a stable, typed API
  (status, queries, writes, observer subscribe / unsubscribe).
- FR-4 The hook MUST tear down its observer subscription on unmount.
- FR-5 The hook MUST treat all `react-native-health` errors as
  recoverable (set `lastError`, never throw).
- FR-6 `sample-types.ts` MUST expose the canonical permission sets
  read/write the module requests, and pure helpers used by tests.
- FR-7 The `with-healthkit` plugin MUST add the two HealthKit usage
  description strings to Info.plist (overwriting only if our keys
  were absent or non-string), and MUST add the
  `com.apple.developer.healthkit` boolean entitlement (true) without
  touching unrelated keys.
- FR-8 The plugin MUST be idempotent (re-running yields a byte-stable
  result) and MUST not delete or mutate any other Info.plist /
  entitlement keys.
- FR-9 All native bridges MUST be mocked at the import boundary in
  unit tests (no real `react-native-health` invocations).
- FR-10 The full pnpm check pipeline (format / lint / typecheck /
  jest) MUST be green; no `eslint-disable` directives may be added.

## Constraints

- Constitution v1.1.0
- Additive only (no deletions to existing modules / plugins / tests)
- No new lint exceptions
- Mock all native bridges at import boundary
- `react-native-health` callback-style API wrapped into promises in
  the hook for ergonomic React state management
