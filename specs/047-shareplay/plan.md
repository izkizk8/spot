# Implementation Plan — 047-shareplay

## Files

### Native (iOS)
- `native/ios/shareplay/ShowcaseGroupActivity.swift` — struct
  conforming to `GroupActivity`; metadata + `activityIdentifier`.
- `native/ios/shareplay/SharePlayBridge.swift` — Expo Module
  managing `GroupSession`, `GroupSessionMessenger`, observers.
- `native/ios/shareplay/SharePlay.podspec`
- `native/ios/shareplay/expo-module.config.json`

### JS bridge
- `src/native/shareplay.types.ts` — shared types (records,
  `SharePlayNotSupported` error, `ActivityType`,
  `SessionStatus`, `Participant`, `SessionState`,
  `SharePlayBridge` interface).
- `src/native/shareplay.ts` — iOS variant via
  `requireOptionalNativeModule`.
- `src/native/shareplay.android.ts` — rejects with
  `SharePlayNotSupported`.
- `src/native/shareplay.web.ts` — rejects with
  `SharePlayNotSupported`.

### Module
- `src/modules/shareplay-lab/index.tsx` — manifest.
- `src/modules/shareplay-lab/screen.tsx` — iOS screen.
- `src/modules/shareplay-lab/screen.android.tsx` — IOSOnlyBanner.
- `src/modules/shareplay-lab/screen.web.tsx` — IOSOnlyBanner.
- `src/modules/shareplay-lab/activity-types.ts` — frozen catalog.
- `src/modules/shareplay-lab/hooks/useGroupActivity.ts` — hook
  with `__setSharePlayBridgeForTests`.
- `src/modules/shareplay-lab/components/{CapabilityCard,
  ActivityComposer, SessionStatusCard, ParticipantsList,
  CounterActivity, SetupInstructions, IOSOnlyBanner}.tsx`.

### Plugin
- **None.** See `research.md` — basic `GroupActivity` registration
  does not require entitlements or Info.plist keys.

### Tests (JS-pure)
- `test/unit/native/shareplay.test.ts` — bridge contract.
- `test/unit/modules/shareplay-lab/activity-types.test.ts`.
- `test/unit/modules/shareplay-lab/manifest.test.ts`.
- `test/unit/modules/shareplay-lab/registry.test.ts`.
- `test/unit/modules/shareplay-lab/screen.test.tsx`.
- `test/unit/modules/shareplay-lab/screen.android.test.tsx`.
- `test/unit/modules/shareplay-lab/screen.web.test.tsx`.
- `test/unit/modules/shareplay-lab/hooks/useGroupActivity.test.tsx`.
- `test/unit/modules/shareplay-lab/components/*.test.tsx` (×7).

### Wiring
- `src/modules/registry.ts` — append `shareplayLab`.
- `app.json` — **unchanged** (no plugin).
- `test/unit/plugins/with-mapkit/index.test.ts` — **unchanged**
  (count remains 37).

## Constraints

- Additive-only.
- No `eslint-disable`.
- `pnpm format` before commit.
- Native bridges mocked at import boundary.
