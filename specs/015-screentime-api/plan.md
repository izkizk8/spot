# Implementation Plan: ScreenTime / FamilyControls Showcase Module

**Branch**: `015-screentime-api` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/015-screentime-api/spec.md`

## Summary

Ship a code-complete educational scaffold for Apple's `FamilyControls`, `DeviceActivity`, and `ManagedSettings` frameworks inside the spot Expo app. Because the underlying `com.apple.developer.family-controls` entitlement requires Apple's written approval (and is frequently denied), the module is designed first for the **unentitled** experience: every native call is wrapped to fail gracefully with a typed `EntitlementMissing` error, and an on-screen `EntitlementBanner` plus `quickstart.md` repeatedly surface this reality.

Technical approach:

1. **Native layer** (`native/ios/screentime/`, three Swift files): `ScreenTimeManager.swift` wraps `AuthorizationCenter` / `ManagedSettingsStore` / `DeviceActivityCenter` behind `expo-modules-core` with `do/catch` on every call site; `FamilyActivityPickerView.swift` is a `UIViewControllerRepresentable` for the SwiftUI picker; `DeviceActivityMonitorExtension.swift` is a separate iOS extension target whose `intervalDidStart` / `intervalDidEnd` log via `OSLog`.
2. **JS bridge** (`src/native/screentime.ts` + `screentime.types.ts` + `screentime.web.ts`): typed Promise API with the 9 methods enumerated in FR-011, sentinel-throwing stubs on Android/web, runtime probe of `entitlementsAvailable()` that catches throws and returns `false`.
3. **Module UI** (`src/modules/screentime-lab/`): four cards (Authorization, ActivityPicker, Shielding, Monitoring) + `EntitlementBanner` driven by a pure reducer in `screentime-state.ts`; three platform screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`); registered via a single import + array entry in `src/modules/registry.ts`.
4. **Config plugin** (`plugins/with-screentime/`): adds the `com.apple.developer.family-controls` entitlement, registers the monitor extension target with a unique name, idempotent, must coexist with feature 007's `LiveActivityWidget` and feature 014's `HomeWidget` targets without modifying them.
5. **Persistence**: Reuses feature 014's App Group for `UserDefaults`-backed selection-token storage; degrades to in-memory if the App Group bundle marker is absent.

The change set is purely additive: only `src/modules/registry.ts` (≤ 2 lines) and `app.json` (one plugin entry) touch existing files.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (JS layer), Swift 5.9 (iOS native, compiled via EAS Build / macOS only — not testable on Windows)
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2, `expo-router` (typed routes), `expo-modules-core` (native module wrapper), `react-native-reanimated` + `react-native-worklets`, Apple frameworks `FamilyControls` / `DeviceActivity` / `ManagedSettings` (iOS 16+)
**Storage**: Shared `UserDefaults` via the App Group established by feature 014 (key namespace `screentime.*`); in-memory fallback when the App Group is absent
**Testing**: Jest Expo + React Native Testing Library under `test/unit/` mirroring `src/`; JS-pure layer only (reducer, bridge contract with mocked native, config plugin against fixtures, components, screens, manifest). Native Swift sources are not Windows-testable; on-device verification is documented in `quickstart.md` and is conditional on holding the entitlement.
**Target Platform**: iOS 16+ (functional path), iOS 16+ unentitled (degraded scaffold path), Android + Web (iOS-only banner, disabled controls)
**Project Type**: Mobile app module — additive feature inside the existing spot showcase
**Performance Goals**: 60 fps interactions in the four cards; native bridge calls return within typical native-module roundtrip (no specific budget); reducer transitions O(1)
**Constraints**:
- Purely additive change set (FR-029 / SC-003): only `src/modules/registry.ts` and `app.json` may touch existing files
- Must coexist with features 007 (Live Activities) and 014 (Home Widgets) plugins without colliding extension targets
- Must NOT modify feature 014's App Group bundle marker if present
- Every native action MUST surface a status message, never an uncaught crash or rejection
**Scale/Scope**: Single feature module — ~3 Swift files, 1 bridge module (3 platform variants + types), 1 reducer, 4 cards + 1 banner, 3 screens, 1 config plugin, 1 manifest, ~12 JS-pure test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Note on version**: The user-supplied context cites constitution v1.0.1, and the current `.github/copilot-instructions.md` also reads v1.0.1 (stale). The actual constitution at `.specify/memory/constitution.md` is **v1.1.0** (ratified 2026-04-25), which adds Validate-Before-Spec and spec back-patching workflow guidance. This plan is checked against v1.1.0; both versions agree on Principles I–V.

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module is registered for `['ios','android','web']`. The four-card layout renders on all three platforms; Android + Web show the iOS-only banner with disabled controls (FR-010). The `screen.android.tsx` and `screen.web.tsx` variants are first-class deliverables. The "core user journey" — viewing the educational scaffold and reading the entitlement story — is equivalent everywhere. iOS-restricted behavior (actual shielding) is permitted as platform-specific UX improvement per the principle. |
| **II. Token-Based Theming** | ✅ Pass | All cards use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. The status-pill colors come from `useTheme()`; no hardcoded hex. The `EntitlementBanner` color treatment uses theme tokens. |
| **III. Platform File Splitting** | ✅ Pass | Bridge uses `screentime.ts` (iOS default) + `screentime.web.ts` (web stub). Screen uses `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. No inline `Platform.select()` for non-trivial logic; only a single-value `Platform.OS === 'ios'` check is used inside `isAvailable()` (acceptable per principle: single-value difference). |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. Spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-025 enumerates 12+ JS-pure test files (reducer, bridge contract, config plugin, all 4 cards + banner, 3 screens, manifest). Tests are written alongside or before implementation in tasks (enforced by the mandatory `speckit.superb.tdd` hook before implement). The Swift native sources are exempt from JS-side test-first because no Windows-runnable Swift test framework is configured; on-device verification steps are documented in `quickstart.md` per the principle's exemption clause for code that depends on infrastructure not yet available. |

**Gate decision**: PASS. No violations to justify.

**Validate-Before-Spec (v1.1.0 addition)**: This feature touches a build pipeline concern (an Apple entitlement that breaks EAS Build). Phase 0 research below documents the entitlement-detection probe technique chosen via reading Apple framework headers and prior community reports — formal proof-of-concept build is **not feasible without holding the entitlement**, so the spec was written with that constraint explicitly called out (the entire "Entitlement Reality Check" section + Assumptions). The "comment-out plugin" mitigation in `quickstart.md` validates the workaround path on Windows. Any back-patch needed once an entitled developer attempts an EAS Build will be folded into the spec per the back-patching guidance.

## Project Structure

### Documentation (this feature)

```text
specs/015-screentime-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── screentime-bridge.contract.ts   # JS bridge TypeScript contract
│   └── screentime-state.contract.ts    # Reducer state + action contracts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                     # +1 import line, +1 array entry (ONLY edit)
│   └── screentime-lab/                 # NEW
│       ├── index.ts                    # ModuleManifest export (id, platforms, minIOS:'16.0')
│       ├── screen.tsx                  # iOS screen — 4 cards + banner
│       ├── screen.android.tsx          # iOS-only banner + disabled cards
│       ├── screen.web.tsx              # iOS-only banner + disabled cards
│       ├── screentime-state.ts         # Pure reducer (state + actions)
│       └── components/
│           ├── EntitlementBanner.tsx
│           ├── AuthorizationCard.tsx
│           ├── ActivityPickerCard.tsx
│           ├── ShieldingCard.tsx
│           └── MonitoringCard.tsx
└── native/
    ├── screentime.ts                   # iOS bridge (uses requireOptionalNativeModule)
    ├── screentime.web.ts               # Web stub — sentinel rejections
    ├── screentime.android.ts           # Android stub — sentinel rejections
    └── screentime.types.ts             # Shared types + ScreenTimeNotSupportedError, EntitlementMissingError

