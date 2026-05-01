# Implementation Plan: Live Activities + Dynamic Island Showcase

**Branch**: `007-live-activities-dynamic-island` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/007-live-activities-dynamic-island/spec.md`

## Summary

Ship one new iOS-only module — **Live Activity Demo** — that demonstrates a
live-updating presentation on the Lock Screen and across all three Dynamic
Island surfaces (compact, expanded, minimal). The module plugs into the
existing module registry from spec 006 with a single import line and
gracefully degrades to an "iOS only" / "Requires iOS 16.1+" badge on every
unsupported target.

The technical approach is dictated by the constitution and by the registry
contract from spec 006:

- **Native (iOS) side**: a new Widget Extension target written in Swift +
  SwiftUI, sources living under `ios-widget/` at the repo root. The
  extension declares one `ActivityAttributes` (`LiveActivityDemoAttributes`)
  with one `ContentState` (`counter: Int`, derived `progress: Double`) and
  one `ActivityConfiguration` covering the Lock Screen view and the three
  Dynamic Island regions (compact leading/trailing, expanded, minimal).
  Visuals use SF Symbols + system colours only (FR-015).
- **Config plugin**: `plugins/with-live-activity/` (TypeScript). At
  `expo prebuild` time it (a) creates the Widget Extension target in the
  generated Xcode project, (b) copies / file-references the Swift sources
  from `ios-widget/` into the target, (c) sets `NSSupportsLiveActivities = true`
  in the main app's `Info.plist`. The plugin is idempotent: a second
  `expo prebuild` on a clean tree produces zero diff (FR-022, SC-008).
- **JS bridge**: `src/native/live-activity.ts` exposes `isAvailable()`,
  `start({ name, initialCounter })`, `update({ counter })`, `end()`. Strict
  TypeScript, no `any`. iOS implementation uses
  `requireNativeModule('LiveActivityDemo')` from `expo-modules-core` to call
  a thin custom Expo Modules API native module that wraps
  `Activity<LiveActivityDemoAttributes>.request / .update / .end`. Non-iOS
  platforms get a `.web.ts` / `.android.ts` (or `Platform.OS` early-return
  in the same file — see R3) stub that returns `false` from `isAvailable()`
  and rejects the other methods with a typed `LiveActivityNotSupportedError`
  rather than throwing at import time (FR-018).
- **Default decision (called out in user input)**: write a minimal custom
  Expo Modules API native module rather than depending on a third-party
  `expo-live-activity` package. Keeps the showcase self-contained, makes
  the bridge contract auditable, and is educational — see R2 for the
  alternatives weighed.
- **Module entry**: `src/modules/live-activity-demo/` with `index.tsx`
  (manifest with `platforms: ['ios']`, `minIOS: '16.1'`) and `screen.tsx`
  (UI: Start / Update / End buttons + status display, using `ThemedText`,
  `ThemedView`, the `Spacing` scale, and `StyleSheet.create()`).
- **Routing / registry**: auto-pickup via the existing 006 registry — add
  one import line to `src/modules/registry.ts` and append the manifest to
  `MODULES`. No other shell file is touched (FR-001).
- **Tests** (JS-side only — Swift code is not unit-testable in this
  environment, see R5): screen behaviour, bridge contract on iOS + non-iOS,
  and config-plugin idempotency.

No APNs, no push tokens, no remote updates, no App Intents, no custom
themes, no bundled images for the activity itself (FR-013, FR-015, FR-016).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React Native 0.83;
Swift 5.9 (Widget Extension), SwiftUI, ActivityKit (iOS 16.1+ APIs)
**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes),
`expo-modules-core` (already transitively present via `expo`),
`expo-symbols` (existing), `react-native-reanimated` 4.2 +
`react-native-worklets`. New build-time devDependency:
`@expo/config-plugins` (added via `npx expo install @expo/config-plugins`)
for the `plugins/with-live-activity/` plugin. No new runtime npm deps.
**Storage**: None on the JS side. `ActivityKit` itself owns the persisted
activity record across the app process lifetime; the in-app status display
reconciles to the system state on every screen mount (FR-009).
**Testing**: `jest-expo` 55 + `@testing-library/react-native` 13, configured
under `test/unit/**` (existing setup). Swift code: manual on-device
verification matrix only (see quickstart.md and R5).
**Target Platform**: iOS 16.1+ (primary, required for `ActivityKit`); iOS
Lock Screen and Dynamic Island (Dynamic Island only on iPhone 14 Pro and
newer — see Assumptions in spec.md). Android (latest two majors) and Web
receive the gated card only.
**Project Type**: Mobile + Web single Expo Router project, extended with
one iOS Widget Extension target wired in at prebuild time by a local
config plugin.
**Performance Goals**: Lock Screen + Dynamic Island appear within 1 s of
Start (SC-001); Update propagates to all surfaces within 500 ms (SC-002);
End removes the activity within 1 s (SC-003); full Start → Update ×2 → End
loop completable in under 30 s (SC-006).
**Constraints**: StyleSheet-only styling, `ThemedText` / `ThemedView` only,
`Spacing` scale only, typed `expo-router` routes, no Animated API, no
inline `Platform.select()` for non-trivial divergence (constitution III),
no `any` in the bridge (FR-017). Native module is iOS-only; non-iOS
imports MUST NOT throw (FR-018). Config plugin MUST be idempotent
(FR-022).
**Scale/Scope**: 1 new module, 1 new screen, 1 new manifest entry, 1 new
config plugin (~150 LOC TS), 1 new Widget Extension target (~150–250 LOC
Swift), 3 new test files. No new shell routes, no new tabs, no schema.
~600 LOC of feature code total (TS + Swift combined).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0 (note: user input
referenced v1.0.1; the file on disk is v1.1.0 — the new MINOR section is
*Validate-Before-Spec*, addressed below).

| Principle | Compliance | Evidence |
|---|---|---|
| **I. Cross-Platform Parity** | ✅ PASS (with documented exemption) | The *core user journey* (browse the Modules grid, see the Live Activity Demo card, understand why it is unavailable on this platform) works on iOS, Android, and web. The platform-specific *experience* (running an actual Live Activity) is iOS-only by physical reality — `ActivityKit` does not exist on Android or web. The principle's "Platform-specific behavior is permitted when it improves UX on that platform" clause covers this: rather than degrade, the module gracefully gates per spec 006's existing platform/`minIOS` mechanism (FR-003, FR-004). On unsupported targets the user gets a clear "iOS only" or "Requires iOS 16.1+" badge — a *better* UX than a broken stub (Story 4 / SC-004). |
| **II. Token-Based Theming** | ✅ PASS | Every text and surface in `screen.tsx` uses `ThemedText` / `ThemedView`. All spacing comes from the `Spacing` scale. No hardcoded colors in JS. The Widget Extension's SwiftUI views use SF Symbols and system colours only (FR-015) — these are iOS-system tokens, the iOS-side analogue of the JS theme system; no custom hex values. |
| **III. Platform File Splitting** | ✅ PASS | The JS bridge splits via file suffix: `src/native/live-activity.ts` (iOS via `requireNativeModule`), `src/native/live-activity.android.ts` (stub), `src/native/live-activity.web.ts` (stub). The screen does not branch internally — it consults `bridge.isAvailable()` and renders accordingly. No `Platform.select()` for non-trivial divergence. |
| **IV. StyleSheet Discipline** | ✅ PASS | All `screen.tsx` styles via `StyleSheet.create()`. No CSS-in-JS, no inline style objects beyond what `StyleSheet.create()` accepts. `Spacing` scale used throughout. The Widget Extension's Swift views use SwiftUI modifiers, not RN StyleSheet — out of scope of this principle. |
| **V. Test-First for New Features** | ✅ PASS | Tests under `test/unit/`: `modules/live-activity-demo/screen.test.tsx` (button enable/disable across states, bridge call assertions, non-iOS notice), `native/live-activity.test.ts` (bridge contract, non-iOS stub behaviour, type signatures via TS), `plugins/with-live-activity/index.test.ts` (Info.plist mutation, target registration, idempotency). FR-026 and FR-027 enforce. Acceptance scenarios from Stories 1–4 are mapped to tests in tasks.md (next phase). The Swift Widget Extension is exempt: this repo has no Swift unit-test runner configured, the principle's exemption clause covers "config / native scaffolding without an applicable test framework", and a manual on-device verification matrix is shipped in `quickstart.md` per the exemption rule. |

**Technology Constraints check**: Expo SDK 55 ✅, `expo-router` typed routes
✅ (no new routes added — module dispatch goes through existing
`/modules/[id]` from spec 006), Reanimated + Worklets only (no Animated
API) ✅ — this feature has no JS animation, animation in the activity is
handled by SwiftUI, pnpm hoisted ✅, React Compiler enabled ✅
(`screen.tsx` is a pure function component, compatible), path aliases
honored (`@/native/live-activity`, `@/modules/types`, `@/constants/theme`,
etc.) ✅. `expo-image` not introduced (no images bundled for the activity,
FR-015) ✅.

**Validate-Before-Spec check** (Workflow §): Applicable. This feature ships
a config plugin that mutates the iOS project at prebuild time and
introduces a new Widget Extension target — both qualify as "build pipeline
/ infrastructure". The plan therefore mandates a proof-of-concept
validation step in Phase 0:

> **Phase 0 R6 — POC build**: Before tasks are generated, run
> `pnpm expo prebuild --clean` against a scratch worktree with the config
> plugin scaffolded and verify (a) the Widget Extension target appears in
> `ios/spot.xcodeproj/project.pbxproj` and (b) `NSSupportsLiveActivities`
> is set in `ios/spot/Info.plist`. If validation fails, the spec is
> back-patched per the workflow rule before tasks are written.

The POC is recorded in `research.md` R6 with its outcome, and in
`quickstart.md` as the "Build the dev client" recipe. The spec's
"out of scope" assumptions (no APNs, no App Intents, no custom themes)
were also validated against `ActivityKit` documentation during R1–R3 and
do not require a build POC.

**Result**: PASS. No constitutional violations. Complexity Tracking
intentionally omitted.

## Project Structure

### Documentation (this feature)

```text
specs/007-live-activities-dynamic-island/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Already authored
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/          # Pre-existing (e.g., requirements checklist)
└── contracts/
    ├── live-activity-bridge.md     # JS ↔ native bridge contract
    └── activity-attributes.md      # Swift ActivityAttributes / ContentState contract
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                       # (modified) one new import + one new array entry
│   ├── types.ts                          # (kept — re-uses spec 006 contract)
│   └── live-activity-demo/
│       ├── index.tsx                     # NEW — exports default ModuleManifest
│       └── screen.tsx                    # NEW — Start/Update/End UI + status
├── native/
│   ├── live-activity.ts                  # NEW — iOS impl (requireNativeModule)
│   ├── live-activity.android.ts          # NEW — stub (LiveActivityNotSupportedError)
│   ├── live-activity.web.ts              # NEW — stub (LiveActivityNotSupportedError)
│   └── live-activity.types.ts            # NEW — shared types: LiveActivityState, errors
└── …                                     # (rest of src/ untouched)

ios-widget/                               # NEW — Swift sources, copied into Xcode by plugin
├── LiveActivityDemoAttributes.swift      # ActivityAttributes + ContentState
├── LiveActivityDemoWidget.swift          # ActivityConfiguration (Lock Screen + DI)
├── LiveActivityDemoModule.swift          # Expo Modules API native module
└── Info.plist                            # Widget Extension Info.plist

plugins/
└── with-live-activity/
    ├── index.ts                          # NEW — config plugin entry
    ├── add-widget-extension.ts           # NEW — pbxproj target injection
    ├── set-info-plist.ts                 # NEW — NSSupportsLiveActivities mod
    └── package.json                      # NEW — local plugin package descriptor

test/unit/
├── modules/
│   └── live-activity-demo/
│       └── screen.test.tsx               # NEW — see FR-026
├── native/
│   └── live-activity.test.ts             # NEW — bridge contract
└── plugins/
    └── with-live-activity/
        └── index.test.ts                 # NEW — config plugin idempotency
```

**Structure Decision**: Single Expo Router project (existing 006 layout
extended). The module folder, the JS bridge folder, the Widget Extension
folder, and the config-plugin folder are all *additive* — no existing
shell file is touched except the registry barrel (one import + one entry,
per FR-001). New code is co-located by domain: `src/modules/live-activity-demo/`
owns the screen, `src/native/` owns the JS↔native bridge, `ios-widget/`
owns the Swift sources, and `plugins/with-live-activity/` owns the
prebuild integration.

## Phase 0 Output

See [`research.md`](./research.md). All `NEEDS CLARIFICATION` items in the
template have been resolved by user-provided guidance, the spec, and the
constitution. The Validate-Before-Spec POC is recorded as R6.

## Phase 1 Output

- [`data-model.md`](./data-model.md) — entities: `LiveActivityState`,
  `LiveActivitySession`, `LiveActivityDemoAttributes` (Swift),
  `LiveActivityNotSupportedError`, `LiveActivityAuthorisationError`.
- [`contracts/live-activity-bridge.md`](./contracts/live-activity-bridge.md)
  — the TypeScript bridge contract every consumer (and stub) must honour.
- [`contracts/activity-attributes.md`](./contracts/activity-attributes.md)
  — the Swift `ActivityAttributes` + `ContentState` contract the Widget
  Extension and the native module both depend on.
- [`quickstart.md`](./quickstart.md) — install / prebuild / build / on-
  device verification matrix.
- Agent context updated: the `<!-- SPECKIT START -->` block in
  `.github/copilot-instructions.md` now points at
  `specs/007-live-activities-dynamic-island/plan.md`.

**Re-evaluation of Constitution Check after Phase 1 design**: Still PASS.
The bridge file split (`live-activity.ts` / `.android.ts` / `.web.ts`)
satisfies III. The contracts under `contracts/` are pure documentation,
not new shell coupling. The Widget Extension target lives outside `src/`
and outside any path the bundler walks — it is wired in only at iOS
prebuild time. The added `@expo/config-plugins` dependency is a
devDependency, not a runtime dep, and is the canonical Expo-supported way
to mutate prebuild output.

## Open Questions Flagged

None. All architectural decisions are recorded in `research.md`. Items
deferred to a future spec — APNs / push-token updates, App Intents inside
the activity, custom themes for the activity, additional activity types —
are listed in spec.md's *Assumptions* section and explicitly out of scope
here.
