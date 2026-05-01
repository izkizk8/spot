---
description: "Task list for feature 033 — Share Sheet"
---

# Tasks: Share Sheet Module (033)

**Input**: Design documents from `/specs/033-share-sheet/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Per plan §"Test-First for New Features" and Constitution V, all
JS-pure surfaces ship with tests authored before implementation (TDD-first).

**Organization**: Tasks are grouped by **technical layer** in dependency order
(foundational types → catalogs → JS bridge → hook → components → screens →
manifest → registry → native iOS sources → final integration). Each layer
follows a strict RED→GREEN cadence: test files are added first, then the
matching implementation.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks).
- All paths are absolute from repository root.
- User-story coverage: T039–T041 (US1–US6 wiring), T031–T036 (US5 iPad anchor + US6 cross-platform), T011–T012 (US1–US6 state machine), T020 (US5), T018/T022 (US2), T019/T023 (US3), T016/T017 + T024/T025 (US4).

---

## Phase 1: Foundational types & contracts

**Purpose**: Establish the shared TypeScript surface that every other layer
imports. No tests in this phase (pure type declarations + the typed
`ShareSheetNotSupported` error class — both are exercised by every later test
suite).

- [ ] T001 Create directory scaffolding: `src/modules/share-sheet-lab/{components,hooks,samples}/`, `native/ios/share-sheet/`, `test/unit/modules/share-sheet-lab/{components,hooks}/`, `test/unit/native/`.
- [ ] T002 Author `src/native/share-sheet.types.ts` with `ShareContent` (entity 1), `ShareOptions` (entity 2), `ShareResult` (entity 3), `AnchorRect` (entity 4), `ShareSheetBridge` interface, `NATIVE_MODULE_NAME = 'ShareSheet'` const, and the `ShareSheetNotSupported` class (per `contracts/share-sheet-bridge.contract.ts` invariants B1–B9 and `contracts/native-module.contract.ts`).

---

## Phase 2: Static catalogs (activity-types, bundled-images)

**Purpose**: Hand-curated, frozen tables consumed by `ExcludedActivitiesPicker`
and `ImageContentPicker`. Tests assert structural invariants from data-model
entity 5 and research §8.

- [ ] T003 [P] Author `test/unit/modules/share-sheet-lab/activity-types.test.ts`: exactly 12 iOS entries + 2 synthetic entries (`web.clipboard-fallback`, `android.clipboard-fallback`); each iOS `id` matches `/^com\.apple\.UIKit\.activity\.[A-Za-z]+$/`; synthetic entries match `/^(web|android)\.clipboard-fallback$/`; non-empty `label`s; no duplicate `id`s; synthetic entries flagged by the `synthetic` literal field; `web.clipboard-fallback` exported as a distinct constant.
- [ ] T004 [P] Author `test/unit/modules/share-sheet-lab/bundled-images.test.ts`: exactly four entries; each exposes a non-empty `alt` string and a finite numeric `source` (a `require()` module id resolvable via Jest's metro resolver); no duplicate `alt`s.
- [ ] T005 [P] Implement `src/modules/share-sheet-lab/activity-types.ts` (catalog of `ActivityTypeCatalogEntry` rows per data-model entity 5 + research §8) and the `deriveExcludedActivityTypes(catalog, selection)` helper from data-model entity 6.
- [ ] T006 [P] Implement `src/modules/share-sheet-lab/bundled-images.ts` (`as const` array of four PNG descriptors; reuse 016/032 PNGs where present, else add tiny new 1×1 PNGs under `src/modules/share-sheet-lab/samples/`).
- [ ] T007 [P] Add fallback sample text file `src/modules/share-sheet-lab/samples/sample.txt` (only if `src/modules/documents-lab/samples/hello.txt` is not reusable, per R-E).

---

## Phase 3: JS bridge (cross-platform)

**Purpose**: The single typed entry point all UI consumes. One test file
covers all three platform variants by mocking the import boundary
(per FR-022). RED first, then three parallel implementations.

- [ ] T008 Author `test/unit/native/share-sheet.test.ts` covering invariants B1–B9 from `contracts/share-sheet-bridge.contract.ts`:
  - iOS: `present()` delegates to a mocked `ShareSheet` native module and resolves with `{ activityType, completed }` 1:1; `isAvailable()` returns `true`.
  - iOS serialisation (R-A): two back-to-back `present()` calls produce exactly two native invocations in submission order, even when the first rejects.
  - Android (`content.kind === 'file'`): delegates to mocked `expo-sharing.shareAsync(uri)` → `{ activityType: null, completed: true }`; on `shareAsync` rejection → `{ activityType: null, completed: false }`.
  - Android (`content.kind === 'text' | 'url'`): delegates to mocked `expo-clipboard.setStringAsync` → `{ activityType: 'android.clipboard-fallback', completed: true }`.
  - Web with `'share' in navigator`: awaits `navigator.share(...)` → `{ activityType: null, completed: true }`; `AbortError` → `{ completed: false }`; other rejections fall through to clipboard.
  - Web without `navigator.share`: delegates to `expo-clipboard.setStringAsync` → `{ activityType: 'web.clipboard-fallback', completed: true }`.
  - Caller-side capabilities (`includeCustomActivity`, non-empty `excludedActivityTypes`, non-null `anchor`) on Android/Web throw `ShareSheetNotSupported` (B9); basic share path NEVER throws (FR-019).
- [ ] T009 [P] Implement `src/native/share-sheet.ts` (iOS): `requireOptionalNativeModule('ShareSheet')` + `Platform.OS === 'ios'` gate; closure-scoped `enqueue` promise chain (R-A); exports `present`, `isAvailable`, `ShareSheetNotSupported`.
- [ ] T010 [P] Implement `src/native/share-sheet.android.ts`: file → `expo-sharing.shareAsync`; text/url → `expo-clipboard.setStringAsync` returning synthetic `'android.clipboard-fallback'` (R-D); throws `ShareSheetNotSupported` only when caller-side capabilities are requested.
- [ ] T011 [P] Implement `src/native/share-sheet.web.ts`: `navigator.share` when present (treats `AbortError` as cancel); else `expo-clipboard.setStringAsync` returning `'web.clipboard-fallback'` (R-D). MUST NOT import `src/native/share-sheet.ts` at evaluation time.

---

## Phase 4: `useShareSession` hook

**Purpose**: The single state surface the screens consume (entity 8). Owns the
result-log clamp, outcome classification (entity 7), and bridge orchestration.

- [ ] T012 Author `test/unit/modules/share-sheet-lab/hooks/useShareSession.test.tsx`: default state per data-model; each setter (`setContent` / `setExclusions` / `setIncludeCustomActivity` / `setAnchor`) replaces the corresponding slice; `share()` success appends `{ outcome: 'completed', activityType }`; `share()` cancel appends `{ outcome: 'cancelled', activityType: '(none)' }` (FR-024); bridge rejection appends `{ outcome: 'error', errorMessage }` (FR-025); log clamps to 10 newest-first (FR-012); concurrent `share()` while `isSharing` is no-op; setter / `share` references stable across renders; on Android non-file the bridge's `'android.clipboard-fallback'` resolution is recorded normally (no error path).
- [ ] T013 Implement `src/modules/share-sheet-lab/hooks/useShareSession.ts`: reducer-serialised state per data-model §"State machine"; uses `classifyOutcome` (entity 7); reads anchor rect from a ref at `share()` time (R-F); imports the bridge from `src/native/share-sheet.ts` only via the platform-resolved entry.

---

## Phase 5: Components (9 panels)

**Purpose**: Pure presentational + light-state components consumed by the
three screen variants. Tests authored in parallel, then implementations in
parallel.

### Component tests (RED) — all parallelisable

- [ ] T014 [P] `test/unit/modules/share-sheet-lab/components/ContentTypePicker.test.tsx`: 4 mutually-exclusive segments; each tap calls `onChange` with the matching `'text' | 'url' | 'image' | 'file'` value.
- [ ] T015 [P] `test/unit/modules/share-sheet-lab/components/TextContentInput.test.tsx`: default value `"Hello from spot showcase"`; `multiline` prop is true; `onChange` propagates edited text.
- [ ] T016 [P] `test/unit/modules/share-sheet-lab/components/UrlContentInput.test.tsx`: default value `"https://expo.dev"`; valid URLs pass `isValidShareUrl` (R-B); empty / `not-a-url` show inline error and disable Share by emitting `isValid=false`.
- [ ] T017 [P] `test/unit/modules/share-sheet-lab/components/ImageContentPicker.test.tsx`: renders 2×2 grid of 4 tiles from `bundled-images.ts`; tap selects; selection survives re-render.
- [ ] T018 [P] `test/unit/modules/share-sheet-lab/components/FileContentPicker.test.tsx`: when documents-store list is non-empty → renders that list; when unavailable / empty → renders only the bundled fallback row (R-E).
- [ ] T019 [P] `test/unit/modules/share-sheet-lab/components/ExcludedActivitiesPicker.test.tsx`: checklist length matches catalog (built-ins only); per-row toggle works; `Hide all` toggles every built-in (FR-008); disabled state on non-iOS asserted via `accessibilityState.disabled === true`.
- [ ] T020 [P] `test/unit/modules/share-sheet-lab/components/CustomActivityToggle.test.tsx`: default off; `onValueChange` flips; disabled with caption on non-iOS.
- [ ] T021 [P] `test/unit/modules/share-sheet-lab/components/AnchorSelector.test.tsx`: renders 4 buttons; selecting each propagates the latest `AnchorRect` from the most recent `onLayout` event (R-F); returns `null` when `Platform.isPad` mock is `false`.
- [ ] T022 [P] `test/unit/modules/share-sheet-lab/components/ResultLog.test.tsx`: 0 / 1 / N entries; clamps to 10 newest-first; each row shows `type`, `activityType`, `outcome` label, and timestamp text.

### Component implementations (GREEN) — all parallelisable

- [ ] T023 [P] `src/modules/share-sheet-lab/components/ContentTypePicker.tsx`.
- [ ] T024 [P] `src/modules/share-sheet-lab/components/TextContentInput.tsx`.
- [ ] T025 [P] `src/modules/share-sheet-lab/components/UrlContentInput.tsx` (uses `isValidShareUrl` per R-B).
- [ ] T026 [P] `src/modules/share-sheet-lab/components/ImageContentPicker.tsx`.
- [ ] T027 [P] `src/modules/share-sheet-lab/components/FileContentPicker.tsx` (reads `documents-store` defensively per R-E).
- [ ] T028 [P] `src/modules/share-sheet-lab/components/ExcludedActivitiesPicker.tsx`.
- [ ] T029 [P] `src/modules/share-sheet-lab/components/CustomActivityToggle.tsx`.
- [ ] T030 [P] `src/modules/share-sheet-lab/components/AnchorSelector.tsx` (ref-scoped rect map per R-F).
- [ ] T031 [P] `src/modules/share-sheet-lab/components/ResultLog.tsx`.

---

## Phase 6: Screens (3 platform variants)

**Purpose**: Compose the panels in the fixed order from plan.md; enforce
`Platform.isPad` gating for `AnchorSelector`; enforce that `screen.web.tsx`
NEVER imports `src/native/share-sheet.ts` at module evaluation time.

### Screen tests (RED)

- [ ] T032 [P] `test/unit/modules/share-sheet-lab/screen.test.tsx`: iOS panels render in fixed order (ContentTypePicker → matching content panel → ExcludedActivitiesPicker → CustomActivityToggle → AnchorSelector → Share + ResultLog); `AnchorSelector` hidden when `Platform.isPad` mock is `false`.
- [ ] T033 [P] `test/unit/modules/share-sheet-lab/screen.android.test.tsx`: panels render minus `AnchorSelector`; `ExcludedActivitiesPicker` and `CustomActivityToggle` rendered with `accessibilityState.disabled === true`; explanatory caption present.
- [ ] T034 [P] `test/unit/modules/share-sheet-lab/screen.web.test.tsx`: same render set as Android; statically asserts (via `jest.isolateModules` + `jest.doMock` of `src/native/share-sheet.ts` to throw) that the web bundle does not pull in the iOS bridge at evaluation time.

### Screen implementations (GREEN)

- [ ] T035 Implement `src/modules/share-sheet-lab/screen.tsx` (iOS variant; consumes `useShareSession`).
- [ ] T036 Implement `src/modules/share-sheet-lab/screen.android.tsx`.
- [ ] T037 Implement `src/modules/share-sheet-lab/screen.web.tsx` (must not import `src/native/share-sheet.ts`).

---

## Phase 7: Manifest

- [ ] T038 Author `test/unit/modules/share-sheet-lab/manifest.test.ts` per `contracts/manifest.contract.ts`: `id === 'share-sheet'`; `label === 'Share Sheet'`; `platforms` deep-equals `['ios','android','web']`; `minIOS === '8.0'`.
- [ ] T039 Implement `src/modules/share-sheet-lab/index.tsx` exporting the `ModuleManifest` (matches manifest test).

---

## Phase 8: Registry integration

- [ ] T040 Modify `src/modules/registry.ts`: +1 import line for `shareSheetLab` from `./share-sheet-lab`; +1 array entry appended after the 032 entry; no other edits. Re-run existing registry test (no new test needed — 033 manifest test already covers shape).

---

## Phase 9: Native iOS sources (Swift)

**Purpose**: Real `UIActivityViewController` presenter and the
`CopyWithPrefixActivity` subclass. Not unit-testable on Windows; on-device
verification documented in `quickstart.md` (same exemption pattern as
007 / 013 / 014 / 027–032).

- [ ] T041 [P] Implement `native/ios/share-sheet/ShareSheetPresenter.swift`: `@available(iOS 8.0, *)` Expo Module exposing `AsyncFunction "present"` per `contracts/native-module.contract.ts`; builds activity items from the JS payload; appends `CopyWithPrefixActivity` when requested; sets `popoverPresentationController.sourceView` / `sourceRect` from the supplied anchor (FR-015); presents over the current root view controller; resolves Promise from `completionWithItemsHandler` with `{ activityType: activityType?.rawValue ?? null, completed }` (R-G); strong-ref self for sheet lifetime (32-style).
- [ ] T042 [P] Implement `native/ios/share-sheet/CopyWithPrefixActivity.swift`: `UIActivity` subclass; `activityType = 'com.spot.share-sheet.copy-with-prefix'`; `activityTitle = "Copy with prefix"`; SF Symbol `activityImage`; `canPerform(withActivityItems:)` true iff any item is `String`; `perform()` joins string items, prepends `"Spot says: "`, writes to `UIPasteboard.general`, calls `activityDidFinish(true)`.

---

## Phase 10: Final integration & verification

- [ ] T043 Run on-device quickstart sanity per `quickstart.md` (manual; documented, not gated in CI).
- [ ] T044 Run `pnpm format && pnpm check`, ensure green, then commit and push the 033-share-sheet branch.

---

## Dependencies & ordering

- **T001** blocks every later task (directories must exist).
- **T002** blocks T003–T042 (every later test/impl imports the shared types).
- Catalogs (T003–T007) block T013 (hook), T018/T019/T027/T028 (components consume catalogs), and T038/T039 (manifest doesn't, but registry does).
- Bridge tests (T008) precede bridge impls (T009–T011) — TDD RED→GREEN.
- Bridge impls (T009–T011) block T013 (hook imports bridge) and T035–T037 (screens, indirectly).
- Hook (T012–T013) blocks T032–T037 (screens consume the hook).
- Component tests (T014–T022) precede component impls (T023–T031); no inter-component dependencies.
- Component impls (T023–T031) block screen tests (T032–T034) only insofar as the screen tests render real components — if you mock components in screen tests this is a soft dependency.
- Screen tests (T032–T034) precede screen impls (T035–T037).
- Manifest (T038–T039) is independent of components; can run in parallel with Phase 5 once T002 is done.
- Registry (T040) requires T039 (manifest export must exist).
- Swift sources (T041–T042) are independent of all JS tasks (mocked at the import boundary in tests); can run any time after T002.
- T044 is the terminal gate.

## Parallel execution opportunities

- All [P] tasks within a single layer can run concurrently.
- The largest fan-outs:
  - **9 component tests in parallel** (T014–T022).
  - **9 component impls in parallel** (T023–T031).
  - **3 bridge impls in parallel** (T009–T011).
  - **3 screen tests in parallel** (T032–T034).
  - **2 Swift files in parallel** (T041–T042), independent of every JS task.

## Total task count

**44 tasks** (T001–T044). 18 test files (T003, T004, T008, T012, T014–T022, T032–T034, T038) match the plan's "≥ +18 suites" delta target.

## User-story coverage matrix

| User story (spec.md) | Priority | Covered by |
|----------------------|----------|------------|
| US1 — Share text or URL via system Share Sheet | P1 | T002, T008–T011, T013, T014–T016, T023–T025, T035–T037, T039, T040 |
| US2 — Exclude specific built-in activities | P2 | T003, T005, T019, T028 |
| US3 — Use the "Copy with prefix" custom activity | P2 | T020, T029, T041, T042 |
| US4 — Share image and file content | P3 | T004, T006, T007, T017, T018, T026, T027 |
| US5 — Anchor share sheet correctly on iPad | P3 | T021, T030 (R-F), T032, T035 |
| US6 — Cross-platform behaviour on Android and Web | P3 | T010, T011 (R-D), T033, T034, T036, T037 |

## MVP scope

User Story 1 (P1) ships the basic text/URL share path end-to-end. Minimum
task subset for an MVP demoable build:
**T001 → T002 → T003/T005 → T008/T009 → T012/T013 → T014/T015/T016/T023/T024/T025 → T032/T035 → T038/T039 → T040 → T041 → T044.**

Stories US2–US6 are layered on top without touching MVP files.
