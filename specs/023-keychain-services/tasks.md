---
description: "Actionable, dependency-ordered TDD task list for Keychain Services Lab (feature 023)"
---

# Tasks: Keychain Services Lab Module

**Input**: Design documents from `/specs/023-keychain-services/`
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/keychain-bridge.md`, `quickstart.md` (commit `fbd48a9`).

**Tests**: Strictly TDD per spec FR-023 / NFR-007 and constitution V
("Test-First"). For every implementation task, the matching test task
listed first MUST be written and observed RED before implementation.

**Organization**: Tasks are grouped by user story (US1–US5 from spec.md).
Foundations (types/enums → mock → store → hook → bridge) are in Phases 1–2
because every user story depends on them. Components, screens, manifest,
registry, plugin, and `app.json` integration are split across the
user-story phases that need them, with the final integration phase wiring
the registry + plugin entry + plugin coexistence test.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: `US1`–`US5` from spec.md; phases 1, 2, and final have no
  story label.
- File paths are absolute within the worktree
  `C:\Users\izkizk8\spot-023-keychain\` (relative below for readability).
- Each task references the spec requirement IDs / acceptance scenarios
  and the plan section it implements.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Land the empty module + native bridge directories and the
JS-pure global mock that every subsequent test will consume. No business
logic is added here.

- [ ] T001 Create the empty module directory tree
  `src/modules/keychain-lab/`,
  `src/modules/keychain-lab/components/`,
  `src/modules/keychain-lab/hooks/`,
  `src/native/`, `native/ios/keychain/`,
  `plugins/with-keychain-services/`,
  `test/unit/modules/keychain-lab/`,
  `test/unit/modules/keychain-lab/components/`,
  `test/unit/modules/keychain-lab/hooks/`,
  `test/unit/native/`,
  `test/unit/plugins/with-keychain-services/`.
  Implements plan.md §Architecture.
- [ ] T002 [P] Create `test/__mocks__/native-keychain.ts` — configurable
  in-memory keychain (label → `{ value, acc, biometry, accessGroup }`),
  recordable call history exposing the exact `kSecAttrAccessible*`
  constant per call, and per-call result injection
  (`ok | cancelled | auth-failed | missing-entitlement | not-found |
  unsupported | error`). Required by NFR-007, FR-023, SC-007 and used
  by every test below. Implements plan.md §Test stack.
- [ ] T003 [P] Wire the new `native-keychain` mock into `test/setup.ts`
  using the existing global-mock convention (021/022 pattern). NFR-007.
- [ ] T004 [P] Confirm the existing `test/__mocks__/expo-secure-store.ts`
  (021) is reused for the fallback path tests; add any missing recorder
  hooks needed by Phase 2 / Phase 6 tests (`requireAuthentication`,
  `keychainAccessible` capture). Implements plan.md §JS Bridge Contract
  resolution step 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Land the type system, accessibility-class registry, JS bridge
facade, store, and hook. Every user story depends on these — they MUST be
green before any component / screen task starts. TDD strictly applied:
each implementation task is preceded by its failing test.

**⚠️ CRITICAL**: No US1–US5 work can begin until this phase is complete.

### Types + accessibility-class registry

- [ ] T005 [P] Write
  `test/unit/modules/keychain-lab/accessibility-classes.test.ts` —
  asserts the five entries
  (`whenUnlocked | afterFirstUnlock | whenUnlockedThisDeviceOnly |
  afterFirstUnlockThisDeviceOnly | whenPasscodeSetThisDeviceOnly`),
  each maps to the correct `kSecAttrAccessible*` constant string,
  default is `whenUnlockedThisDeviceOnly`, descriptions are non-empty
  and mention lock-state / device-only / passcode-required behavior.
  Covers FR-009, US3-AS1, plan.md §Test Strategy bullet 1, D-03. RED.
- [ ] T006 Implement `src/modules/keychain-lab/accessibility-classes.ts`
  exporting `AccessibilityClass` union, the canonical ordered list with
  plain-language descriptions, the `kSecAttrAccessible*` mapping, and
  the default constant `DEFAULT_ACCESSIBILITY_CLASS =
  'whenUnlockedThisDeviceOnly'`. Make T005 GREEN. FR-009, plan.md
  §Architecture, §Technical Context state shapes.

### JS bridge (`src/native/keychain.ts`)

- [ ] T007 [P] Write `test/unit/native/keychain.test.ts` covering the
  full contract from `contracts/keychain-bridge.md`:
  (a) when `requireOptionalNativeModule('SpotKeychain')` returns the
      mock, every method (`addItem`, `getItem`, `updateItem`,
      `deleteItem`, `listLabels`, `tryAccessGroupProbe`) returns the
      injected `KeychainResult` shape and the recorder captured the
      exact `kSecAttrAccessible*` constant per call (SC-007);
  (b) when the native module is absent on iOS / Android, basic CRUD
      delegates to the `expo-secure-store` mock with
      `requireAuthentication` mapped from `biometryRequired` and
      `keychainAccessible` mapped from the picker's two supported
      classes; extended-only calls (`tryAccessGroupProbe`,
      `addItem` with `accessGroup` or with an ACL class outside
      `whenUnlocked | afterFirstUnlock`) resolve to
      `{ kind: 'unsupported' }`;
  (c) on Web every method resolves to `{ kind: 'unsupported' }` and
      the native module is never instantiated;
  (d) `errSecDuplicateItem` from the bridge is upgraded to an
      `updateItem` so the caller sees `{ kind: 'ok' }` (plan.md
      §JS Bridge Contract error table);
  (e) no method throws across the boundary in normal operation
      (NFR-005), and cancellation produces zero `console.warn`
      / `console.error` (NFR-006, SC-005).
  Covers FR-010, FR-012, FR-013. RED.
- [ ] T008 Implement `src/native/keychain.ts` — typed
  `KeychainBridge` facade, three-tier resolution
  (`requireOptionalNativeModule('SpotKeychain')` → `expo-secure-store`
  adapter on iOS/Android → universal `unsupported` stub on Web),
  `OSStatus → KeychainResult.kind` mapping per the table in plan.md
  §JS Bridge Contract, and the `errSecDuplicateItem → update` upgrade.
  Make T007 GREEN. FR-010, FR-012, FR-013, NFR-005, NFR-006.

### Store (`keychain-store.ts`)

- [ ] T009 [P] Write
  `test/unit/modules/keychain-lab/keychain-store.test.ts` — round-trip
  via the in-memory mock; metadata index
  (`spot.keychain.lab.index`, `whenUnlocked`, no biometry) is read on
  `list()` and mutated on `add` / `delete`; bridge throws are
  swallowed → `null` for read / no-op for write/delete + a single
  `console.warn`; cancellation produces zero warns/errors;
  `errSecDuplicateItem` becomes an upsert so the caller never sees a
  duplicate error; the index never carries the value field
  (NFR-004). Covers FR-007, FR-008, NFR-004, NFR-006. RED.
- [ ] T010 Implement `src/modules/keychain-lab/keychain-store.ts` — the
  single seam over `src/native/keychain.ts`; owns the JSON-encoded
  metadata index under the fixed key, exposes
  `list / add / get / delete / tryAccessGroupProbe`, and applies the
  tolerant-fallback policy (single `console.warn` per swallowed
  bridge throw; cancellation never warned). Make T009 GREEN.
  FR-007, FR-008, NFR-004, NFR-006, plan.md §Architecture.

### Hook (`useKeychainItems`)

- [ ] T011 [P] Write
  `test/unit/modules/keychain-lab/hooks/useKeychainItems.test.tsx` —
  initial mount loads items from the store; `addItem` updates the
  list and resolves with the typed `KeychainResult`; `revealItem`
  returns cleartext on `'ok'`, `null` on `'cancelled'` and on
  `'auth-failed'` (no warn for cancel — NFR-006); cleartext is
  **never** held in hook state (NFR-004); `deleteItem` removes the
  row and tolerates `'not-found'` (row dropped, no error state);
  `mountedRef` guards `setState` after unmount (021/022 pattern).
  Covers FR-006, NFR-004, NFR-006, plan.md §Hook Contract. RED.
- [ ] T012 Implement
  `src/modules/keychain-lab/hooks/useKeychainItems.ts` — exports the
  `UseKeychainItems` shape from plan.md §Hook Contract, calls
  `keychain-store` only, and never caches cleartext. Make T011 GREEN.
  FR-006, NFR-004, plan.md §Hook Contract.

**Checkpoint**: Foundation is ready — US1–US5 component / screen tasks
may now begin in parallel.

---

## Phase 3: User Story 1 — Inspect stored keychain items (P1) 🎯 MVP

**Goal**: A user opens the Keychain Lab card and sees an Items List that
either shows an empty-state placeholder or one row per stored item with
label, accessibility-class label, and a biometry badge — each row with
Show / Delete buttons.

**Independent Test**: Mount the screen — the Items List renders the
empty-state placeholder; after a single store insertion the list
re-renders with one row whose three columns are populated and whose
Show / Delete buttons fire the hook. Mirrors spec US1 Independent Test.

### Tests for US1 (write FIRST, observe RED)

- [ ] T013 [P] [US1] Write
  `test/unit/modules/keychain-lab/components/IOSOnlyBanner.test.tsx` —
  renders the per-module copy, mirrors the 021/022 pattern. Covers
  FR-019. RED.
- [ ] T014 [P] [US1] Write
  `test/unit/modules/keychain-lab/components/ItemRow.test.tsx` —
  renders label, accessibility-class label, biometry badge,
  device-only badge for `*ThisDeviceOnly` classes; Show toggles to
  Hide and reveals the value via the injected `revealItem`;
  `'cancelled'` and `'auth-failed'` paths render the inline
  informational message and keep the value hidden; Delete invokes
  the callback exactly once. Covers FR-015, US1-AS3, US1-AS4,
  US3-AS2, NFR-006. RED.
- [ ] T015 [P] [US1] Write
  `test/unit/modules/keychain-lab/components/ItemsList.test.tsx` —
  empty-state copy renders ("No keychain items yet — tap Add item
  to create one") with the Add item CTA enabled; with N metadata
  entries renders N `ItemRow`s. Covers FR-014, US1-AS1, US1-AS2.
  RED.

### Implementation for US1

- [ ] T016 [P] [US1] Implement
  `src/modules/keychain-lab/components/IOSOnlyBanner.tsx` (fresh,
  per-module — no shared `IOSOnlyBanner` exists; verified
  `src/modules/sign-in-with-apple/components/IOSOnlyBanner.tsx`,
  `src/modules/local-auth-lab/components/IOSOnlyBanner.tsx`,
  `src/modules/speech-recognition-lab/components/IOSOnlyBanner.tsx`,
  `src/modules/camera-vision/components/IOSOnlyBanner.tsx` are all
  module-local). Make T013 GREEN. FR-019, NFR-001.
- [ ] T017 [P] [US1] Implement
  `src/modules/keychain-lab/components/ItemRow.tsx` — label, class
  label, biometry badge, device-only badge, Show/Hide + Delete with
  inline reveal and tolerant `cancelled` / `auth-failed` rendering.
  Make T014 GREEN. FR-015, US1-AS3, US1-AS4, US3-AS2.
- [ ] T018 [US1] Implement
  `src/modules/keychain-lab/components/ItemsList.tsx` — empty-state
  + `ItemRow` per metadata entry + Add item CTA. Make T015 GREEN.
  Depends on T017. FR-014, US1-AS1, US1-AS2.

**Checkpoint**: US1 is independently testable — the Items List renders
empty-state and N-row variants and wires Show / Delete through the
hook seam.

---

## Phase 4: User Story 2 — Add a keychain item with explicit ACL + optional biometry (P1)

**Goal**: User taps Add item, fills label + value, picks an
accessibility class (default `whenUnlockedThisDeviceOnly`), optionally
toggles Biometry required, and taps Save. The item is written via the
bridge with the configured ACL and the Items List re-renders.

**Independent Test**: From the empty state, fill label `"demo"`, value
`"hello"`, default class, biometry off; tap Save; the form collapses,
the Items List shows one `"demo"` row with the chosen class label,
tapping Show reveals `"hello"`. Mirrors spec US2 Independent Test.

### Tests for US2

- [ ] T019 [P] [US2] Write
  `test/unit/modules/keychain-lab/components/AddItemForm.test.tsx` —
  Save disabled until both inputs filled and while in-flight save
  unresolved; default accessibility class is
  `whenUnlockedThisDeviceOnly`; biometry Switch toggles; Save invokes
  the callback with the typed `AddItemInput`; form resets on
  successful save (inputs cleared, picker reset, biometry off, list
  refetched). Covers FR-016, US2-AS1, US2-AS2, US2-AS3, US2-AS5. RED.

### Implementation for US2

- [ ] T020 [US2] Implement
  `src/modules/keychain-lab/components/AddItemForm.tsx` — label
  TextInput (required, trimmed), value TextInput (required,
  `secureTextEntry`), `AccessibilityPicker` slot, biometry `Switch`,
  Save button with the disabled rules above; on success surface the
  `KeychainResult` to the parent so US2-AS4 (`errSecDuplicateItem`
  → upsert) is observable through the typed `'ok'` result.
  Make T019 GREEN. Depends on T012 (hook) and T024 (picker
  contract — picker can be a placeholder import that T024 fills).
  FR-016, US2-AS1–AS5.

**Checkpoint**: US2 is independently testable — Save round-trips
through `useKeychainItems.addItem` with the correct typed payload.

---

## Phase 5: User Story 3 — Pick an accessibility class to compare lifecycle behavior (P2)

**Goal**: The picker exposes all five classes with plain-language
descriptions; default is `whenUnlockedThisDeviceOnly`; selecting
`whenPasscodeSetThisDeviceOnly` on a passcode-less device surfaces a
friendly inline error before Save.

**Independent Test**: Open the picker — five options render with
descriptions; select `whenPasscodeSetThisDeviceOnly`, inject a bridge
result of `{ kind: 'error', message: 'errSecParam' }` for the Save
attempt, assert the inline error copy appears and no item is written.
Mirrors spec US3-AS3.

### Tests for US3

- [ ] T021 [P] [US3] Write
  `test/unit/modules/keychain-lab/components/AccessibilityPicker.test.tsx`
  — renders all five classes with descriptions from
  `accessibility-classes.ts`; default selection is
  `whenUnlockedThisDeviceOnly`; selection updates via callback; on
  Android (`Platform.OS === 'android'`) the picker is rendered
  disabled with the documented one-line note. Covers FR-017,
  US3-AS1, US5-AS2. RED.

### Implementation for US3

- [ ] T022 [US3] Implement
  `src/modules/keychain-lab/components/AccessibilityPicker.tsx`
  consuming `accessibility-classes.ts`. Make T021 GREEN. FR-017,
  US3-AS1, US5-AS2.

**Checkpoint**: US3 is independently testable — picker renders five
classes with descriptions, default selection, and Android disabled
state.

---

## Phase 6: User Story 4 — Demonstrate keychain access groups (P2)

**Goal**: An `AccessGroupCard` explains keychain access groups, shows
the resolved access-group string, and offers a "Try shared keychain"
button that probes the access group; success surfaces the byte count,
missing entitlement surfaces the friendly copy and never throws.

**Independent Test**: Render the card with the bridge mocked to return
`{ kind: 'ok', value: { bytes: 27 } }` — the success message with byte
count appears. Re-render with `{ kind: 'missing-entitlement' }` — the
"needs entitlement" copy appears and zero `console.error` is observed.
Mirrors spec US4 Independent Test.

### Tests for US4

- [ ] T023 [P] [US4] Write
  `test/unit/modules/keychain-lab/components/AccessGroupCard.test.tsx`
  — explainer + resolved access-group string
  (`$(AppIdentifierPrefix)<bundleId>`) + Try button render; `'ok'`
  shows the byte-count success message; `'cancelled'`,
  `'missing-entitlement'`, `'unsupported'` each render distinct
  inline copy and never throw / `console.error` (NFR-005, NFR-006,
  SC-005); component is intentionally rendered nowhere on Android /
  Web (US4-AS4 is enforced at the screen level — see Phase 7).
  Covers FR-018, US4-AS1, US4-AS2, US4-AS3. RED.

### Implementation for US4

- [ ] T024 [US4] Implement
  `src/modules/keychain-lab/components/AccessGroupCard.tsx` —
  consumes `keychain-store.tryAccessGroupProbe`; renders the explainer,
  resolved access-group string, and the Try button with the four
  inline message variants above. Make T023 GREEN. FR-018, US4-AS1–AS3.

**Checkpoint**: US4 is independently testable — the access-group card
surfaces all four typed result kinds without throwing.

---

## Phase 7: User Story 5 — Cross-platform graceful degradation (P3) + screen variants

**Goal**: iOS screen composes `ItemsList` + `AddItemForm` +
`AccessGroupCard`; Android screen renders basic CRUD with the picker
disabled and the Access Group card hidden; Web screen renders only the
`IOSOnlyBanner` and disables every interactive surface. Per
constitution III the platform difference is handled by the universal
`src/native/keychain.ts` facade and the `screen.*` file split — not by
inline `Platform.OS` branches in the shared components.

**Independent Test**: Render each `screen.*` variant with the mocked
bridge and assert the structural rules above. Mirrors spec US5
Acceptance Scenarios.

### Tests for US5

- [ ] T025 [P] [US5] Write
  `test/unit/modules/keychain-lab/screen.test.tsx` — iOS variant
  mounts; `ItemsList` + `AddItemForm` + `AccessGroupCard` all render;
  Add → Show → Delete flow wires through `useKeychainItems`; bridge
  recorder asserts the exact `kSecAttrAccessible*` constant emitted
  on Save (SC-007). Covers FR-005, US1, US2, US4, SC-007. RED.
- [ ] T026 [P] [US5] Write
  `test/unit/modules/keychain-lab/screen.android.test.tsx` —
  AccessGroupCard is **not** rendered; AccessibilityPicker is
  rendered disabled with the Android note; basic Add / Show flow
  delegates to the `expo-secure-store` mock with
  `requireAuthentication: true` when biometry is on and the
  `keychainAccessible` value mapped from the picker's default.
  Covers FR-005, US5-AS2, US4-AS4. RED.
- [ ] T027 [P] [US5] Write
  `test/unit/modules/keychain-lab/screen.web.test.tsx` —
  `IOSOnlyBanner` renders; every form field and row button is
  disabled; the bridge is never instantiated (assert via the
  recorder being empty). Covers FR-005, US5-AS1, NFR-005. RED.

### Implementation for US5

- [ ] T028 [P] [US5] Implement
  `src/modules/keychain-lab/screen.tsx` (iOS) — composes
  `ItemsList`, `AddItemForm`, `AccessGroupCard`, all driven by
  `useKeychainItems`. Make T025 GREEN. FR-005, plan.md §Architecture.
- [ ] T029 [P] [US5] Implement
  `src/modules/keychain-lab/screen.android.tsx` — `ItemsList` +
  `AddItemForm` only; `AccessibilityPicker` disabled; no
  `AccessGroupCard`. Make T026 GREEN. FR-005, US5-AS2, US4-AS4.
- [ ] T030 [P] [US5] Implement
  `src/modules/keychain-lab/screen.web.tsx` — `IOSOnlyBanner` only;
  no interactive surfaces; no bridge import path that triggers a
  native call. Make T027 GREEN. FR-005, US5-AS1, NFR-005.

**Checkpoint**: All five user stories now pass independently.

---

## Phase 8: Native iOS bridge (Swift)

**Purpose**: Ship the in-tree custom Expo native module that backs the
extended capabilities. JS-pure tests already cover the contract via the
`native-keychain` mock (FR-023); these tasks deliver the Swift
implementation that the custom dev client autolinks.

- [ ] T031 Implement `native/ios/keychain/KeychainBridge.swift` — Expo
  Modules API `Module { Function ... }` exposing
  `addItem / getItem / updateItem / deleteItem / listLabels /
  tryAccessGroupProbe`. Wraps `SecItemAdd`, `SecItemCopyMatching`,
  `SecItemUpdate`, `SecItemDelete`, builds `kSecAttrAccessControl`
  via `SecAccessControlCreateWithFlags` with `.biometryCurrentSet`
  when `biometryRequired === true` (D-02), sets
  `kSecAttrAccessGroup` only when supplied, maps `OSStatus` to the
  `KeychainResult.kind` table from plan.md §JS Bridge Contract,
  upgrades `errSecDuplicateItem` to `SecItemUpdate`. Implements
  FR-011, D-01, D-02, plan.md §Architecture.
- [ ] T032 [P] Add `native/ios/keychain/KeychainBridge.podspec` and
  `native/ios/keychain/expo-module.config.json`
  (`{ platforms: ['ios'], ios.modules: ['KeychainBridge'] }`) so the
  module is autolinked by the custom dev client. Implements plan.md
  §Architecture.

---

## Phase 9: Manifest + registry integration

**Purpose**: Land the module manifest and the single-line registry
addition. Test-first per FR-023.

- [ ] T033 [P] Write `test/unit/modules/keychain-lab/manifest.test.ts`
  — `id === 'keychain-lab'`, kebab-case, single occurrence in
  `MODULES`, `platforms: ['ios','android','web']`, `minIOS: '8.0'`,
  title `"Keychain Lab"`, icon `{ ios: 'lock.shield', fallback: '' }`.
  Covers FR-001, FR-003, FR-004, SC-001. RED.
- [ ] T034 Implement `src/modules/keychain-lab/index.tsx` — module
  manifest exporting `id`, `title`, `description`, `icon`,
  `platforms`, `minIOS`, and the screen reference. Make T033 GREEN.
  FR-001, FR-003, FR-004.
- [ ] T035 Update `src/modules/registry.ts` — add **exactly one**
  import line for the new manifest and **exactly one** entry to the
  `MODULES` array (additive, preserves order, matches the 007–022
  pattern). FR-002, SC-001, SC-006.

---

## Phase 10: Config plugin (`with-keychain-services`)

**Purpose**: Land the Expo config plugin that adds the
`keychain-access-groups` entitlement idempotently and coexists with all
prior plugins. Test-first.

- [ ] T036 [P] Write
  `test/unit/plugins/with-keychain-services/index.test.ts` —
  (a) adds `$(AppIdentifierPrefix)<bundleId>` when the entitlement
      is absent;
  (b) preserves existing entries when present (no duplicate);
  (c) re-running the plugin twice on the same config still yields a
      single entry (idempotency, FR-020);
  (d) missing `ios.bundleIdentifier` → single `console.warn` + the
      config is returned untouched (FR-020 no-op);
  (e) plugin only edits the `keychain-access-groups` key — no other
      entitlement, Info.plist, capability, or Expo config field is
      touched (FR-021);
  (f) coexistence smoke test: run the plugin **after** all prior
      custom plugins on a fresh deep-cloned config copy and assert
      the `app.json` `plugins` array semantics (the new plugin grows
      the array by exactly one entry — 11 → 12, FR-022, SC-004).
  RED.
- [ ] T037 Implement `plugins/with-keychain-services/index.ts` exactly
  per plan.md §Config Plugin (uses `withEntitlementsPlist`, idempotent
  inclusion check, no-op + single `console.warn` on missing bundleId).
  Make T036 GREEN. FR-020, FR-021, FR-022, D-06.
- [ ] T038 [P] Add `plugins/with-keychain-services/package.json`
  (`{ name, version, main, types }`) so the plugin is consumable via
  the `./plugins/with-keychain-services` path used by `app.json`.
  Implements plan.md §Architecture.

---

## Phase 11: Final integration — `app.json` plugin entry

- [ ] T039 Edit `app.json` — append **exactly one** entry
  `"./plugins/with-keychain-services"` to the `plugins` array,
  growing it from 11 → 12 entries (SC-004); no edits to any existing
  entry. FR-022, SC-001, SC-004.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T040 [P] Run `pnpm format` and `pnpm lint` — zero new
  `eslint-disable` directives for unregistered rules (NFR-002).
- [ ] T041 [P] Run `pnpm typecheck` — strict TS green across the new
  files (NFR-003).
- [ ] T042 [P] Run `pnpm test` — full suite green; assert the suite
  count and total test count both grew strictly vs. 022 baseline
  (SC-002, SC-003).
- [ ] T043 Run the `quickstart.md` validation script end-to-end
  (manual checklist) — empty list, Add → Show → Delete, biometry-on
  Add, picker change, Try shared keychain in entitled and unentitled
  builds. Confirms US1–US5 acceptance scenarios in a single pass
  (SC-005, SC-007).
- [ ] T044 Verify constitution v1.1.0 compliance: `ThemedText` /
  `ThemedView`, `Spacing` scale, `StyleSheet.create` only, no inline
  color literals where a themed token exists, three screen variants
  for platform splitting, JS-pure test coverage for every new export.
  NFR-001, plan.md §Constitution Compliance.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: No deps — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; BLOCKS every user
  story phase.
- **Phase 3 (US1)**: Depends on Phase 2 (`useKeychainItems` + types).
- **Phase 4 (US2)**: Depends on Phase 2 + the `AddItemForm`
  consumes `AccessibilityPicker` from Phase 5; T020 has a soft
  dependency on T022 (use a placeholder import + integrate when T022
  lands; both can be developed in parallel by separate engineers and
  integrated at the screen level).
- **Phase 5 (US3)**: Depends on Phase 2 (T006 accessibility-classes).
- **Phase 6 (US4)**: Depends on Phase 2 (`keychain-store`
  `tryAccessGroupProbe`).
- **Phase 7 (US5 / screens)**: Depends on Phases 3–6 (composes all
  components).
- **Phase 8 (Swift bridge)**: Independent of Phases 3–7 once Phase 2
  is green; the JS contract is already proven by the mock. Can run in
  parallel with Phases 3–7.
- **Phase 9 (manifest + registry)**: Depends on Phase 7 (screen
  exports must exist for the manifest to import them).
- **Phase 10 (plugin)**: Independent — can run in parallel with
  Phases 3–9 once Phase 1 directories exist.
- **Phase 11 (`app.json`)**: Depends on Phase 10.
- **Phase 12 (polish)**: Depends on Phases 9 + 11.

### Within each user story

- Tests are written FIRST and MUST be RED before the matching
  implementation task starts (constitution V, FR-023).
- Models / types before services; services before components;
  components before screens; screens before manifest.

### Parallel opportunities

- All `[P]` Setup tasks run together (T002, T003, T004).
- All `[P]` Foundational test tasks (T005, T007, T009, T011) run
  together; their implementations (T006, T008, T010, T012) become
  parallel as their respective tests land.
- US1, US2, US3, US4 component tests (T013, T014, T015, T019, T021,
  T023) all run in parallel — different files, no shared state.
- US1 component implementations T016, T017 are `[P]`; T018 depends
  on T017.
- Screen tests T025–T027 and screen implementations T028–T030 are
  fully `[P]` — three platform-split files.
- Phase 8 (Swift bridge) and Phase 10 (plugin) run in parallel with
  the JS phases.
- Final integration tasks (T035, T039) are intentionally sequential
  single-line edits to shared files (`registry.ts`, `app.json`) and
  are NOT marked `[P]`.

---

## Parallel example: Phase 2 (foundations)

```bash
# Write all four foundational tests in parallel:
Task: "T005 accessibility-classes.test.ts"
Task: "T007 native/keychain.test.ts"
Task: "T009 keychain-store.test.ts"
Task: "T011 hooks/useKeychainItems.test.tsx"

