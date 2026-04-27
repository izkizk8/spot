# Phase 0 Research: Live Activities + Dynamic Island Showcase

This document records the architectural decisions for the feature, the
rationale for each, and the alternatives considered. All `NEEDS
CLARIFICATION` items from the plan template are resolved here, plus the
mandatory Validate-Before-Spec proof-of-concept (R6) per constitution
v1.1.0 §Development Workflow.

## R1. ActivityKit usage shape

- **Decision**: Use Apple's `ActivityKit` directly via Swift in the Widget
  Extension. Declare one `ActivityAttributes` type
  (`LiveActivityDemoAttributes`) with a static `name: String` and a nested
  `ContentState` carrying `counter: Int`. Compute `progress: Double` as a
  derived view-side property (`min(1.0, Double(counter) / 10.0)`) so the
  payload stays minimal and the renderer is the single source of truth for
  progress visuals. Use `ActivityConfiguration` to declare the Lock Screen
  view *and* the three Dynamic Island regions (compact leading, compact
  trailing, expanded, minimal) in the same SwiftUI declaration. All
  updates are local: call `Activity.request(attributes:contentState:)` to
  start, `activity.update(using:)` to update, and `activity.end(dismissalPolicy:)`
  to end.
- **Rationale**: This is the canonical, documented shape for a Live
  Activity that targets both Lock Screen and Dynamic Island in iOS 16.1+.
  Keeping `ContentState` minimal (just `counter`) reduces serialisation
  cost on each update (FR-011's 500 ms budget) and avoids redundant state.
  Local updates are explicitly required by FR-013 (no APNs).
- **Alternatives considered**:
  - Putting `progress` in `ContentState` directly — wastes bytes on every
    update for a value that is a pure function of `counter`. Rejected.
  - Two separate `ActivityAttributes` types (one for Lock Screen, one for
    DI) — `ActivityKit` does not support this; a single `ActivityAttributes`
    plus a single `ActivityConfiguration` is the documented shape.
  - APNs-driven updates — explicitly out of scope per FR-013 and the
    spec's *Assumptions* section.

## R2. JS↔native module: custom vs. third-party

- **Decision**: Write a minimal custom Expo Modules API native module
  (`LiveActivityDemoModule.swift`) that exposes three Swift-side functions
  — `startActivity(name:initialCounter:)`, `updateActivity(counter:)`,
  `endActivity()` — plus an `isAvailable()` synchronous accessor.
  JavaScript reaches it via `requireNativeModule('LiveActivityDemo')` from
  `expo-modules-core`. The native module is added to autolinking by the
  config plugin's pbxproj edits (it lives inside the Widget Extension's
  surrounding app-side group, not inside the extension itself — see R4).
- **Rationale** (called out explicitly in user input): Keeps the showcase
  self-contained and educational — every line of native ↔ JS plumbing is
  in this repo and reviewable. Avoids a transitive dependency on a third-
  party package whose maintenance, license, and API stability we do not
  control. The Expo Modules API is the project-canonical native-module
  surface (already in scope via `expo-modules-core` transitively shipped
  with `expo`); no new runtime dep is introduced.
- **Alternatives considered**:
  - `expo-live-activity` (community package) — adds a runtime dep we do
    not need, hides the bridge inside another repo, and gives us nothing
    educational. Rejected per user directive.
  - Bridging via React Native's old `NativeModules` system — deprecated in
    favour of the Expo Modules API for new code in this stack.
  - Pure-JS shim with no native side — impossible: `ActivityKit` is
    Swift-only.

## R3. JS bridge file split

- **Decision**: Split the bridge by file suffix into three files plus a
  shared types module:
  - `src/native/live-activity.types.ts` — `LiveActivityState`,
    `LiveActivityBridge` interface, `LiveActivityNotSupportedError`,
    `LiveActivityAuthorisationError`.
  - `src/native/live-activity.ts` — iOS implementation. Imports
    `requireNativeModule` from `expo-modules-core`, narrows to the typed
    bridge, exposes `isAvailable()` (returns `true` if iOS ≥ 16.1 *and*
    the native module resolves), `start`, `update`, `end`. Catches the
    documented `ActivityAuthorizationError` and re-throws as
    `LiveActivityAuthorisationError` (FR-019).
  - `src/native/live-activity.android.ts` — stub. `isAvailable()` →
    `false`. `start` / `update` / `end` reject with
    `LiveActivityNotSupportedError`. Importing this module MUST NOT touch
    `requireNativeModule` (FR-018).
  - `src/native/live-activity.web.ts` — same stub semantics as `.android.ts`.
