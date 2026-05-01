# Implementation Plan: App Intents Showcase

**Branch**: `013-app-intents` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: [`specs/013-app-intents/spec.md`](./spec.md)

## Summary

Add a new module `app-intents-lab` to the iOS Feature Showcase
plugin registry that demos Apple's **App Intents** framework. Three
typed intents — `LogMoodIntent`, `GetLastMoodIntent`,
`GreetUserIntent` — are defined in Swift, registered with the main
app target via a TS Expo config plugin (`plugins/with-app-intents/`)
at `expo prebuild` time, and surfaced to Siri / Shortcuts /
Spotlight through a single `AppShortcutsProvider` with one
Apple-recommended phrase each. A JS bridge at
`src/native/app-intents.ts` exposes `logMood` / `getLastMood` /
`greetUser` / `isAvailable`; on non-iOS or iOS < 16 the bridge
methods throw `AppIntentsNotSupported` (loud failure) per FR-011.

The screen has two halves: an iOS-16+ self-test panel that fires
each intent through the bridge and renders an in-memory ring buffer
of the last 10 invocations; and a cross-platform Mood History list
backed by an AsyncStorage mood store (`spot.app-intents.moods`)
shared between the Swift intent path and the JS UI. On Android,
Web, and iOS < 16 the screen swaps the self-test panel and event
log for an "iOS 16+ only" banner plus a JS-only Mood Logger and
inline Greet form — the same Mood History list renders below.

The change is purely additive: exactly one import line plus one
array entry in `src/modules/registry.ts` (per FR-039 / SC-010); no
files belonging to features 006, 007, 008, 009, 010, 011, or 012
are modified. Tests are JS-pure (Jest Expo + RNTL); the Swift
intent bodies are verified manually on device per `quickstart.md`.