# Then implement in dependency order:
Task: "T006 accessibility-classes.ts"   # GREEN T005
Task: "T008 src/native/keychain.ts"     # GREEN T007 (depends on T006)
Task: "T010 keychain-store.ts"          # GREEN T009 (depends on T008)
Task: "T012 useKeychainItems.ts"        # GREEN T011 (depends on T010)
```

## Parallel example: US1 components

```bash
# All three test files are independent:
Task: "T013 IOSOnlyBanner.test.tsx"
Task: "T014 ItemRow.test.tsx"
Task: "T015 ItemsList.test.tsx"

# Implementations:
Task: "T016 IOSOnlyBanner.tsx"   # GREEN T013
Task: "T017 ItemRow.tsx"         # GREEN T014
Task: "T018 ItemsList.tsx"       # GREEN T015 (depends on T017)
```

---

## Implementation Strategy

### MVP first (US1 + US2 only)

1. Phase 1 (Setup) → Phase 2 (Foundational) — all RED → all GREEN.
2. Phase 3 (US1 Items List) — RED → GREEN.
3. Phase 4 (US2 Add item) — RED → GREEN.
4. Phase 9 (manifest + registry) and Phase 7 iOS screen only (T025,
   T028) — wire the MVP into the app.
5. **STOP and VALIDATE**: open the card, add an item, show / delete.

### Incremental delivery

1. MVP (US1 + US2) → demo.
2. Add Phase 5 (US3 picker) → demo lifecycle classes.
3. Add Phase 6 (US4 access group) + Phase 8 (Swift bridge) +
   Phase 10–11 (plugin + `app.json`) → demo shared keychain in an
   entitled signed build.
4. Add Phase 7 Android + Web (US5) → demo cross-platform degradation.
5. Phase 12 polish → final review.

### Parallel team strategy

With three engineers post-Phase 2:

- Engineer A: Phases 3–7 (UI / hook integration).
- Engineer B: Phase 8 (Swift bridge) + Phase 9 (manifest +
  registry).
- Engineer C: Phase 10 + Phase 11 (plugin + `app.json`).

All converge at Phase 12.

---

## Notes

- `[P]` tasks = different files, no incomplete deps.
- `[Story]` label maps each task to the spec.md user story it serves.
- Every test task lists the spec FR / acceptance-scenario IDs it
  exercises; every implementation task lists the FR / plan section it
  implements.
- Verify tests fail before implementing (constitution V).
- Commit after each task or logical group with the Copilot trailer.
- Cancellation / missing-entitlement / not-found / auth-failed paths
  produce zero `console.warn` and zero `console.error` (SC-005,
  NFR-006) — verified by tests injecting each result kind.
- Final `app.json` `plugins` array growth: 11 → 12 (SC-004).
- Registry growth: one import + one array entry (SC-001).
