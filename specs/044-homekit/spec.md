# Feature Specification: HomeKit Showcase Module

**Feature Branch**: `044-homekit`
**Feature Number**: 044
**Created**: 2026-05-08
**Status**: Approved (autonomous, no clarifications needed)
**Parent Branch**: `043-healthkit`

## Summary

iOS 8+ educational module that demonstrates **Apple HomeKit** —
listing homes / rooms / accessories / characteristics; reading and
writing characteristic values (toggle / percent / enum); and observing
live characteristic update events via `HMHome` notifications. Adds a
"HomeKit" card to the 006 iOS Showcase registry (`id: 'homekit-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '8.0'`).

There is no mature first-party Expo / community package for HomeKit,
so this feature ships its own thin Swift bridge
(`native/ios/homekit/HomeKitBridge.swift`) wrapping `HMHomeManager` and
`HMAccessory` plus a JS bridge (`src/native/homekit.ts`) with
platform-specific siblings that throw `HomeKitNotSupported` on Android
and Web. The bridge is mocked at the import boundary in unit tests.

The accompanying Expo config plugin `plugins/with-homekit/` injects
the single Info.plist key required by HomeKit
(`NSHomeKitUsageDescription`). The plugin is **idempotent**, **coexists**
byte-cleanly with every prior plugin, and never deletes or mutates
unrelated keys.

## User Scenarios

- **US1** — Open the lab on iOS. The Authorization card shows the
  HomeKit access status (notDetermined / authorized / denied /
  restricted) and a "Request access" button that triggers
  `HMHomeManager` initialisation.
- **US2** — Press "Request access" → the iOS HomeKit permission
  sheet appears, and on completion the status updates and the homes
  list populates.
- **US3** — Homes list shows every home discovered by
  `HMHomeManager` with a "Primary" pill marking the primary home.
- **US4** — Tap a home → the rooms list expands into accessories and
  the accessories list expands into a characteristics tree (one row
  per writable / readable characteristic).
- **US5** — Characteristic editor: bool characteristics render as a
  toggle, percent characteristics as a five-step segment slider, and
  enum characteristics as a picker. Pressing "write" calls the bridge
  `writeCharacteristic` method.
- **US6** — Live observe demo: subscribe to a characteristic and
  display the running update count. Unsubscribing tears the observer
  down on the bridge side.
- **US7** — Setup notes section explains how to use the
  HomeKit Accessory Simulator on macOS to add fake accessories so
  the lab has data to display in the iOS Simulator.
- **US8** — On Android / Web, an `IOSOnlyBanner` explains HomeKit is
  Apple-only.

## Functional Requirements

- **FR-1** The module manifest MUST declare `id: 'homekit-lab'`,
  `platforms: ['ios','android','web']`, `minIOS: '8.0'`.
- **FR-2** The iOS screen MUST compose six sections in source order:
  Authorization, HomesList, RoomsList, AccessoriesList,
  CharacteristicEditor, LiveObserveCard. Android / Web variants MUST
  render an `IOSOnlyBanner` only.
- **FR-3** The hook `useHomeKit` MUST encapsulate all HomeKit bridge
  interactions and expose a stable, typed API
  (status, homes, selection, read / write / observe).
- **FR-4** The hook MUST tear down its observer subscription on
  unmount.
- **FR-5** The hook MUST treat all bridge errors as recoverable
  (set `lastError`, never throw).
- **FR-6** `characteristic-types.ts` MUST expose the canonical
  characteristic-kind union, the auth-status enum, frozen catalogues,
  and pure helpers used by tests.
- **FR-7** The native bridge MUST expose
  `getHomes`, `getAccessories`, `readCharacteristic`,
  `writeCharacteristic`, and `observeCharacteristic`. JS bridge
  variants for Android / Web MUST throw `HomeKitNotSupported`.
- **FR-8** The `with-homekit` plugin MUST add
  `NSHomeKitUsageDescription` to the parent target's Info.plist
  (overwriting only if our key was absent or non-string), and MUST
  not touch unrelated keys.
- **FR-9** The plugin MUST be idempotent (re-running yields a
  byte-stable result) and MUST coexist byte-cleanly with every prior
  plugin in the repo (keychain, sign-in-with-apple, app-clips,
  universal-links, healthkit, etc.).
- **FR-10** All native bridges MUST be mocked at the import boundary
  in unit tests (no real HomeKit invocations).
- **FR-11** The full pnpm check pipeline (format / lint / typecheck /
  jest) MUST be green; no `eslint-disable` directives may be added.

## Non-Functional Requirements

- **NFR-1** Constitution v1.1.0
- **NFR-2** Additive only — no deletions to existing modules, plugins,
  or tests
- **NFR-3** No new lint exceptions
- **NFR-4** Test surface MUST cover: characteristic-types pure module,
  manifest invariants, registry registration, all three screen
  variants, all seven components, hook full lifecycle, native bridge
  contract (mocked), and plugin pure mutation + wrapper +
  coexistence + idempotency.

## Success Criteria

- SC-1 `pnpm check` is green on the feature branch
- SC-2 The HomeKit card appears in the Modules tab and routes to
  `/modules/homekit-lab`
- SC-3 `with-mapkit` coexistence test plugin count bumped 34 → 35
- SC-4 Test count delta over feature 043: at least +14 suites and
  +60 tests added (target ~16 suites)
