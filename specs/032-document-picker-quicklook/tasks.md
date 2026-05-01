---
description: "Dependency-ordered task list for feature 032 — Document Picker + Quick Look Module (`documents-lab`)"
---

# Tasks: Document Picker + Quick Look Module (`documents-lab`)

**Input**: Design documents from `/specs/032-document-picker-quicklook/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md, research.md, contracts/{documents-store,quicklook-bridge,manifest,with-documents-plugin}.contract.ts.

**Tests**: REQUIRED — every component, every screen variant, the manifest, the bridge (iOS + Android + Web + types), the `mime-types` helper, the `samples` descriptor, the `documents-store`, the `usePickedDocuments` hook, and the plugin has an explicit unit test (FR-019, Constitution Principle V). The Swift surface (one new file under `native/ios/documents/`) is verified on-device per `quickstart.md` (Constitution V exemption mirroring 007 / 013 / 014 / 027 / 028 / 029 / 030 / 031).

**Organization**: Tasks are grouped by phase (Setup → Foundational → Implementation → Plugin → Native → Integration → Polish) following the plan's phased file inventory. The spec defines four user stories (US1: pick documents — P1; US2: bundled samples — P1; US3: preview via Quick Look — P1; US4: filter / share / delete — P2); all four ship together as one module so tasks are organised by file/dependency rather than per-story phases. [Story] tags are attached to story-specific surfaces for traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]`, `[US4]` where the task delivers a story-specific surface; foundational and infra tasks have no story tag
- All file paths are repository-relative under the worktree root `C:\Users\izkizk8\spot-032-docs`
- Tests live under `test/unit/modules/documents-lab/`, `test/unit/native/`, and `test/unit/plugins/with-documents/` (NOT colocated; matches 014 / 027 / 028 / 029 / 030 / 031 layout)
- **No commits are produced by `/speckit.tasks`.** "Checkpoint commit" tasks below are markers for the implementation phase; the orchestrator commits at end.
- **TDD cadence**: every implementation task is preceded by a RED test task. RED tests must fail with module-not-found / undefined-symbol errors before the matching implementation begins (Constitution Principle V).

---

## Overview

Feature 032 adds an iOS 11+ Document Picker + Quick Look showcase module. Three classes of artefact are produced:

1. **TypeScript surface** — one module (`src/modules/documents-lab/`) with a manifest, three platform-suffixed screen variants, a pure `mime-types.ts` helper, a pure `samples.ts` descriptor, four bundled sample assets, an AsyncStorage-backed `documents-store.ts`, a `usePickedDocuments` hook, and seven UI components. Plus a four-file JS bridge (`src/native/quicklook.{ts,android.ts,web.ts,types.ts}`) mirroring 030 / 031's bridge layout.
2. **Swift surface** — one file under `native/ios/documents/` (`QuickLookPresenter.swift`) appended to the **main app target** via the existing autolinking pipeline (NOT via this feature's plugin; plugin scope is `Info.plist` `LSSupportsOpeningDocumentsInPlace` + `UIFileSharingEnabled` only — see plan §"Structure Decision").
3. **Plugin** — `plugins/with-documents/` (idempotent, commutative with all 31 prior plugins; mutates only the two managed `Info.plist` keys).

Plus 3 additive integration edits (`src/modules/registry.ts` +1 import +1 array entry; `app.json` `plugins` +1 entry; `package.json` +2 deps via `npx expo install`).

**Deliverable counts**: **24 source files + 4 sample assets + 3 additive edits + 18 test files** — split into **94 numbered tasks** across **13 phases**.

**Test baseline delta target**: **≥ +18 new Jest suites** (matches plan §"Test baseline tracking").

---

## Phase 1: Setup (Module + Plugin + Native + Test Scaffolding + Dependencies)

**Purpose**: Create the empty directory tree, install the two new runtime dependencies, and stub the plugin package shell so subsequent file-creation tasks can run in parallel. No business logic.

- [ ] T001 [P] Create the module directory tree: `src/modules/documents-lab/`, `src/modules/documents-lab/components/`, `src/modules/documents-lab/hooks/`, and `src/modules/documents-lab/samples/`. Add `.gitkeep` if a directory ends up empty after the phase. **Acceptance**: All four directories exist and are tracked.
- [ ] T002 [P] Create the plugin directory `plugins/with-documents/` with `package.json` containing `{ "name": "with-documents", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }` (mirror `plugins/with-spotlight/package.json`). Plugin source is created in Phase 10. **Acceptance**: File parses as valid JSON; `main` points to `index.ts`; `dependencies` is absent or empty.
- [ ] T003 [P] Create the Swift source directory `native/ios/documents/` with a `.gitkeep`. The Swift sources are authored in Phase 11. **Acceptance**: Directory exists and is tracked.
- [ ] T004 [P] Create the test directory tree: `test/unit/modules/documents-lab/`, `test/unit/modules/documents-lab/components/`, `test/unit/modules/documents-lab/hooks/`, `test/unit/plugins/with-documents/`. Add `.gitkeep` if empty after this phase. **Acceptance**: All four directories exist and are tracked.
- [ ] T005 Install the two new runtime dependencies via `npx expo install expo-document-picker expo-sharing` (FR-018). **Acceptance**: `package.json` shows exactly two new entries (`expo-document-picker`, `expo-sharing`); no other dependency version moves; `pnpm-lock.yaml` updated; `pnpm install` clean.
- [ ] T006 **Checkpoint commit** marker: `chore(032): scaffold documents-lab module/plugin/test/native dirs + add expo-document-picker / expo-sharing`.

---

## Phase 2: Foundational — Shared Bridge Types (`src/native/quicklook.types.ts`)

**Purpose**: Define `QuickLookBridge` interface, `QuickLookPresentResult`, `QuickLookNotSupported` error class, and the `NATIVE_MODULE_NAME` literal. Every component, every screen variant, the bridge runtime variants, and `usePickedDocuments` depend on these symbols. Imported safely on every platform (no native module access at evaluation time).

**⚠️ CRITICAL**: Nothing in Phase 3+ may begin until this phase completes (foundational types).

### Tests for shared types (RED)

- [ ] T007 [US3] Write `test/unit/native/quicklook.types.test.ts` covering every obligation in `contracts/quicklook-bridge.contract.ts` that is purely type-/value-level:
  1. `QuickLookNotSupported` is a `class` whose instances pass `instanceof QuickLookNotSupported` and `instanceof Error` (FR-014).
  2. `QuickLookNotSupported` carries a stable `name === 'QuickLookNotSupported'`.
  3. `NATIVE_MODULE_NAME === 'QuickLook'` and is distinct from prior bridges (`'AppIntents'`, `'WidgetCenter'`, `'FocusFilters'`, `'BackgroundTasks'`, `'Spotlight'`).
  4. A `QuickLookPresentResult` value `{ shown: true }` typechecks; `{ shown: false }` does NOT typecheck (literal `true`).
  5. The `QuickLookBridge` shape includes exactly `isAvailable: () => boolean` and `present: (uri: string) => Promise<QuickLookPresentResult>`.

  RED until `src/native/quicklook.types.ts` exists. **Acceptance**: ≥5 distinct `it()` / type assertions; all fail with module-not-found. **Spec ref**: FR-013, FR-014; contract `quicklook-bridge.contract.ts`.

### Implementation (GREEN)

- [ ] T008 [US3] Implement `src/native/quicklook.types.ts` per `contracts/quicklook-bridge.contract.ts`: export `NATIVE_MODULE_NAME = 'QuickLook'`, `QuickLookPresentResult` interface (`{ shown: true }`), `QuickLookBridge` interface (`isAvailable` + `present`), and `QuickLookNotSupported` class extending `Error` with frozen `name`. Make T007 pass. **Acceptance**: T007 green; `pnpm typecheck` clean; no global symbol collisions with `app-intents.types`, `widget-center.types`, `focus-filters.types`, `background-tasks.types`, or `spotlight.types`. **Spec ref**: FR-013, FR-014, B1, B2.

---

## Phase 3: Foundational — `mime-types.ts` (pure)

**Purpose**: Pure helpers consumed by `documents-store`, `usePickedDocuments`, `TypeFilterControl`, `FilesList`, `FileRow`, and `PickDocumentsCard`. No React imports, no I/O.

### Tests (RED)

- [ ] T009 [US4] Write `test/unit/modules/documents-lab/mime-types.test.ts` covering:
  1. `mimeFromExtension` — `.txt → text/plain`, `.md → text/markdown`, `.json → application/json`, `.png → image/png`, `.jpg / .jpeg → image/jpeg`, `.pdf → application/pdf`, unknown extension → `application/octet-stream`, name with no extension → `application/octet-stream`, case-insensitive (`.PNG === .png`).
  2. `familyOfMime` — every `image/*` → `'image'`; `text/plain`, `text/markdown`, `application/json` → `'text'`; `application/pdf` → `'pdf'`; everything else → `'other'`.
  3. `pickerTypeForFilter` — `'all' → undefined` (or `'*/*'` per chosen `expo-document-picker` shape); `'images' → 'image/*'`; `'text' → ['text/plain','text/markdown','application/json']`; `'pdf' → 'application/pdf'`.
  4. `filterMatchesEntry` — every entry matches `'all'`; `image/png` matches `'images'` only; `text/markdown` matches `'text'` only; `application/pdf` matches `'pdf'` only.
  5. `formatSize` — `0 → '0 B'`, `1023 → '1023 B'`, `1024 → '1.0 KB'`, `1048576 → '1.0 MB'`; negative / non-finite → `'—'` (or documented sentinel).

  RED until `mime-types.ts` exists. **Acceptance**: ≥20 distinct assertions; all fail with module-not-found.

### Implementation (GREEN)

- [ ] T010 [US4] Implement `src/modules/documents-lab/mime-types.ts` exporting `DocumentFilter` type alias (`'all' | 'images' | 'text' | 'pdf'`) + the five pure helpers above. Make T009 pass. **Acceptance**: T009 green; no React / AsyncStorage / Platform imports; pure functions only.

---

## Phase 4: Foundational — `samples.ts` + bundled assets

**Purpose**: Static descriptor for the four bundled sample files; resolves bundle URIs at runtime via `Asset.fromModule(require(...)).localUri`.

### Sample assets (no tests required for binary blobs)

- [ ] T011 [P] [US2] Create `src/modules/documents-lab/samples/hello.txt` containing UTF-8 bytes for `Hello from spot 032!\n`. **Acceptance**: File is exactly 22 bytes; opens as plain text.
- [ ] T012 [P] [US2] Create `src/modules/documents-lab/samples/note.md` containing `# spot 032\n\nDocument Picker + Quick Look.\n`. **Acceptance**: File parses as valid markdown.
- [ ] T013 [P] [US2] Create `src/modules/documents-lab/samples/data.json` containing `{"feature":"032","ok":true}\n`. **Acceptance**: `JSON.parse` succeeds.
- [ ] T014 [P] [US2] Create `src/modules/documents-lab/samples/icon.png` — minimal valid 1×1 or 8×8 PNG (≤ 200 bytes). **Acceptance**: File begins with PNG magic `89 50 4E 47 0D 0A 1A 0A`; opens in any PNG viewer.

### Tests (RED)

- [ ] T015 [US2] Write `test/unit/modules/documents-lab/samples.test.ts` asserting:
  1. The exported `SAMPLES` array has exactly four entries.
  2. The four entries have ids `'hello.txt' | 'note.md' | 'data.json' | 'icon.png'` (no PDF — see plan §"PDF intentionally absent").
  3. Each entry has non-empty `name`, `mimeType` (`text/plain` / `text/markdown` / `application/json` / `image/png` respectively), and a positive `size`.
  4. Each entry exposes a `requireAsset` reference that, when passed to a mocked `Asset.fromModule`, yields a non-empty `localUri`.

  RED until `samples.ts` exists. **Acceptance**: ≥6 assertions; module-not-found until T016.

### Implementation (GREEN)

- [ ] T016 [US2] Implement `src/modules/documents-lab/samples.ts` exporting `SAMPLES: readonly SampleDescriptor[]` for the four files (with `require('./samples/...')`). Use `expo-asset`'s `Asset.fromModule` lazily inside the helper that resolves URIs. Make T015 pass. **Acceptance**: T015 green; no PDF entry; `pnpm typecheck` clean.

---

## Phase 5: Foundational — `documents-store.ts` (AsyncStorage-backed)

**Purpose**: Pure `parsePersisted` + side-effectful `load` / `save` / `dropMissingURIs` per `documents-store.contract.ts`. The hook's only AsyncStorage boundary.

### Tests (RED)

- [ ] T017 [US1] Write `test/unit/modules/documents-lab/documents-store.test.ts` covering invariants S1..S9:
  1. `STORAGE_KEY === 'spot.documents.list'`.
  2. `parsePersisted(null)` → `DEFAULT_STATE`; `onError` NOT called (S3).
  3. `parsePersisted('not json')` → `DEFAULT_STATE`; `onError` called once with `kind: 'parse'` (S4).
  4. `parsePersisted(JSON.stringify(42))` → `DEFAULT_STATE`; `onError` called once with `kind: 'shape'` (S5).
  5. `parsePersisted` of a state with one valid + one missing-`uri` row → keeps the valid one; `onError` fires once with `kind: 'rows', dropped: 1` (S6).
  6. `parsePersisted` with `filter: 'unknown'` → falls back to `'all'`; no error (S7).
  7. `dropMissingURIs` with a resolver that returns `false` for one URI / `true` for another / rejects for a third → keeps only the resolved-true row (S8).
  8. Two entries with identical `uri` are both kept (S9 / FR-005 AS3).
  9. `save` round-trips through `load` to produce structurally-equal state (mocked AsyncStorage).
  10. `load` with a thrown AsyncStorage `getItem` → returns `DEFAULT_STATE` and surfaces error via `onError`.

  RED until `documents-store.ts` exists. **Acceptance**: ≥10 assertions; module-not-found.

### Implementation (GREEN)

- [ ] T018 [US1] Implement `src/modules/documents-lab/documents-store.ts` per `contracts/documents-store.contract.ts`: export `STORAGE_KEY`, `DEFAULT_STATE`, `parsePersisted`, `load`, `save`, `dropMissingURIs`, plus the re-exported `DocumentEntry` / `DocumentsStoreState` / `DocumentFilter` / `ParseErrorKind` types. Use `@react-native-async-storage/async-storage` only inside `load` / `save`; keep `parsePersisted` pure. Make T017 pass. **Acceptance**: T017 green; no React / Platform imports; `parsePersisted` is referentially transparent.

---

## Phase 6: Foundational — Bridge Runtime Variants (`src/native/quicklook.{ts,android.ts,web.ts}`)

**Purpose**: Platform-specific runtime exports of `QuickLookBridge`. iOS path uses `requireOptionalNativeModule('QuickLook')` + serialised `present()` chain (R-A inheritance from 030 / 031). Non-iOS variants throw `QuickLookNotSupported` from `present()` and return `false` from `isAvailable()` synchronously.

### Tests (RED)

- [ ] T019 [US3] Write `test/unit/native/quicklook.test.ts` covering bridge invariants B1..B5:
  1. iOS path with mocked `QuickLook` native module — `present('file://...')` calls the mocked module's `present` exactly once and resolves with `{ shown: true }`.
  2. iOS path — two back-to-back `present()` calls produce native invocations in submission order even when the first rejects (B3 / R-A).
  3. iOS path — `isAvailable()` returns `true` synchronously when the native module is present, `false` when `requireOptionalNativeModule` returns `null` (B4).
  4. Android path (`quicklook.android.ts`) — `present()` rejects with `QuickLookNotSupported`; `isAvailable()` returns `false`.
  5. Web path (`quicklook.web.ts`) — same shape as android.
  6. Error path — `present()` rejection from native carries a message including one of the documented codes (`'invalid-uri' | 'unreadable' | 'no-root-view-controller' | 'preview-failed'`) (B5 / data-model.md Entity 5).

  RED until the three runtime files exist. **Acceptance**: ≥6 assertions; module-not-found.

### Implementation (GREEN)

- [ ] T020 [P] [US3] Implement `src/native/quicklook.android.ts`: export `bridge: QuickLookBridge` whose `isAvailable()` returns `false` and `present()` returns `Promise.reject(new QuickLookNotSupported('Quick Look is iOS-only'))`. **Acceptance**: matching slice of T019 green.
- [ ] T021 [P] [US3] Implement `src/native/quicklook.web.ts`: same shape as `quicklook.android.ts`. MUST not import `expo-modules-core`. **Acceptance**: matching slice of T019 green; web bundle does not pull in any native-module symbol at evaluation time (FR-013 / SC-007 carryover).
- [ ] T022 [US3] Implement `src/native/quicklook.ts` (iOS path): use `requireOptionalNativeModule('QuickLook')`; gate on `Platform.OS === 'ios'`; serialise `present()` calls through a closure-scoped `enqueue` helper inherited verbatim from `src/native/background-tasks.ts` / `src/native/spotlight.ts`. Throw `QuickLookNotSupported` when the native module is null. Make T019 fully green. **Acceptance**: T019 green; no top-level native module access at module-evaluation time on non-iOS.

---

## Phase 7: Implementation — `usePickedDocuments` hook

**Purpose**: The single public surface consumed by all three screen variants (FR-012). Owns load / persist / mutate / filter cycle; tolerates AsyncStorage and `QuickLookNotSupported` errors via an inline `onError` channel.

### Tests (RED)

- [ ] T023 [US1] [US4] Write `test/unit/modules/documents-lab/hooks/usePickedDocuments.test.tsx` covering:
  1. Mount calls `documents-store.load` exactly once and rehydrates `files` / `filter` from persisted state.
  2. `add(entry)` appends, persists, and exposes the new entry on the next render.
  3. `add(entry)` with `filter === 'images'` and a `text/markdown` entry — entry is stored but hidden until `setFilter('all'|'text')` (FR-004 + FR-010).
  4. `remove(id)` removes only that id; persists; does NOT call any file-system delete.
  5. `clear()` empties `files`; persists `{ files: [], filter }` (filter retained).
  6. `setFilter(value)` updates filter; persists; visible `files` recompute via `filterMatchesEntry`.
  7. AsyncStorage `getItem` rejection → hook returns empty list, no crash, `onError` invoked once.
  8. AsyncStorage `setItem` rejection → mutation reverts in-memory state; `onError` invoked once.
  9. Mutations are reducer-serialised: two synchronous `add()` calls in the same tick result in two distinct entries in submission order.

  RED until the hook exists. **Acceptance**: ≥9 assertions; module-not-found.

### Implementation (GREEN)

- [ ] T024 [US1] [US4] Implement `src/modules/documents-lab/hooks/usePickedDocuments.ts`. Public surface: `{ files, visibleFiles, filter, add, remove, clear, setFilter, error }`. Use `useReducer` for serialised mutations; call `documents-store.load` in a `useEffect` on mount; call `documents-store.save` after every accepted mutation. Make T023 pass. **Acceptance**: T023 green; the hook is the ONLY file in the module that imports `documents-store` runtime APIs (FR-012).

---

## Phase 8: Implementation — UI Components (7 files)

**Purpose**: Seven presentational components consumed by the three screen variants. All chrome via `ThemedView` / `ThemedText` and `Spacing` tokens (Constitution II / IV).

### Tests (RED) — parallelisable across files

- [ ] T025 [P] [US1] Write `test/unit/modules/documents-lab/components/PickDocumentsCard.test.tsx`: CTA label `'Open documents'`; tap calls mocked `expo-document-picker.getDocumentAsync` with `type` derived from current filter via `pickerTypeForFilter`; cancellation result (`canceled: true`) does not call `onAdd`. RED until T032.
- [ ] T026 [P] [US2] Write `test/unit/modules/documents-lab/components/BundledSamplesCard.test.tsx`: renders exactly 4 tiles in row-major order matching `SAMPLES`; tap appends one row via `onAdd`; tapping the same tile twice appends two distinct rows. RED until T033.
- [ ] T027 [P] [US4] Write `test/unit/modules/documents-lab/components/FilesList.test.tsx`: renders 0 / 1 / N rows; empty-state line per filter (`'No files yet'`, `'No image files in your list'`, `'No text files in your list'`, `'No PDF files in your list'`); newest-first ordering matches store. RED until T034.
- [ ] T028 [P] [US3] [US4] Write `test/unit/modules/documents-lab/components/FileRow.test.tsx`: renders `name` + mime label + `formatSize(size)` + 3 buttons (Preview / Share / Delete); tap Preview on iOS calls `quicklook.present` with the entry's `uri`; tap Preview on non-iOS renders inline `QuickLookFallback` (no crash); tap Share calls `expo-sharing.shareAsync(uri)`; tap Delete calls `onRemove(id)` and does NOT call any file-system delete API. RED until T035.
- [ ] T029 [P] [US4] Write `test/unit/modules/documents-lab/components/TypeFilterControl.test.tsx`: 4 mutually-exclusive segments labelled `All` / `Images` / `Text` / `PDF`; selecting each calls `onChange` with the corresponding `DocumentFilter` value; the active segment carries an `accessibilityState.selected === true`. RED until T036.
- [ ] T030 [P] [US3] Write `test/unit/modules/documents-lab/components/QuickLookFallback.test.tsx`: message string mentions `'iOS'` and `'Quick Look'`; offers a `Share` action that calls the supplied `onShare` callback. RED until T037.
- [ ] T031 [P] [US3] Write `test/unit/modules/documents-lab/components/IOSOnlyBanner.test.tsx`: message string mentions `'iOS-only'`; renders a single `ThemedView` with the warning theme token; no buttons. RED until T038.

### Implementation (GREEN) — parallelisable across files

- [ ] T032 [P] [US1] Implement `src/modules/documents-lab/components/PickDocumentsCard.tsx` per T025. Calls `expo-document-picker.getDocumentAsync({ type: pickerTypeForFilter(filter), copyToCacheDirectory: true })`. **Acceptance**: T025 green; `StyleSheet.create()` only.
- [ ] T033 [P] [US2] Implement `src/modules/documents-lab/components/BundledSamplesCard.tsx` per T026 (2x2 grid of tiles). **Acceptance**: T026 green.
- [ ] T034 [P] [US4] Implement `src/modules/documents-lab/components/FilesList.tsx` per T027. Uses `FileRow` for each row. **Acceptance**: T027 green.
- [ ] T035 [P] [US3] [US4] Implement `src/modules/documents-lab/components/FileRow.tsx` per T028. Imports `quicklook` lazily via `Platform.select` so non-iOS bundles do not pull `quicklook.ts`. **Acceptance**: T028 green.
- [ ] T036 [P] [US4] Implement `src/modules/documents-lab/components/TypeFilterControl.tsx` per T029 (segmented control over `DocumentFilter`). **Acceptance**: T029 green.
- [ ] T037 [P] [US3] Implement `src/modules/documents-lab/components/QuickLookFallback.tsx` per T030. **Acceptance**: T030 green.
- [ ] T038 [P] [US3] Implement `src/modules/documents-lab/components/IOSOnlyBanner.tsx` per T031. **Acceptance**: T031 green.

---

## Phase 9: Implementation — Manifest + Three Screen Variants

### Tests (RED)

- [ ] T039 Write `test/unit/modules/documents-lab/manifest.test.ts` per `contracts/manifest.contract.ts` invariants M1..M6: `id === 'documents-lab'`; `title === 'Documents Lab'`; `platforms` is `['ios','android','web']`; `minIOS === '11.0'`; `render` is a function; `icon.ios` and `icon.fallback` are non-empty strings. RED until T043.
- [ ] T040 Write `test/unit/modules/documents-lab/screen.test.tsx` (iOS variant): panels render in fixed order — `PickDocumentsCard` → `BundledSamplesCard` → `TypeFilterControl` → `FilesList`; no `IOSOnlyBanner` and no top-level `QuickLookFallback` on iOS; isolation from 013/014/027/028/029/030/031 paths verified by snapshot of imported module symbols. RED until T044.
- [ ] T041 Write `test/unit/modules/documents-lab/screen.android.test.tsx` (Android variant): panels render in order `PickDocumentsCard` → `BundledSamplesCard` → `TypeFilterControl` → `FilesList` → `IOSOnlyBanner` → `QuickLookFallback`; tapping a row's Preview button does NOT crash (renders inline fallback). RED until T045.
- [ ] T042 Write `test/unit/modules/documents-lab/screen.web.test.tsx` (Web variant): same render set as android; assert via Jest module mock that `src/native/quicklook.ts` (iOS path) is NOT pulled in by the web bundle at module-evaluation time (SC-007 carryover). RED until T046.

### Implementation (GREEN)

- [ ] T043 Implement `src/modules/documents-lab/index.tsx` exporting the `DocumentsManifest` constant per `contracts/manifest.contract.ts`. The `render` function returns the platform-resolved screen via expo-router's variant resolution (or a thin `Platform.select` over the three screen modules). **Acceptance**: T039 green.
- [ ] T044 Implement `src/modules/documents-lab/screen.tsx` (iOS variant): consume `usePickedDocuments`; render the four panels in order; pass `onAdd` / `onRemove` / `onClear` / `onPreview` / `onShare` / `filter` / `setFilter` props down. **Acceptance**: T040 green.
- [ ] T045 Implement `src/modules/documents-lab/screen.android.tsx`: same as iOS variant + `IOSOnlyBanner` + `QuickLookFallback` rendered above the (absent) Quick Look section. **Acceptance**: T041 green.
- [ ] T046 Implement `src/modules/documents-lab/screen.web.tsx`: structurally identical to the Android variant; MUST NOT import `src/native/quicklook.ts` at module-evaluation time — use `quicklook.web.ts` exclusively. **Acceptance**: T042 green.

---

## Phase 10: Implementation — Plugin (`plugins/with-documents/index.ts`)

**Purpose**: Single `withInfoPlist` mutation setting `LSSupportsOpeningDocumentsInPlace` and `UIFileSharingEnabled` to `true`. Idempotent, commutative with all 31 prior plugins, scope-limited per P1..P9.

### Tests (RED)

- [ ] T047 Write `test/unit/plugins/with-documents/index.test.ts` covering all nine invariants (P1..P9):
  1. **P2 / P4 — create-if-absent / overwrite-if-different**: virgin Info.plist → both managed keys set to `true`. Pre-set to `false` → overwritten to `true`. Other keys byte-identical (`toEqual` on the remainder).
  2. **P3 — no-op-if-already-true**: pre-set both keys to `true` → output is `toEqual` to the input plist.
  3. **P5 — idempotent**: running plugin twice in succession yields a `toEqual`-identical Info.plist (NOT just `toContain`).
  4. **P6 — coexistence with all 31 prior plugins**: load a reference `app.json` listing all 31 prior plugin entries plus `./plugins/with-documents` last; run the full pipeline; assert (a) both managed keys are `true` AND (b) removing them from both observed and reference plist yields a `toEqual`-identical remainder. Reference fixture committed alongside the test.
  5. **P7 — commutativity** across ≥3 sampled orderings (before-all, middle, after-all) — final plist is `toEqual`-identical across all three orderings.
  6. **P8 — no `pbxproj` mutation**: spy on `withXcodeProject` — assert it is NOT called by the plugin. The plugin's only mod call is `withInfoPlist`.
  7. **P9 — no entitlement mutation**: spy on `withEntitlementsPlist` — assert it is NOT called.
  8. **P1 — scope**: assert the plugin does NOT touch `NSUserActivityTypes` (031), `BGTaskSchedulerPermittedIdentifiers` (030), `UIBackgroundModes` (025/030), any `NS*UsageDescription` key, or any entitlement.

  RED until `plugins/with-documents/index.ts` exists. **Acceptance**: ≥8 distinct assertions, including at least one `toEqual` for idempotency, one for coexistence, and one for commutativity. **Spec ref**: FR-015, FR-016, contract `with-documents-plugin.contract.ts` P1..P9.

### Implementation (GREEN)

- [ ] T048 Implement `plugins/with-documents/index.ts` per `contracts/with-documents-plugin.contract.ts`: a single `withInfoPlist` mod that sets `KEY_OPEN_IN_PLACE` and `KEY_FILE_SHARING` to `true`. Export both the plugin (default) and the two key constants for the test fixture. NO `withXcodeProject`, NO `withEntitlementsPlist`. **Acceptance**: T047 fully green; plugin file < 50 LOC; zero `eslint-disable` directives (FR-020).

---

## Phase 11: Native — `QuickLookPresenter.swift` (on-device verification)

**Purpose**: Swift wrapper around `QLPreviewController` exposing `present(uri:)` + `isAvailable()`. Cannot be unit-tested on Windows; on-device verification documented in `quickstart.md` (Constitution V exemption).

- [ ] T049 [US3] Implement `native/ios/documents/QuickLookPresenter.swift`:
  1. `@available(iOS 11.0, *)` class implementing `QLPreviewControllerDataSource`.
  2. `isAvailable() -> Bool` — returns `true` on iOS 11+.
  3. `present(uri: String) -> Promise<{ shown: Bool }>` — resolves a `URL`, instantiates `QLPreviewController`, sets `dataSource = self`, presents modally over `UIApplication.shared.keyWindow?.rootViewController` (with first-presented-controller traversal). Resolves `{ shown: true }` from `viewDidAppear`; rejects with one of the documented codes (`'invalid-uri' | 'unreadable' | 'no-root-view-controller' | 'preview-failed'`) per data-model.md Entity 5.
  4. Self-retains via associated object for the duration of the sheet; releases on dismissal.
  5. Registers under the native module name `'QuickLook'` (matches `NATIVE_MODULE_NAME`).

  **Acceptance**: file compiles inside an iOS 11+ Expo build; on-device verification deferred to quickstart.md walkthrough. No corresponding Jest task — this is the documented Swift-on-Windows exemption.

- [ ] T050 [US3] Append a stanza to `quickstart.md` (if not already present) documenting the manual on-device verification: launch the Documents Lab module on an iOS 11+ device, pick a sample, tap Preview, confirm the Quick Look sheet appears within 300 ms (SC), dismiss, repeat across all four sample types + a picker-sourced PDF.

---

## Phase 12: Integration — Registry + `app.json`

- [ ] T051 Add `documents-lab` to `src/modules/registry.ts`: +1 import line (`import { documentsLab } from './documents-lab';` — or named export equivalent), +1 array entry. Order: append at end of the registry array. **Acceptance**: `MODULES.length` grows by exactly 1 (M6 / SC-005); existing module ordering preserved; `pnpm typecheck` clean.
- [ ] T052 Add `./plugins/with-documents` to `app.json`'s `expo.plugins` array. Order: append at end of the plugins array (after 031's entry). **Acceptance**: array length grows by exactly 1; all 31 prior entries byte-identical; `npx expo prebuild --clean --no-install` (sandbox-only smoke check; not committed) succeeds locally.