- **Rationale**: Constitution III mandates file splitting for non-trivial
  platform divergence, and the divergence here (iOS calls a native module,
  the others throw on import) is exactly that. The Metro bundler resolves
  `live-activity.android.ts` on Android and `live-activity.web.ts` on web
  automatically; the iOS bundler picks `live-activity.ts`. Importing the
  bridge from `screen.tsx` is therefore safe on every platform — no
  `requireNativeModule` call is ever evaluated off-iOS.
- **Alternatives considered**:
  - One file with `Platform.OS === 'ios'` early-return — would still need
    to *import* `requireNativeModule` at the top of the file, which is
    safe in practice but loses the constitution III file-splitting
    guarantee. Rejected for principle.
  - Lazy `await import('expo-modules-core')` inside `isAvailable()` — adds
    asynchronicity to a synchronous-feeling API, and Metro static analysis
    handles `.ios.ts` / `.android.ts` / `.web.ts` cleanly. Rejected.

## R4. Config plugin shape

- **Decision**: A local config plugin at `plugins/with-live-activity/`
  exporting a default `ConfigPlugin` from `index.ts`. It uses
  `@expo/config-plugins`' helpers:
  - `withInfoPlist(config, …)` to set `NSSupportsLiveActivities = true`
    in the *main app's* `Info.plist` (FR-021) — idempotent because the
    helper sets a key by name, not by appending.
  - `withXcodeProject(config, …)` to (a) add the
    `LiveActivityDemoWidget.appex` Widget Extension target if it is not
    already present, (b) reference the Swift sources from `ios-widget/`,
    (c) add the iOS 16.1 deployment target on the new target only, (d)
    embed the appex into the main app's Embed App Extensions phase. The
    "if not already present" check is keyed on the target's product
    reference name (`LiveActivityDemoWidget`) and on each Swift file's
    path, which is what makes the plugin idempotent (FR-022 / SC-008).
  - The `LiveActivityDemoModule.swift` (Expo native module) lives in the
    *main app target's* sources, not inside the extension, because the JS
    bridge runs in the app process; only the SwiftUI view code and the
    `ActivityAttributes` declaration go into the extension. The
    `ActivityAttributes` Swift file is shared by symbolic file reference
    so both targets see the same source of truth.
- **Rationale**: `@expo/config-plugins` is the canonical Expo-supported
  way to mutate the prebuild output; using its helpers (rather than
  hand-editing `pbxproj` strings) gives us idempotency for free on the
  Info.plist side and a structured AST on the pbxproj side. Splitting
  the plugin into `add-widget-extension.ts` + `set-info-plist.ts` keeps
  each unit testable with a fixture project.
- **Alternatives considered**:
  - Manually editing `ios/` after `expo prebuild` — not idempotent, lost
    on every clean prebuild, violates FR-022.
  - A bare-workflow `ios/` directory checked in — abandons Expo prebuild
    and breaks the existing project model. Rejected.
  - Putting the Expo Modules API native module inside the extension — the
    extension runs in a different process and cannot service JS bridge
    calls from the app. Rejected by ActivityKit's process model.

## R5. Test strategy

