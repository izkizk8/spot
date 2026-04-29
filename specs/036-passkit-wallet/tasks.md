---
description: "Task list for feature 036 — PassKit / Wallet (Add Pass) Module"
---

# Tasks: PassKit / Wallet (Add Pass) Module (036)

**Input**: Design documents from `/specs/036-passkit-wallet/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch parent**: `035-core-bluetooth`

**Tests**: REQUIRED. Per plan §"Test-First for New Features" and Constitution V
(v1.1.0), every JS-pure surface ships with tests authored before
implementation (TDD-first, RED → GREEN → REFACTOR). The single Swift
source `native/ios/passkit/PassKitBridge.swift` is reviewed and compiled
on macOS / EAS Build but is **not** unit-tested on Windows; on-device
verification belongs to `quickstart.md`.

**Organization**: Tasks are grouped by **technical layer** in dependency
order (scaffold → plugin package.json → foundational types & error
classes → JS bridge (test, then web/Android stubs, then iOS impl) →
pass-types catalog → hook → components (RED then GREEN) → screens (RED
then GREEN) → manifest → registry → Swift bridge → config plugin →
app.json wiring → final integration). Each pair follows a strict
RED → GREEN cadence: test files are added first, then the matching
implementation. User-story labels are attached to every story-bound
task for traceability:

- **[US1]** = User Story 1 — P1 MVP — browse the showcase without a
  Pass Type ID (educational scaffold; "Pass signing required" inline
  status; capabilities + my-passes list always render).
- **[US2]** = User Story 2 — P2 — signed happy path (real
  `PKAddPassesViewController` presentation; pass enumeration; Open in
  Wallet on iOS 13.4+).
- **[US3]** = User Story 3 — P2 — cross-platform graceful degradation
  (Android & Web render the five-card shell with disabled controls and
  an `IOSOnlyBanner`).

**Constitution & FR compliance** (encoded in every task):

- NO `eslint-disable` directives anywhere in added or modified code
  (FR-029, user-stipulated).
- Native bridges mocked **at the import boundary** via
  `jest.mock('src/native/passkit')` (FR-027). The bridge is the only
  surface that imports `requireNativeModule('PassKitBridge')`.
- `with-passkit` plugin is idempotent (P5/SC-006), preserves any
  operator-supplied `com.apple.developer.pass-type-identifiers` value
  (P3), and coexists with all 22 prior plugins (P6/SC-007).
- `screen.web.tsx` MUST NOT import `src/native/passkit.ts` at module
  evaluation time (carryover from 030–035 SC-007 discipline).
- `StyleSheet.create()` only (Constitution IV); `ThemedView` /
  `ThemedText` + `Spacing` tokens (Constitution II); `.android.tsx` /
  `.web.tsx` / `.android.ts` / `.web.ts` splits (Constitution III).
- Strictly additive: `src/modules/registry.ts` +1 (30 → 31 modules);
  `app.json` `expo.plugins` +1 (22 → 23 plugins); zero new runtime JS
  dependencies; zero edits to prior modules / plugins / native sources.
- No signed `.pkpass` checked in (FR-006). Placeholder entitlement
  shipped via `with-passkit` (FR-019).
- All five typed error classes (`PassKitNotSupported`,
  `PassKitOpenUnsupported`, `PassKitDownloadFailed`,
  `PassKitInvalidPass`, `PassKitCancelled`) are exported once from
  `src/native/passkit.types.ts` so `instanceof` round-trips across the
  three platform variants (B7).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on
  incomplete tasks).
- **[Story]**: `[US1]`, `[US2]`, or `[US3]` — present only on
  story-bound tasks. Setup / foundational / bridge / hook / manifest /
  registry / plugin / app.json / polish phases carry no story label.
- All paths are absolute from repository root.
- Contract IDs (`B1`–`B9`, `M1`–`M7`, `P1`–`P8`, `H1`–`H10`) are cited
  inline so every assertion traces back to a contract invariant.

---

## Phase 1: Setup, scaffold & plugin package

**Purpose**: Create the directory skeleton and the `with-passkit`
plugin's `package.json`. No tests in this phase (pure scaffolding;
exercised transitively by every later test). No new runtime JS deps.

- [X] T001 Create directory scaffolding:
  `src/modules/passkit-lab/{components,hooks}/`,
  `src/native/` (already exists — no-op if present),
  `native/ios/passkit/`,
  `plugins/with-passkit/`,
  `test/unit/modules/passkit-lab/{components,hooks}/`,
  `test/unit/native/`,
  `test/unit/plugins/with-passkit/`.
  - Acceptance: every directory above exists; no source files added yet.
- [X] T002 [P] Create `plugins/with-passkit/package.json` matching the
  shape used by `plugins/with-bluetooth/package.json` and
  `plugins/with-arkit/package.json`: `name: 'with-passkit'`,
  `version: '1.0.0'`, `main: 'index.ts'`, NO `dependencies` array entry
  (config plugins resolve `@expo/config-plugins` from the host package).
  Satisfies contract **P8**.
  - Acceptance: file parses as valid JSON;
    `node -e "require('./plugins/with-passkit/package.json')"` succeeds.

---

## Phase 2: Foundational types & error classes

**Purpose**: Establish the typed JS bridge surface (`PassKitBridge`),
the `PassMetadata` / `PassCategory` / `Capabilities` types, and the
five typed error classes that every later test/impl imports. Single
class identity per contract **B7** so `instanceof` round-trips across
the three platform variants. The native module name string
`'PassKitBridge'` is exported `as const` and verified to not collide
with any of the prior native modules (`AppIntents`, `WidgetCenter`,
`FocusFilters`, `BackgroundTasks`, `Spotlight`, `QuickLook`,
`ShareSheet`, `ARKitBridge`, `BleCentralBridge`).

- [X] T003 Author `src/native/passkit.types.ts` per
  `contracts/passkit-bridge.md`: declares the `PassKitBridge` interface
  (6 methods: `canAddPasses`, `isPassLibraryAvailable`, `passes`,
  `addPassFromBytes`, `addPassFromURL`, `openPass`); `PassMetadata`
  type (`{ passTypeIdentifier, serialNumber, organizationName,
  localizedDescription, passType }`); `PassCategory` union
  (`'boardingPass' | 'coupon' | 'eventTicket' | 'generic' |
  'storeCard'`); `Capabilities` type
  (`{ isPassLibraryAvailable: boolean; canAddPasses: boolean }`); the
  five typed error classes (`PassKitNotSupported`,
  `PassKitOpenUnsupported`, `PassKitDownloadFailed`,
  `PassKitInvalidPass`, `PassKitCancelled`); and exports
  `NATIVE_MODULE_NAME = 'PassKitBridge' as const`. Satisfies contracts
  **B1**, **B7**.
  - Acceptance: `pnpm typecheck` passes; every later test/impl imports
    from this file; the module-name string is `'PassKitBridge'`
    (verified to not collide with any prior native module).

---

## Phase 3: JS bridge (cross-platform) — RED → GREEN

**Purpose**: The single typed entry point all UI consumes. The bridge
is the **only file** that imports
`requireNativeModule('PassKitBridge')` (mocked at the import boundary
in tests — FR-027). Tests come first; then web / Android stubs (so the
non-supported path is locked down), then iOS.

### Bridge tests (RED)

- [X] T004 Author `test/unit/native/passkit.test.ts` covering
  `contracts/passkit-bridge.md` invariants on **all three platforms**:
  - **iOS** (**B2**): every method delegates to a mocked
    `PassKitBridge` native module (mocked via
    `jest.mock('expo-modules-core', () => ({ requireNativeModule: ...
    }))` at the import boundary); serialisation invariant (**B3**) —
    two back-to-back `addPassFromURL()` calls produce two native
    invocations in submission order, even when the first rejects;
    `passes()` resolves with an empty array when the native module
    returns `[]` (**B8**); `passType` field is normalised from raw
    native string to the `PassCategory` union.
  - **Android & Web stubs** (**B4**): every async method on
    `passkit.android.ts` / `passkit.web.ts` rejects with
    `PassKitNotSupported`; `canAddPasses()` and
    `isPassLibraryAvailable()` resolve to `false` (so the screen can
    render disabled controls without throwing at module-evaluation
    time); the stubs do NOT import `expo-modules-core`'s
    `requireNativeModule` machinery.
  - **`openPass` short-circuit** (**B5**): on the iOS path, when
    `Platform.constants.osVersion` parses to < 13.4, `openPass()`
    rejects synchronously with `PassKitOpenUnsupported` WITHOUT
    invoking the native module; on iOS ≥ 13.4 the call is forwarded.
  - **Cross-platform error identity** (**B7**): each typed error class
    round-trips `instanceof` across the three platform files (single
    class identity from `passkit.types.ts`).
  - **Bridge emits no events** (**B9**): the bridge module exports no
    `EventEmitter`, no `addListener`, no subscription helper.
  - **Web no-eager-import (SC-007)**: `jest.isolateModules` +
    `jest.doMock('src/native/passkit.ts', () => { throw … })` asserts
    the web bundle does NOT pull in the iOS bridge at module
    evaluation time.
  - Acceptance: test fails (RED) before T005 / T006 / T007 land; each
    `it` block names the exact bridge entry point under test and the
    contract invariant (`B1`–`B9`) it exercises.

### Bridge implementations (GREEN) — three platforms in parallel

- [X] T005 [P] [US3] Implement `src/native/passkit.web.ts` per **B4**:
  every async method rejects with `PassKitNotSupported`;
  `canAddPasses()` and `isPassLibraryAvailable()` resolve to `false`;
  re-exports the five typed error classes from `passkit.types.ts`; MUST
  NOT import `src/native/passkit.ts`.
  - Acceptance: T004 Web branch passes (GREEN); no `eslint-disable`.
- [X] T006 [P] [US3] Implement `src/native/passkit.android.ts` per
  **B4**: identical shape to `passkit.web.ts`; every async method
  rejects with `PassKitNotSupported`; capability methods resolve to
  `false`; re-exports the five typed error classes.
  - Acceptance: T004 Android branch passes (GREEN); no `eslint-disable`.
- [X] T007 Implement `src/native/passkit.ts` (iOS) per **B1**, **B2**,
  **B3**, **B5**, **B6**, **B8**, **B9**: imports
  `requireNativeModule('PassKitBridge')` exactly once; closure-scoped
  `enqueue` promise chain wrapping every mutating method (R-A); typed
  surface forwards arguments verbatim; `passType` normalisation in
  `passes()`; synchronous `openPass` short-circuit on iOS < 13.4 via
  `Platform.constants.osVersion` parse; re-exports the five typed
  error classes from `passkit.types.ts`. The file is the **only**
  import-boundary site for `expo-modules-core`'s
  `requireNativeModule`.
  - Acceptance: T004 iOS branch passes (GREEN); no `eslint-disable`.

---

## Phase 4: Pass-types catalog — RED → GREEN

**Purpose**: The five-entry `PassCategory` catalog with user-facing
labels, consumed by `PassRow` and exhaustively tested.

- [X] T008 [US2] Author
  `test/unit/modules/passkit-lab/pass-types.test.ts`: catalog has
  exactly 5 entries (`boardingPass`, `coupon`, `eventTicket`,
  `generic`, `storeCard`); keys are unique; each label is a non-empty
  string; the `PassCategory` union is exhaustive over the catalog
  (`Object.keys(catalog)` deep-equals the union members); catalog is
  `Object.freeze`d.
  - Acceptance: test fails (RED) before T009 lands.
- [X] T009 [US2] Implement `src/modules/passkit-lab/pass-types.ts`:
  exports `PassMetadata` type (re-export from `passkit.types.ts` for
  ergonomic in-module imports), the frozen `PassCategory` catalog
  (5 entries, user-facing label per category), and a helper
  `getPassCategoryLabel(category): string` consumed by `PassRow`.
  - Acceptance: T008 passes (GREEN); pure functional; no I/O.

---

## Phase 5: `usePassKit` hook — RED → GREEN

**Purpose**: The single state surface the screens consume (**H1**).
Reducer-serialised mutations; classifies bridge errors per R-D /
**H7**; on unmount cancels any in-flight URL fetch's result handler so
no `setState` fires post-unmount (**H9** / FR-024). The hook detects
the placeholder entitlement (**H10**) so the screen can decide whether
to render `EntitlementBanner`.

- [X] T010 [US1] Author
  `test/unit/modules/passkit-lab/hooks/usePassKit.test.tsx` per
  `contracts/usePassKit-hook.md`:
  - **Default state on mount** (**H2**): `capabilities` =
    `{ isPassLibraryAvailable: false, canAddPasses: false }`;
    `passes === []`; `inFlight === false`; `lastError === null`;
    `lastResult === null`.
  - **Mount calls `refresh()` exactly once** (**H3**): mocked bridge
    `canAddPasses()`, `isPassLibraryAvailable()`, and `passes()` are
    each invoked once after first render; second render does not
    re-invoke them.
  - **`refresh()` shape** (**H4**): updates `capabilities` and `passes`
    atomically from a single dispatch; clears `lastError`; sets
    `inFlight` to `true` while the three bridge calls are pending and
    back to `false` after they all resolve.
  - **`addFromBytes(base64)` happy path** (**H5**): bridge
    `addPassFromBytes` is invoked with the supplied string; on
    `{ added: true }` resolution, `lastResult` is set and `lastError`
    cleared (**H8**); on `{ added: false }` (user cancel), `lastError`
    is `PassKitCancelled`-classified per R-D / **H7**.
  - **`addFromURL(url)` happy path** (**H5**): bridge
    `addPassFromURL` is invoked; serialisation invariant — two rapid
    calls run in submission order (delegated to bridge via R-A).
  - **`openPass()` short-circuit on iOS < 13.4** (**H6**): hook
    rejects synchronously with `PassKitOpenUnsupported`; mocked bridge
    `openPass` is NOT invoked.
  - **Error classification (R-D / H7)**: `PassKitNotSupported` →
    caption "PassKit not supported on this platform";
    `PassKitOpenUnsupported` → "Open in Wallet requires iOS 13.4+";
    `PassKitDownloadFailed` → "Download failed";
    `PassKitInvalidPass` → "Pass invalid or unsigned";
    `PassKitCancelled` → "Cancelled"; any other `Error` →
    `'failed'` with the message.
  - **`lastError` / `lastResult` mutual exclusion** (**H8**): setting
    one clears the other.
  - **Hook returns stable identities** (**H9**): `refresh`,
    `addFromBytes`, `addFromURL`, `openPass` action functions have
    referentially stable identities across renders (safe to use in
    `useEffect` dep arrays).
  - **Unmount safety** (**H9** / FR-024): `unmount()` during an
    in-flight `addFromURL` produces ZERO post-unmount `setState` calls
    (asserted via a `mounted` ref check); advancing 5 s of fake
    timers post-unmount triggers no further dispatches.
  - **Placeholder-entitlement detection** (**H10**): when the env /
    config indicates the placeholder Pass Type ID is present, the
    hook returns `entitlementStatus.isPlaceholder === true`; when a
    real Pass Type ID has been substituted, the flag flips to `false`.
  - Acceptance: test fails (RED) before T011 lands; uses
    `jest.mock('src/native/passkit')` at the import boundary
    (FR-027); zero post-unmount setState warnings.
- [X] T011 [US1] Implement
  `src/modules/passkit-lab/hooks/usePassKit.ts` per **H1**–**H10**:
  single `useReducer` + `useCallback` action functions; `mounted` ref
  guarding every async resolution; `refresh()` runs the three
  capability/passes calls in parallel via `Promise.all`; mutating
  actions caught at the hook boundary and dispatched as classified
  `lastError` per R-D; `entitlementStatus.isPlaceholder` derived from
  the config-resolved entitlement value; imports the bridge from
  `src/native/passkit` (platform-resolved). The hook is the ONLY public
  surface consumed by component / screen variants.
  - Acceptance: T010 passes (GREEN); no `eslint-disable`.

---

## Phase 6: Components — RED (test files first, all parallelisable)

**Purpose**: Pure presentational + light-state components consumed by
the three screen variants. All eight components are introduced by this
feature (none reused from prior modules — `IOSOnlyBanner` is
intentionally re-authored under `passkit-lab/components/` with PassKit
copy; the prior 017 / 029–035 banner is left untouched).

- [X] T012 [P] [US1] Author
  `test/unit/modules/passkit-lab/components/CapabilitiesCard.test.tsx`:
  two status pills bind to `Capabilities.isPassLibraryAvailable` and
  `Capabilities.canAddPasses`; pill captions match boolean state
  ("Available" / "Unavailable", "Can add" / "Cannot add"); Refresh
  button calls `onRefresh` once per tap; renders without crash when
  capabilities are both `false`.
- [X] T013 [P] [US1] Author
  `test/unit/modules/passkit-lab/components/AddSamplePassCard.test.tsx`:
  without bundled sample (default repo state, FR-006): "Try with
  bundled (unsigned) sample" button surfaces inline status "Pass
  signing required — see quickstart.md" and does NOT call
  `addFromBytes`; with mocked sample bytes injected via prop:
  button calls `onAddFromBytes(base64)`; cancel rejection surfaces
  "Cancelled" in status; success surfaces "Pass added"; never crashes
  when `bundledSample === null`.
- [X] T014 [P] [US2] Author
  `test/unit/modules/passkit-lab/components/MyPassesList.test.tsx`:
  0 passes → renders empty-state row ("No passes yet"); N passes → N
  `PassRow` instances rendered in input order; per-card Refresh button
  calls `onRefresh` once; renders correctly with up to 20 rows
  (60 fps target — soft; assertion limited to no-crash + ordering).
- [X] T015 [P] [US2] Author
  `test/unit/modules/passkit-lab/components/PassRow.test.tsx`:
  renders all four metadata fields (`serialNumber`,
  `organizationName`, `localizedDescription`, `passType`); `passType`
  resolves to its category label via `getPassCategoryLabel` from
  `pass-types.ts`; "Open in Wallet" button calls
  `onOpen(passTypeIdentifier, serialNumber)` on iOS 13.4+; button is
  hidden or disabled (with explanatory tooltip) on iOS 13.0–13.3
  (R-E); button is hidden on Android / Web (component receives a
  `canOpen: boolean` prop).
- [X] T016 [P] [US2] Author
  `test/unit/modules/passkit-lab/components/AddFromUrlCard.test.tsx`:
  URL text input + "Fetch and add" button; on submit calls
  `onAddFromURL(url)` with the entered string; network failure
  surfaces "Download failed"; invalid-pass failure surfaces "Pass
  invalid or unsigned"; user cancel surfaces "Cancelled"; empty input
  disables the Fetch button; URL is trimmed before dispatch.
- [X] T017 [P] [US1] Author
  `test/unit/modules/passkit-lab/components/SetupGuideCard.test.tsx`:
  renders the documented step list (Pass Type ID registration,
  certificate generation, signpass-style packaging) with NO verbatim
  Apple copy; links resolve to `developer.apple.com` hosts; renders
  4–6 ordered steps in a list with stable a11y order.
- [X] T018 [P] [US1] Author
  `test/unit/modules/passkit-lab/components/EntitlementBanner.test.tsx`:
  visible when `entitlementStatus.isPlaceholder === true`; hidden when
  `false`; banner copy reads "Pass Type ID required" with a tappable
  link to `quickstart.md`; reuses theme tokens (no hardcoded hex).
- [X] T019 [P] [US3] Author
  `test/unit/modules/passkit-lab/components/IOSOnlyBanner.test.tsx`:
  renders the iOS-only message ("Wallet (PassKit) is iOS-only"); a11y
  label set; renders identically under Android and Web platform
  mocks (uses `Platform.OS` mock); reuses theme tokens.

---

## Phase 7: Components — GREEN (implementations, all parallelisable)

- [X] T020 [P] [US1] Implement
  `src/modules/passkit-lab/components/CapabilitiesCard.tsx`.
  Acceptance: T012 passes.
- [X] T021 [P] [US1] Implement
  `src/modules/passkit-lab/components/AddSamplePassCard.tsx`.
  Detects bundled-sample absence via prop (default `null` per
  FR-006); surfaces "Pass signing required" inline. Acceptance:
  T013 passes.
- [X] T022 [P] [US2] Implement
  `src/modules/passkit-lab/components/MyPassesList.tsx`. Renders
  empty-state row when `passes.length === 0`; else maps each
  `PassMetadata` to a `PassRow`. Acceptance: T014 passes.
- [X] T023 [P] [US2] Implement
  `src/modules/passkit-lab/components/PassRow.tsx`. Consumes
  `getPassCategoryLabel` from `pass-types.ts`; iOS-version gate on
  Open in Wallet button via `canOpen` prop. Acceptance: T015 passes.
- [X] T024 [P] [US2] Implement
  `src/modules/passkit-lab/components/AddFromUrlCard.tsx`. URL
  trimming; status-text region for failure copy. Acceptance: T016
  passes.
- [X] T025 [P] [US1] Implement
  `src/modules/passkit-lab/components/SetupGuideCard.tsx`. Step list
  with Apple developer links; no verbatim Apple copy. Acceptance:
  T017 passes.
- [X] T026 [P] [US1] Implement
  `src/modules/passkit-lab/components/EntitlementBanner.tsx`. Visible
  iff `entitlementStatus.isPlaceholder`; tappable link to
  `quickstart.md`. Acceptance: T018 passes.
- [X] T027 [P] [US3] Implement
  `src/modules/passkit-lab/components/IOSOnlyBanner.tsx`. Renders the
  iOS-only message; theme tokens only. Acceptance: T019 passes.

---

## Phase 8: Screens (3 platform variants) — RED → GREEN

**Purpose**: Compose the five cards in the fixed order from spec
§FR-004 (`EntitlementBanner` (conditional) → `CapabilitiesCard` →
`AddSamplePassCard` → `MyPassesList` → `AddFromUrlCard` →
`SetupGuideCard`); enforce that `screen.web.tsx` NEVER imports
`src/native/passkit.ts` at module evaluation time (SC-007).

### Screen tests (RED)

- [X] T028 [P] [US1] Author
  `test/unit/modules/passkit-lab/screen.test.tsx` (iOS): five cards
  render in fixed order (FR-004); `EntitlementBanner` visibility
  toggles on the placeholder-entitlement flag from `usePassKit`
  (**H10**); capability pills bind to bridge values via the hook;
  `AddSamplePassCard` surfaces "Pass signing required" when no bundle
  is present (US1 path); end-to-end happy path (capabilities →
  refresh → addFromURL → passes refresh) uses the hook (mocked) and
  renders the expected accessibility labels at each step. Also
  exercises **US2** acceptance scenarios 1–3 (signed happy path) when
  the mocked hook returns `{ added: true }` and a populated `passes`
  array.
- [X] T029 [P] [US3] Author
  `test/unit/modules/passkit-lab/screen.android.test.tsx`:
  `IOSOnlyBanner` is rendered at the top; the same five cards render
  beneath it with all interactive controls disabled; bridge methods
  are NEVER invoked at module evaluation time (asserted via spy on
  the mocked bridge import); the educational structure is preserved
  (FR-011).
- [X] T030 [P] [US3] Author
  `test/unit/modules/passkit-lab/screen.web.test.tsx`:
  `IOSOnlyBanner` rendered; controls disabled; statically asserts via
  `jest.isolateModules` + `jest.doMock('src/native/passkit.ts', () =>
  { throw new Error('eager-imported on web') })` that the web bundle
  does NOT pull in the iOS bridge at module evaluation time
  (SC-007).

### Screen implementations (GREEN)

- [X] T031 [US1] Implement `src/modules/passkit-lab/screen.tsx` (iOS
  variant): consumes `usePassKit`; renders the five cards in
  FR-004 order; conditional `EntitlementBanner` driven by
  `entitlementStatus.isPlaceholder`; wires component callbacks to
  hook actions. Also implements **US2** acceptance scenarios (signed
  flow rendering paths) — same file because iOS surface composes
  both stories. Acceptance: T028 passes.
- [X] T032 [P] [US3] Implement
  `src/modules/passkit-lab/screen.android.tsx`: top-mount
  `IOSOnlyBanner`; renders the five cards with controls disabled;
  imports the bridge only via the platform-resolved entry (so on
  Android the `.android.ts` stub is loaded). Acceptance: T029 passes.
- [X] T033 [P] [US3] Implement
  `src/modules/passkit-lab/screen.web.tsx`: identical structure to
  `screen.android.tsx`; MUST NOT import `src/native/passkit.ts`;
  imports only typed shapes from `src/native/passkit.types.ts` and
  the `.web.ts` stub via the platform-resolved entry. Acceptance:
  T030 passes — including the static-import assertion.

---

## Phase 9: Manifest — RED → GREEN

- [X] T034 Author `test/unit/modules/passkit-lab/manifest.test.ts` per
  `contracts/passkit-lab-manifest.md`: `id === 'passkit-lab'` (**M2**);
  `label === 'Wallet (PassKit)'` (**M3**); `platforms` deep-equals
  `['ios', 'android', 'web']` (**M4**); `minIOS === '6.0'` (**M5**);
  `screen` resolves at runtime to a renderable React component
  (**M6**); the manifest object shape matches every other 0xx module
  manifest (**M1**). Acceptance: test fails (RED) before T035.
- [X] T035 Implement `src/modules/passkit-lab/index.tsx`: exports the
  `ModuleManifest` matching the test (re-exports the iOS / Android /
  Web `screen` via the platform-resolved entry). Acceptance: T034
  passes (GREEN).

---

## Phase 10: Registry integration

- [X] T036 Modify `src/modules/registry.ts` (**M7**): +1 import line
  for `passkitLab` from `./passkit-lab`; +1 array entry appended after
  the 035 (`bluetoothLab`) entry; no other edits. Re-run the existing
  `test/unit/modules/registry.test.ts` (no new test needed — T034
  manifest test covers shape).
  - Acceptance: registry size grows by exactly 1 (30 → 31); existing
    registry test passes; ordering preserved; the new entry deep-equals
    the manifest exported by `src/modules/passkit-lab/index.tsx`.

---

## Phase 11: Native iOS Swift bridge (review-only on Windows)

**Purpose**: The single new Swift source authoring the
`PassKitBridge` ExpoModulesCore module. Compiled by EAS Build / Xcode
on macOS; not unit-tested on Windows. JS-side coverage is provided by
T004 against the mocked `PassKitBridge` identity.

- [X] T037 [US1] [US2] Author
  `native/ios/passkit/PassKitBridge.swift`: `Module` declaration with
  `Name("PassKitBridge")` (matches **B1**); six `AsyncFunction`
  entries — `canAddPasses`, `isPassLibraryAvailable`, `passes`,
  `addPassFromBytes`, `addPassFromURL`, `openPass`. All entry points
  wrapped in `do/catch`; typed exceptions via `expo-modules-core`'s
  `Exception` machinery mapped 1:1 to the five JS error classes
  (**B7**). `passes()` returns the `PKPassLibrary.passes()` array
  mapped to the `PassMetadata` shape; empty wallet returns `[]` per
  **B8**. `addPassFromBytes` and `addPassFromURL` resolve with
  `{ added: true }` only after the user approves
  `PKAddPassesViewController` (**B6**); user cancel resolves
  `{ added: false }`; URL fetch performed via `URLSession` natively
  per R-F. `openPass` is gated `@available(iOS 13.4, *)` and falls
  through to a `PassKitOpenUnsupported` exception on earlier OSes
  (**B5**). Presents `PKAddPassesViewController` from the key window's
  top-most presented controller. The bridge emits NO events (**B9**).
  - Acceptance: file compiles under Xcode 15+ on macOS (verified out
    of band per `quickstart.md` §3); no Windows-side unit test; JS
    contract coverage is owned by T004.

---

## Phase 12: Expo config plugin (`with-passkit`) — RED → GREEN

**Purpose**: `withEntitlementsPlist` + `withXcodeProject` mods that
(1) set `com.apple.developer.pass-type-identifiers` to the
placeholder array `['$(TeamIdentifierPrefix)pass.example.placeholder']`
ONLY when absent (**P2**), preserving any operator-supplied real Pass
Type IDs (**P3**); (2) link `PassKit.framework` to the main target
when not already linked (**P4**); idempotent (**P5**); coexists with
all 22 prior plugins (**P6**); does not touch foreign keys (**P7**).
JS-pure tests against `@expo/config-plugins`.

- [X] T038 Author `test/unit/plugins/with-passkit/index.test.ts` per
  `contracts/with-passkit-plugin.md`:
  - **P1 (export shape)**: default export is a `ConfigPlugin`
    function `(config) => config`.
  - **P2 (placeholder)**: empty config → after running the plugin,
    `ios.entitlements['com.apple.developer.pass-type-identifiers']`
    deep-equals `['$(TeamIdentifierPrefix)pass.example.placeholder']`.
  - **P3 (preserve)**: pre-populated array of one or more real Pass
    Type IDs is preserved verbatim; the plugin does NOT overwrite or
    append.
  - **P4 (framework)**: empty config → `PassKit.framework` is
    appended to the main target's frameworks build phase exactly once;
    pre-existing linkage is NOT duplicated.
  - **P5 (idempotency / SC-006)**: running the plugin twice on the
    same Expo config produces a deep-equal config (snapshot
    comparison); no array growth on the second pass; no key
    duplication.
  - **P6 (coexistence / SC-007)**: compose all 22 prior plugins
    (`with-live-activity`, `with-app-intents`, `with-home-widgets`,
    `with-screentime`, `with-coreml`, `with-vision`,
    `with-speech-recognition`, `with-audio-recording`,
    `with-sign-in-with-apple`, `with-local-auth`,
    `with-keychain-services`, `with-mapkit`, `with-core-location`,
    `with-rich-notifications`, `with-lock-widgets`,
    `with-standby-widget`, `with-focus-filters`,
    `with-background-tasks`, `with-spotlight`, `with-documents`,
    `with-arkit`, `with-bluetooth`) + `with-passkit` and assert that
    every entitlement / Info.plist key set by a prior plugin is
    byte-identical after `with-passkit` runs (uses the existing
    002–035 fixture composition pattern).
  - **P7 (no foreign-key writes)**: snapshot the entitlements dict
    pre-run minus `com.apple.developer.pass-type-identifiers`; assert
    deep-equal post-run (the plugin owns ONLY that one key + the
    framework linkage).
  - Acceptance: test fails (RED) before T039 lands.
- [X] T039 Implement `plugins/with-passkit/index.ts`: default-export
  `ConfigPlugin` per **P1**; composes
  `withEntitlementsPlist` (placeholder-only-when-absent per **P2** /
  **P3**) and `withXcodeProject` (framework linkage per **P4**) via
  `withPlugins`; both mods are idempotent (**P5**); resolves
  `@expo/config-plugins` from the host package (no plugin-side
  dependency per **P8**). JSDoc block documents the placeholder and
  the operator-side override path.
  - Acceptance: T038 passes (GREEN); no `eslint-disable`.
- [X] T040 [P] Author `plugins/with-passkit/index.test.ts` (co-located
  smoke test): imports `./index` and asserts the export shape
  (`typeof default === 'function'`) — per the precedent set by 035's
  co-located smoke test. Behavioural coverage lives in T038's
  `test/unit/plugins/with-passkit/index.test.ts`.
  - Acceptance: file runs under Jest with no behavioural duplication;
    fails fast if the default export shape regresses.

---

## Phase 13: `app.json` plugin entry

- [X] T041 Modify `app.json`: append the string
  `"./plugins/with-passkit"` to `expo.plugins`; no other edits.
  Order: appended last (after 035's `"./plugins/with-bluetooth"`).
  Strictly additive — `expo.plugins` length grows by exactly 1
  (22 → 23).
  - Acceptance: `app.json` parses as valid JSON; `expo.plugins` length
    grows by exactly 1; the new entry is the literal string
    `"./plugins/with-passkit"`; existing `app-json.test.ts` (if
    present) is extended in-place to assert the new entry rather than
    duplicated.

---

## Phase 14: Final integration & verification

- [X] T042 Run `pnpm format` from the repo root.
  - Acceptance: exits 0; no diff produced (no-op final commit per
    plan §"Constraints").
- [X] T043 Run `pnpm typecheck`.
  - Acceptance: exits 0; no type errors introduced; the five typed
    error classes are re-exported with stable identities from
    `passkit.types.ts`.
- [X] T044 Run `pnpm lint` (or `pnpm oxlint` — match the project's
  existing script name).
  - Acceptance: exits 0; ZERO `eslint-disable` directives anywhere in
    the diff (`git diff main -- src plugins native | rg
    'eslint-disable'` returns no matches — FR-029).
- [X] T045 Run `pnpm test` (Jest Expo).
  - Acceptance: exits 0; suite delta ≥ +14 vs the 035 closing
    baseline (manifest +1, screens +3, hook +1, components +8,
    pass-types +1, bridge +1, plugin +1; co-located plugin smoke
    counts within the plugin suite).
- [X] T046 Run `pnpm check` (composite: format + lint + typecheck +
  test) and create the final commit on branch `036-passkit-wallet`.
  - Acceptance: `pnpm check` exits 0;
    `git status --porcelain` is clean after the commit; the commit
    message references the feature number and the additive-only
    invariants (registry +1, app.json +1, zero new runtime JS deps,
    one new Swift file).
  - On-device quickstart (per `quickstart.md`) is documented but not
    gated in CI: verify on a real iOS 13.4+ device with a real Pass
    Type ID + signed `.pkpass` (US2 happy path), and on Android +
    web for the iOS-only banner (US3). Run `expo prebuild` and
    inspect the generated `ios/<app>/<App>.entitlements` for the
    placeholder `com.apple.developer.pass-type-identifiers` array
    (or the operator-supplied real value).

---

## Dependencies & Execution Order

### Phase dependencies

- **T001** (scaffold) blocks every later task (directories must exist).
- **T002** (plugin `package.json`) blocks T039 (plugin impl).
- **T003** (types) blocks T004–T039 (every later test/impl imports
  the shared types and module-name constant).
- **Bridge tests (T004)** precede bridge impls (T005 / T006 / T007) —
  TDD RED → GREEN.
- **Bridge impls (T005 / T006 / T007)** block T010 / T011 (hook
  imports the bridge) and T028–T033 (screens, indirectly via the
  hook).
- **Pass-types test (T008)** precedes pass-types impl (T009);
  pass-types blocks T015 / T023 (`PassRow` consumes the catalog).
- **Hook test (T010)** precedes T011; T011 blocks T028–T033.
- **Component tests (T012–T019)** precede component impls
  (T020–T027); no inter-component dependencies (each pair is
  independent — all eight pairs parallelisable).
- **Component impls (T020–T027)** block screen tests (T028–T030)
  only insofar as the screen tests render real components — if
  components are mocked in screen tests this is a soft dependency.
- **Screen tests (T028–T030)** precede screen impls (T031–T033).
- **Manifest (T034 / T035)** is independent of components; can run
  in parallel with Phases 6–8 once T003 is done.
- **Registry (T036)** requires T035 (manifest export must exist).
- **Swift bridge (T037)** is independent of every JS task; can be
  authored at any point after T003 (for the `PassKitBridge` module
  name) — soft dependency for traceability only, no JS test
  references the Swift file directly.
- **Plugin test (T038)** precedes plugin impl (T039); plugin
  co-located smoke (T040) can run in parallel with T039 once T002
  exists.
- **`app.json` (T041)** requires the plugin path to exist on disk
  (T039).
- **Final verification (T042–T046)** requires every preceding task
  green.

### Parallel opportunities

- **Phase 1**: T002 runs in parallel with T001 once the
  `plugins/with-passkit/` directory exists.
- **Phase 3 GREEN**: T005 / T006 / T007 are file-disjoint and can run
  in parallel after T004 lands.
- **Phase 6 RED**: all eight component tests T012–T019 are
  file-disjoint and parallelisable.
- **Phase 7 GREEN**: all eight component impls T020–T027 are
  file-disjoint and parallelisable.
- **Phase 8 RED**: T028 / T029 / T030 are file-disjoint.
- **Phase 8 GREEN**: T032 / T033 (Android / Web screens) are
  file-disjoint and parallelisable; T031 (iOS) lands first because
  it carries US1 + US2 surface composition.
- **Phase 11**: T037 (Swift) is fully parallel with all JS phases
  (different toolchain, different reviewer).
- **Phase 12**: T040 (co-located plugin smoke) runs in parallel with
  T039.
- Manifest pair (T034 / T035) is parallel with Phases 6–8 once T003
  is done.

### MVP-first execution path

The shortest path to a demoable MVP (User Story 1 — P1):

1. T001 → T002 → T003 (foundation).
2. T004 → T005 / T006 / T007 (bridge in parallel).
3. T008 → T009 (pass-types).
4. T010 → T011 (hook).
5. T012 / T013 / T017 / T018 (US1 component tests in parallel) →
   T020 / T021 / T025 / T026 (US1 component impls in parallel).
6. T019 → T027 (`IOSOnlyBanner` for US3 banner reuse on iOS-side
   conditional rendering — optional for strict US1, required for
   US3 visibility).
7. T028 → T031 (iOS screen tests + impl).
8. T034 → T035 → T036 (manifest + registry).
9. T037 (Swift bridge — required for on-device verification but
   NOT for JS-pure test green; can lag T046 in extreme MVP
   timelines, though plan §"Re-check after Phase 1" treats it as
   in-scope).
10. T038 → T039 → T040 → T041 (plugin + app.json).
11. T042 → T043 → T044 → T045 → T046.

Stop at T031 + T035 + T036 to demo US1 only; complete T014–T016 /
T022–T024 + T032 / T033 to add US2 + US3.

---

## Implementation Strategy

### MVP first (User Story 1 only — educational scaffold)

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 (US1
   subset) → Phase 7 (US1 subset) → Phase 8 (T028 + T031) → Phase 9
   → Phase 10 → Phase 12 → Phase 13 → Phase 14.
2. **STOP and VALIDATE**: build and run on any iOS 6+ device with the
   placeholder entitlement; verify Story 1 acceptance scenarios 1–5
   from spec.md.
3. Demo if ready.

### Incremental delivery

1. MVP (US1) → Test independently → Demo.
2. Add US2 (T014–T016, T022–T024, T037 Swift bridge required) →
   Test on a device with a Pass Type ID + signed `.pkpass` → Demo.
3. Add US3 (T029 / T030 / T032 / T033) → Test on Android + Web →
   Demo.

### Constraints summary

- Additive-only: `src/modules/registry.ts` +1 import + 1 array entry
  (T036); `app.json` `expo.plugins` +1 string (T041); zero edits
  elsewhere.
- Zero new runtime JS dependencies (verified at T045 — no
  `package.json` `dependencies` delta).
- One new Swift file: `native/ios/passkit/PassKitBridge.swift`
  (T037); JS layer is fully testable on Windows.
- Native bridges mocked at the import boundary (FR-027): all JS
  tests use `jest.mock('src/native/passkit')` or — for the bridge
  test itself — `jest.mock('expo-modules-core')`.
- No `eslint-disable` directives anywhere (FR-029); enforced at T044.
- No signed `.pkpass` checked in (FR-006); placeholder entitlement
  shipped via `with-passkit` (FR-019).
- Plugin idempotent + coexistent with all 22 prior plugins
  (T038 / **P5** / **P6**).

---

## Notes

- **[P]** tasks operate on disjoint files with no completion
  dependency on any incomplete sibling.
- **[Story]** label maps the task to spec.md user stories US1 / US2 /
  US3 for traceability; phases without a story label (Setup,
  Foundational, Bridge, Hook, Manifest, Registry, Plugin, app.json,
  Polish) span all stories.
- Contract IDs (B1–B9, M1–M7, P1–P8, H1–H10) cited inline so every
  assertion traces back to a contract invariant in
  `specs/036-passkit-wallet/contracts/`.
- TDD discipline: every test task is RED before its paired impl
  (verify with `pnpm test --watch=false` between the two).
- Commit cadence: one commit per RED → GREEN pair (or per Phase
  boundary where pairs are tight); final commit at T046 after
  `pnpm check` passes green.
- Educational-scaffold framing (the four-locations rule for the
  pass-signing reality check) is asserted by T013 + T018 + T028
  +T034 collectively — no single task owns it; the spec, the
  on-screen banner, the quickstart, and the Assumptions section
  remain consistent because each touch-point has its own test.