native/
└── ios/
    └── screentime/                     # NEW (sibling of native/ios/widgets, native/ios/app-intents)
        ├── ScreenTimeManager.swift
        ├── FamilyActivityPickerView.swift
        ├── DeviceActivityMonitorExtension.swift
        └── ScreenTime.podspec          # expo-modules-core registration

plugins/
└── with-screentime/                    # NEW
    ├── index.ts                        # Default export: ConfigPlugin
    ├── add-entitlement.ts              # Adds family-controls entitlement
    ├── add-monitor-extension.ts        # Adds DeviceActivityMonitorExtension target
    └── consume-app-group.ts            # Reads (does NOT write) feature 014's App Group marker

test/unit/
├── modules/screentime-lab/
│   ├── screentime-state.test.ts
│   ├── manifest.test.ts
│   ├── screen.test.tsx
│   ├── screen.android.test.tsx
│   ├── screen.web.test.tsx
│   └── components/
│       ├── EntitlementBanner.test.tsx
│       ├── AuthorizationCard.test.tsx
│       ├── ActivityPickerCard.test.tsx
│       ├── ShieldingCard.test.tsx
│       └── MonitoringCard.test.tsx
├── native/
│   └── screentime.test.ts
└── plugins/
    └── with-screentime/
        └── index.test.ts

app.json                                # +1 plugin entry: "./plugins/with-screentime"
```

**Structure Decision**: Standard spot module layout (mirrors features 006–014). The triad of `native/ios/<feature>/`, `src/native/<feature>.{ts,android.ts,web.ts}`, and `src/modules/<feature>-lab/` is the established pattern (see features 007 live-activity, 014 home-widgets). The module slug `screentime-lab` follows the `<topic>-lab` convention used by `swift-charts-lab`, `app-intents-lab`, `widgets-lab`, `sf-symbols-lab`. The config plugin slug `with-screentime` matches `with-app-intents`, `with-home-widgets`, `with-live-activity`.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The only architectural novelty — a separate iOS **extension target** for `DeviceActivityMonitorExtension` — is forced by Apple's framework design (the extension must be a distinct binary the system can launch out-of-process) and is precedented by feature 007's `LiveActivityWidget` target and feature 014's `HomeWidget` target. The plugin's "must coexist without modifying 007/014 targets" constraint is encoded as a fixture-based test (FR-025: `plugins/with-screentime/index.test.ts` against 007/014 fixtures) rather than as runtime complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