- **Decision**: Three JS-side test files under `test/unit/`:
  1. `modules/live-activity-demo/screen.test.tsx` — mocks the bridge
     module (via `jest.mock('@/native/live-activity', …)`), asserts that
     Start calls `bridge.start({ name, initialCounter: 0 })`, that
     subsequent Update calls `bridge.update({ counter: prev + 1 })`, that
     End calls `bridge.end()`, that the status text reflects the
     "running" / "not running" / "iOS 16.1+ required" branches, and that
     button enable/disable matches FR-008. Includes a non-iOS render path
     that asserts the "iOS 16.1+ required" notice is shown when
     `bridge.isAvailable()` returns `false`.
  2. `native/live-activity.test.ts` — bridge contract tests. Verifies the
     exported surface of the iOS file, the `.android.ts` and `.web.ts`
     stubs throw `LiveActivityNotSupportedError` from `start`/`update`/
     `end`, and `isAvailable()` returns `false` on the stubs. TS-side
     compile checks (no `any`) are enforced by `pnpm typecheck` (FR-017).
  3. `plugins/with-live-activity/index.test.ts` — applies the plugin to
     a fixture `ExpoConfig`, asserts:
     - `ios.infoPlist.NSSupportsLiveActivities === true` after one apply,
     - applying twice yields the *same* config (deep equality on
       `ios.infoPlist` and on the recorded `mods.ios` calls),
     - the Widget Extension target name `LiveActivityDemoWidget` is
       registered in `mods.ios` exactly once even after two applies.
- **Swift code**: explicitly NOT unit-tested in this environment. The
  repo has no `xcodebuild test` step, no Swift test target, and adding
  one would dwarf the feature it would test. The constitution V exemption
  for "config / native scaffolding without an applicable test framework"
  applies. Manual verification matrix is shipped in `quickstart.md`
  covering Stories 1–4 (the verification matrix is the test of record
  for the Swift side).
- **Rationale**: Three small, focused test files mirror the three
  changeable units of JS code. The bridge tests assert the contract that
  guards the constitution III split; the screen tests assert the user-
  visible behaviour from Stories 1–4; the plugin tests assert the
  idempotency invariant that SC-008 measures. Mocking the bridge from
  the screen test keeps the screen test pure and platform-agnostic.

## R6. Validate-Before-Spec POC build (constitution v1.1.0 mandate)

- **Decision**: Before tasks are generated (`/speckit.tasks`), the
  implementer MUST run, on a scratch worktree:

  ```sh
  pnpm install
  npx expo install @expo/config-plugins
  # Scaffold plugins/with-live-activity/ with just the Info.plist mod.
  # Add it to app.json under expo.plugins.
  pnpm exec expo prebuild --clean --platform ios
  ```

  And verify:
  1. `ios/spot/Info.plist` contains `<key>NSSupportsLiveActivities</key><true/>`.
  2. `ios/spot.xcodeproj/project.pbxproj` opens cleanly in Xcode.
  3. A second `pnpm exec expo prebuild --clean --platform ios` produces
     identical output (`git diff --stat ios/` empty).

  If any check fails, back-patch the spec per the workflow rule before
  proceeding to tasks. The full Widget Extension wiring (R4) is then
  layered on top with the same idempotency rule.
- **Rationale**: This feature ships infrastructure (a config plugin that
  mutates prebuild output and a new Xcode target) and therefore qualifies
  as a Validate-Before-Spec target per the constitution. The POC is
  cheap (one prebuild run) and de-risks the highest-uncertainty piece of
  the plan (the pbxproj target injection). The third check is the one
  that proves SC-008 *before* the spec is finalised.
- **Alternatives considered**:
  - Skipping the POC and validating during `/speckit.implement` — the
    constitution explicitly forbids this for build-pipeline features
    after the lessons of feature 004.
  - Validating only the Info.plist mutation — insufficient: the highest
    risk is the pbxproj target injection, which the Info.plist-only POC
    does not exercise. The R6 procedure therefore lays Info.plist first
    (cheap, fully covered by `@expo/config-plugins` helpers) and stages
    the pbxproj injection as a follow-on POC.

## R7. Dependency policy

- **Decision**: All new npm packages are added with `npx expo install`,
  not raw `pnpm add`, so that Expo's version-compatibility table picks
  the version aligned with SDK 55. The only new dep is
  `@expo/config-plugins` (devDependency), needed by
  `plugins/with-live-activity/`.
- **Rationale**: Project convention (constitution Technology Constraints
  + 006 quickstart) and user input. `npx expo install` writes the same
  `package.json` entry as `pnpm add` but resolves to a version known to
  work with Expo SDK 55, avoiding the build failures that motivated the
  v1.1.0 Validate-Before-Spec amendment.
