# Tasks — Feature 044 (HomeKit Lab)

| #    | Task | Status |
|------|------|--------|
| T001 | Create `src/native/homekit.types.ts` (cross-platform types) | done |
| T002 | Create `src/native/homekit.ts` (iOS bridge) | done |
| T003 | Create `src/native/homekit.android.ts` (rejecting stub) | done |
| T004 | Create `src/native/homekit.web.ts` (rejecting stub) | done |
| T005 | Create `native/ios/homekit/HomeKitBridge.swift` + podspec + module config | done |
| T006 | Create `src/modules/homekit-lab/index.tsx` manifest | done |
| T007 | Create `src/modules/homekit-lab/characteristic-types.ts` | done |
| T008 | Create `src/modules/homekit-lab/hooks/useHomeKit.ts` | done |
| T009 | Create iOS screen (`screen.tsx`) composing the 6 sections | done |
| T010 | Create Android variant (`screen.android.tsx`) | done |
| T011 | Create Web variant (`screen.web.tsx`) | done |
| T012 | Component: AuthorizationCard | done |
| T013 | Component: HomesList | done |
| T014 | Component: RoomsList | done |
| T015 | Component: AccessoriesList | done |
| T016 | Component: CharacteristicEditor | done |
| T017 | Component: LiveObserveCard | done |
| T018 | Component: IOSOnlyBanner | done |
| T019 | Plugin: `plugins/with-homekit/{index.ts,package.json}` | done |
| T020 | Wire manifest into `src/modules/registry.ts` | done |
| T021 | Wire plugin into `app.json` plugins array | done |
| T022 | Bump `with-mapkit` plugin-count test 34 → 35 | done |
| T023 | UT: characteristic-types.test.ts | done |
| T024 | UT: manifest.test.ts | done |
| T025 | UT: registry.test.ts (homekit-lab) | done |
| T026 | UT: screen iOS / Android / Web (3 suites) | done |
| T027 | UT: 7 component suites | done |
| T028 | UT: useHomeKit.test.tsx (lifecycle + errors + observer) | done |
| T029 | UT: native/homekit.test.ts (bridge contract, mocked) | done |
| T030 | UT: with-homekit plugin (pure + wrapper + coexistence + idempotency) | done |
| T031 | `pnpm format && pnpm check` green | done |
| T032 | Commit | done |