The `with-app-intents` plugin is independent from feature 007's
`with-live-activity` plugin — confirmed by inspecting
`plugins/with-live-activity/` (see Decision 2 in `research.md`).
The two plugins write to disjoint regions of the Xcode project
(`with-live-activity` adds a Widget Extension target;
`with-app-intents` only adds Swift source files to the main app
target's compile sources) so they can coexist additively at
`expo prebuild` time.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React
Native 0.83, Expo SDK 55. Swift 5.9 / iOS 16+ for the App Intents
bodies and the `AppShortcutsProvider`. Constitution v1.0.1 / v1.1.0
— both impose the same gates (TS strict, StyleSheet,
ThemedText/ThemedView, `@/*` alias, test-first, cross-platform
parity) and this feature satisfies them all.
**Primary Dependencies**: `expo-modules-core` (already installed —
`requireOptionalNativeModule` is the JS-side resolver; mirrors the
feature 007 bridge pattern), `@expo/config-plugins` (already
installed — used by `with-live-activity`; reused by
`with-app-intents`), `@react-native-async-storage/async-storage`
(spec Assumptions confirm it's already a project dependency), and
`react-native` itself for the screen UI. Apple's
`AppIntents` framework is system-provided on iOS 16+ — no Swift
package is added. No new npm dependency is introduced.
**Storage**: `AsyncStorage` under the key `spot.app-intents.moods`
holds a JSON-serialised array of `MoodRecord` entries. Bounded at
**100 entries** on disk (planning resolution of NEEDS CLARIFICATION
#3); older entries are truncated on `push`. Read failures resolve
to `[]` (FR-016). The in-memory event log is not persisted.
**Testing**: Jest 29.7 + `@testing-library/react-native` 13.3 on
the Windows host (no native runtime). The two seams the tests mock
are (a) the JS bridge module `@/native/app-intents` (mocked in
component / screen tests so they don't have to instantiate
`requireOptionalNativeModule`), and (b)
`@react-native-async-storage/async-storage` (mocked in
`mood-store.test.ts` so the mood store is exercised against a
controllable in-memory backend that can be made to throw at will to
cover FR-016). Platform-split tests use the explicit-filename
`require('./screen.android').default` pattern established by
feature 006 / 011 / 012 so the iOS variant is never resolved on the
Windows test host. The Swift intent bodies and the
`AppShortcutsProvider` are verified manually on device per
`quickstart.md` (Constitution Principle V's manual-verification
allowance for native-only behaviour; the TS bridge contract that
wraps them is fully unit-tested with mocks).
**Target Platform**: iOS 16+ for the real App Intents bridge
(FR-001, `minIOS: '16.0'`, gated by spec 006's existing dispatch).
Android, Web, and iOS < 16 always render the JS-only fallback path
(FR-019, FR-024).
**Project Type**: mobile-app (Expo Router single project).
**Performance Goals**: SC-001 — a user fires each of the three
intents from the self-test panel within 60 s of opening the module
on iOS 16+. SC-002 — every self-test invocation produces a visible
result line and a new event log entry within the same render pass.
SC-004 — every Log mood invocation (whether from the self-test
panel, Siri, or Shortcuts) appears in the Mood History list within
the same render pass on the next screen visit. No frame-budget
metric is set; the screen is mostly text and small list rows.
**Constraints**: Additive only (SC-010 / FR-039 — exactly one
import line + one array entry added to `src/modules/registry.ts`).
No new global state, contexts, or persistence beyond the mood
store explicitly defined by FR-013 (FR-040). All styles via
`StyleSheet.create()` and the `Spacing` scale, themed primitives
only (FR-041). TypeScript strict, `@/*` alias (FR-042). No new
lint/test tooling (FR-042). The iOS-only bridge symbol MUST NOT be
evaluated at module load time on Android / Web / iOS < 16
(FR-031); platform-split files (`screen.tsx` is the iOS variant,
shadowed by `screen.android.tsx` / `screen.web.tsx`) are the
mechanism. The `with-app-intents` config plugin MUST NOT modify,
remove, or otherwise touch any file written by feature 007's
`with-live-activity` plugin (FR-030, SC-011) — see Decision 2 in
`research.md` for the disjointness proof.
**Scale/Scope**: 1 module, 1 screen (3 platform variants), 1 JS
bridge (with cross-platform parity tests), 1 mood store, 5
component files (`MoodLogger`, `MoodHistory`, `IntentEventLog`,
`GreetForm`, `ShortcutsGuideCard`), 1 manifest, 1 Expo config
plugin (TS) plus 3–4 Swift source files
(`LogMoodIntent.swift`, `GetLastMoodIntent.swift`,
`GreetUserIntent.swift`, `SpotAppShortcuts.swift`). ~13 TS source
files, ~13 test files, ~4 Swift files (manual verification only).

### Library decision: `expo-modules-core` `requireOptionalNativeModule` + `@expo/config-plugins`

The JS bridge mirrors feature 007's `live-activity.ts` pattern
(see `src/native/live-activity.ts`) and uses
`requireOptionalNativeModule<T>('AppIntents')` so the JS module
resolves to `null` on Android, Web, and iOS without the prebuild;
the bridge's `isAvailable()` returns `false` in those cases and
the four call sites (`logMood`, `getLastMood`, `greetUser`) all
throw `AppIntentsNotSupported`. This keeps the iOS-only symbol
import-safe on every platform without resorting to a `.web.ts`
split on the bridge itself.

The `with-app-intents` config plugin uses `@expo/config-plugins`'
`withXcodeProject` mod (the same surface
`with-live-activity/add-widget-extension.ts` uses) to add the
four Swift source files under `native/ios/app-intents/` to the
**main app target's** compile sources only — it does **not** add
a new target, does **not** touch `Info.plist`, and does **not**
write to any region of the Xcode project that
`with-live-activity` writes to (`with-live-activity` adds a
distinct `LiveActivityDemoWidget` target plus an
`NSSupportsLiveActivities` Info.plist key). Disjointness is
asserted by `plugins/with-app-intents/index.test.ts` (FR-030,
SC-011) using a fixture Xcode project pre-populated with the
state `with-live-activity` would leave behind, then asserting
that running `with-app-intents` over it leaves the live-activity
target / file refs untouched.

## Constitution Check

Constitution at `.specify/memory/constitution.md` (v1.0.1 per spec
Assumptions; file currently shows v1.1.0 — both versions impose
the same gates evaluated below).

| Principle | Status | How this plan complies |
|---|---|---|
| I. Cross-Platform Parity | ✅ | Module declares all three platforms (FR-001). Every user-visible affordance has a parity story: Mood Logger + Mood History + Greet form render on every platform; iOS-only affordances (self-test buttons that go through the native bridge, event log, Shortcuts integration guide) are replaced on the fallback by the "iOS 16+ only" banner + JS-only Mood Logger + inline Greet form (FR-019, FR-024). The mood store is platform-uniform pure JS so iOS and the fallback share the same source of truth (FR-013). |
| II. Token-Based Theming | ✅ | All chrome (banner, panels, list rows, cards, buttons) uses `ThemedText` / `ThemedView` and theme colors via `useTheme()`. No hardcoded hex values introduced — the module has no need for a bespoke palette (unlike the `swift-charts-lab` tint picker, which the spec Assumptions explicitly carved out). All spacing through the `Spacing` scale (FR-041). |
| III. Platform File Splitting | ✅ | Per FR-031, the iOS-only App Intents bridge symbol MUST NOT be evaluated at module load time on non-iOS / iOS < 16 targets. Two layers ensure this: (a) the JS bridge uses `requireOptionalNativeModule` so the import itself is import-safe on every platform; (b) the screen is split into `screen.tsx` (iOS, composes the self-test panel + event log + Shortcuts card), `screen.android.tsx` (banner + Mood Logger + Greet form + Mood History), and `screen.web.tsx` (same as android). The `IntentEventLog` and `ShortcutsGuideCard` components are imported only from `screen.tsx`; `MoodLogger`, `MoodHistory`, `GreetForm` are imported by every variant. No inline `Platform.select()` for non-trivial differences. |
| IV. StyleSheet Discipline | ✅ | All styles via `StyleSheet.create()` using the `Spacing` scale (FR-041). No CSS-in-JS, no inline style objects defined outside StyleSheet, no utility classes. The list rows and event log entries use plain `<ThemedView>` rows with `StyleSheet`-defined typography. |
| V. Test-First for New Features | ✅ | Per FR-044 plus the user's expanded test list: `mood-store.test.ts`, `native/app-intents.test.ts`, `plugins/with-app-intents/index.test.ts`, `components/{MoodLogger,MoodHistory,IntentEventLog,GreetForm,ShortcutsGuideCard}.test.tsx`, `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`, `manifest.test.ts`. Tests written alongside or before each implementation file. JS-only; the Swift intent bodies are verified manually per `quickstart.md` (Principle V's exemption for native-only behaviour applies only to the Swift code; the TS contract that wraps it is fully tested via mocks). |
| Tech constraints (TS strict, `@/*` alias, no Animated API, no inline-style libs) | ✅ | Module is plain RN + a TS bridge over `requireOptionalNativeModule` + an Expo config plugin. No animation APIs needed (the screen is text + lists). Imports use `@/modules/...`, `@/native/...`, `@/constants/theme`. |
| Validate-Before-Spec (build-pipeline features) | ✅ (light) | This is a feature module, not a build/infra change — the `with-app-intents` plugin is the only build-pipeline surface. The disjointness probe against `plugins/with-live-activity/` is captured in `research.md` Decision 2 (against the live source on disk) before any plugin code is written, satisfying the spirit of the gate. |

**Gate result**: PASS. No Complexity Tracking entries required.

### Resolved [NEEDS CLARIFICATION] markers from spec.md

Three markers are resolved here per the planning instructions
(autonomously with the recommended defaults the specifier
already noted in the spec's Notes section):

1. **Empty-name behaviour for `GreetUserIntent` (FR-008, Edge
   Cases)**: the Greet button is **disabled** whenever the name
   input is empty or whitespace-only
   (`name.trim().length === 0`). No default substitution is
   performed by the JS UI. The disable rule applies identically on
   iOS (gating the bridge call) and on the fallback (gating the
   inline greeting). The Swift `GreetUserIntent` body, which the
   JS UI cannot gate when the intent is invoked from Siri or
   Shortcuts, defends itself by returning `'Hello, there!'` for
   any empty / whitespace name reaching it from the system. This
   keeps the JS-side UX legible (a disabled button is the
   strongest possible signal) without leaving the Siri /
   Shortcuts surface able to produce an empty greeting.
2. **Default mood selection on first render (FR-020)**:
   **`neutral`** — the middle option, least judgemental, and the
   safest pre-selection in a self-test panel where the user may
   tap Log mood without changing the picker. Applies identically
   to the iOS self-test panel and the JS-only Mood Logger panel.
3. **Mood store hard cap (FR-013, FR-014, FR-015)**: the on-disk
   store is capped at **100 entries**; on `push` once the array
   would exceed 100, the oldest entries are truncated so the
   stored length stays exactly 100. `list()` without an explicit
   `limit` returns at most 100 entries (the same cap). The Mood
   History UI always passes `limit: 20`, so the on-disk cap is a
   defence-in-depth bound, not a UI-visible one.

These resolutions are recorded in `spec.md`'s Notes section
(replacing the three `[NEEDS CLARIFICATION]` markers), in
`research.md` Decision 5, and referenced in the relevant
`data-model.md` entries.

## Project Structure

### Documentation (this feature)

```text
specs/013-app-intents/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual on-device steps)
├── contracts/
│   ├── module-manifest.md   # Manifest contract (extends @/modules/types)
│   ├── app-intents-bridge.md # JS bridge contract (the single seam)
│   └── mood-store.md         # Mood store contract (push / list / clear)
├── spec.md
└── checklists/
```

### Source Code (repository root)

```text
src/modules/app-intents-lab/
├── index.tsx                       # ModuleManifest export (minIOS: '16.0')
├── screen.tsx                      # iOS variant (self-test + event log + Shortcuts card; no banner)
├── screen.android.tsx              # Android variant (banner + JS Mood Logger + Greet + Mood History)
├── screen.web.tsx                  # Web variant (same composition as android)
├── mood-store.ts                   # AsyncStorage-backed pure-JS mood store
├── event-log.ts                    # Pure reducer + ring-buffer types for the event log
└── components/
    ├── MoodLogger.tsx              # Mood picker + Log button (writes to mood-store)
    ├── MoodHistory.tsx             # Newest-first list of last 20 mood records
    ├── IntentEventLog.tsx          # Newest-first list of last 10 IntentInvocations (iOS only)
    ├── GreetForm.tsx               # Name field + Greet button (disabled when empty/whitespace)
    └── ShortcutsGuideCard.tsx      # Numbered steps + "Open Shortcuts" Linking button (iOS only)

src/native/app-intents.ts           # JS bridge: isAvailable / logMood / getLastMood / greetUser
                                    # plus AppIntentsNotSupported error class

plugins/with-app-intents/
├── package.json                    # name: 'with-app-intents'; main: 'index.ts'
├── index.ts                        # ConfigPlugin entry — composes add-app-intents-sources.ts
└── add-app-intents-sources.ts      # withXcodeProject mod that adds the four Swift files
                                    # to the main app target's compile sources (idempotent)

native/ios/app-intents/
├── LogMoodIntent.swift             # AppIntent + mood enum + AsyncStorage write + donate
├── GetLastMoodIntent.swift         # AppIntent reading last record from the shared store
├── GreetUserIntent.swift           # AppIntent with `name: String` parameter
└── SpotAppShortcuts.swift          # AppShortcutsProvider exposing all three intents

src/modules/registry.ts             # +1 import line, +1 array entry (only edit outside the module dir)
```

```text
test/unit/modules/app-intents-lab/
├── manifest.test.ts                          # id / platforms / minIOS=16.0 invariants
├── mood-store.test.ts                        # push / list / clear / ordering / cap / error tolerance
├── event-log.test.ts                         # Reducer ring-buffer correctness (cap 10)
├── screen.test.tsx                           # iOS: composition (no banner; self-test + log + Shortcuts)
├── screen.android.test.tsx                   # Android: banner shown; JS Mood Logger + Greet + History
├── screen.web.test.tsx                       # Web: same as android
└── components/
    ├── MoodLogger.test.tsx                   # Mood picker default = neutral; Log writes to mock store
    ├── MoodHistory.test.tsx                  # Renders entries newest-first; respects limit=20
    ├── IntentEventLog.test.tsx               # Renders entries newest-first; cap 10; failure styling
    ├── GreetForm.test.tsx                    # Disabled on empty/whitespace; emits trimmed name
    └── ShortcutsGuideCard.test.tsx           # Linking.openURL('shortcuts://'); error path

test/unit/native/
└── app-intents.test.ts                       # Non-iOS throws AppIntentsNotSupported;
                                              # iOS path delegates to mocked native module

test/unit/plugins/with-app-intents/
└── index.test.ts                             # Adds Swift files to main target;
                                              # idempotent across two runs;
                                              # leaves live-activity state untouched
```

**Structure Decision**: Mirrors the per-module manifest pattern of
`src/modules/swift-charts-lab/` (feature 012) and
`src/modules/sf-symbols-lab/` (feature 008). Like
`live-activity-demo` (feature 007), this module is **bridge-style**
— the iOS-only symbol lives behind `requireOptionalNativeModule`
in `src/native/app-intents.ts` and the screen variants gate on
`bridge.isAvailable()`. Unlike `swift-charts-lab` (012), the
platform-split surface is **the screen itself** rather than a
single `ChartView` seam, because the iOS and fallback paths render
materially different control inventories (self-test panel + event
log + Shortcuts card on iOS; banner + JS Mood Logger + Greet form
on the fallback). The Mood History list and the underlying mood
store are shared verbatim across all three variants — the screen
variants compose the same `<MoodHistory />` component reading from
the same `mood-store.ts`. The `with-app-intents` config plugin
follows the file-layout convention of `plugins/with-live-activity/`
(a TS entry point + one or more `with*.ts` mod files + a
`package.json` whose `main` points at `index.ts`). The Swift
sources live under `native/ios/app-intents/` (the user-specified
location) — distinct from `with-live-activity`'s `ios-widget/`
directory at the repo root, ensuring file-path disjointness in
addition to Xcode-project-region disjointness.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