---

## Phase 13: Polish — Quality Gates + Quickstart

- [ ] T053 Run `pnpm format` and commit any formatting deltas (no logic changes). **Acceptance**: `pnpm format --check` exits 0.
- [ ] T054 Run `pnpm check` (lint + typecheck + tests as wired by the repo's `check` script). **Acceptance**: green; **≥ +18 new Jest suites** vs. branch-start baseline (Phase plan target); zero `eslint-disable` directives in any file added or modified by this feature (FR-020); zero TypeScript errors.
- [ ] T055 Walk through `specs/032-document-picker-quicklook/quickstart.md` end-to-end on an iOS 11+ device (or simulator with a real Files-app entry) AND on an Android device / Web browser:
  1. Launch Documents Lab from the registry.
  2. iOS: pick a document via `PickDocumentsCard`; confirm row appears; tap Preview; confirm Quick Look sheet appears < 300 ms; dismiss; tap Share; tap Delete; confirm row removed.
  3. iOS: tap each of the four bundled samples; confirm four rows appended; preview each.
  4. iOS: cycle `TypeFilterControl` through All / Images / Text / PDF; confirm visible rows and empty-state copy.
  5. Android / Web: confirm `IOSOnlyBanner` + `QuickLookFallback` render; tap Preview → fallback renders inline (no crash); Share works via `expo-sharing`.
  6. Kill / relaunch app; confirm rehydration matches pre-kill state (FR-009 / FR-011).

  **Acceptance**: every step in `quickstart.md` passes; any deviation captured as a follow-up task before merge.

- [ ] T056 **Final checkpoint commit** marker: `feat(032): documents-lab module + with-documents plugin + QuickLookPresenter`.

---

## Dependency Graph (high-level)

```
Phase 1 (setup)
  └─> Phase 2 (quicklook.types) ─┐
       └─> Phase 6 (bridge runtimes) ─┐
  └─> Phase 3 (mime-types) ──────────┼─> Phase 7 (usePickedDocuments)
  └─> Phase 4 (samples + assets) ────┤        │
  └─> Phase 5 (documents-store) ─────┘        │
                                              ├─> Phase 8 (components)
                                              │     │
                                              │     └─> Phase 9 (manifest + screens)
                                              │
Phase 10 (plugin)  — independent of Phases 2–9; depends only on Phase 1
Phase 11 (Swift)   — independent; depends only on Phase 1 + Phase 2 (module name literal)
Phase 12 (registry + app.json) — depends on Phase 9 + Phase 10
Phase 13 (polish)  — depends on Phase 12
```

## Parallelisation Hints

- **Phase 1**: T001..T004 in parallel; T005 sequential (mutates `package.json`); T006 last.
- **Phase 4**: T011..T014 (sample asset creation) in parallel.
- **Phase 6**: T020 + T021 in parallel (different files, no native deps); T022 after both.
- **Phase 8 RED**: T025..T031 fully parallel (seven independent test files).
- **Phase 8 GREEN**: T032..T038 fully parallel (seven independent component files).
- **Phase 10** can run in parallel with Phases 2–9 once Phase 1 completes (no shared files).
- **Phase 11** can run in parallel with Phases 3–10 once Phase 2 completes (only needs the native module name literal).

## Coverage Matrix (file → task)

| File / artefact | RED test task | GREEN impl task |
|---|---|---|
| `src/native/quicklook.types.ts` | T007 | T008 |
| `src/modules/documents-lab/mime-types.ts` | T009 | T010 |
| `src/modules/documents-lab/samples/{hello.txt,note.md,data.json,icon.png}` | — | T011..T014 |
| `src/modules/documents-lab/samples.ts` | T015 | T016 |
| `src/modules/documents-lab/documents-store.ts` | T017 | T018 |
| `src/native/quicklook.{ts,android.ts,web.ts}` | T019 | T020..T022 |
| `src/modules/documents-lab/hooks/usePickedDocuments.ts` | T023 | T024 |
| `src/modules/documents-lab/components/PickDocumentsCard.tsx` | T025 | T032 |
| `src/modules/documents-lab/components/BundledSamplesCard.tsx` | T026 | T033 |
| `src/modules/documents-lab/components/FilesList.tsx` | T027 | T034 |
| `src/modules/documents-lab/components/FileRow.tsx` | T028 | T035 |
| `src/modules/documents-lab/components/TypeFilterControl.tsx` | T029 | T036 |
| `src/modules/documents-lab/components/QuickLookFallback.tsx` | T030 | T037 |
| `src/modules/documents-lab/components/IOSOnlyBanner.tsx` | T031 | T038 |
| `src/modules/documents-lab/index.tsx` (manifest) | T039 | T043 |
| `src/modules/documents-lab/screen.tsx` | T040 | T044 |
| `src/modules/documents-lab/screen.android.tsx` | T041 | T045 |
| `src/modules/documents-lab/screen.web.tsx` | T042 | T046 |
| `plugins/with-documents/{index.ts,package.json}` | T047 | T002 + T048 |
| `native/ios/documents/QuickLookPresenter.swift` | (on-device, T055) | T049 |
| `src/modules/registry.ts` (additive) | covered by T040 isolation snapshot | T051 |
| `app.json` (additive) | covered by T047 P6 fixture | T052 |
| `package.json` (+2 deps) | — | T005 |

## Test Baseline Tracking

- New Jest test files: 18 (T007, T009, T015, T017, T019, T023, T025..T031, T039..T042, T047) — meets the plan's **≥ +18 suites** target.
- Swift on-device verification: T049 + T055 (Constitution V exemption).
