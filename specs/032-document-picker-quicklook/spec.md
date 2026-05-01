# Feature Specification: Document Picker + Quick Look Module

**Feature Branch**: `032-document-picker-quicklook`
**Feature Number**: 032
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 11+ module showcasing the Document Picker
(`UIDocumentPickerViewController` via `expo-document-picker`) and Quick
Look preview (`QLPreviewController`) for files coming from iCloud
Drive, the Files app, and third-party document providers. Adds a
"Documents Lab" card to the iOS Showcase registry, an in-app screen
with: a Pick Documents card, a Bundled Samples card (4 small files
shipped with the app), a unified Files List with per-row Preview /
Share / Delete actions, a Quick Look demo (native bridge on iOS, soft
fallback on Android/Web), and a Type filter (All / Images / Text /
PDF) that simultaneously filters the list and constrains the picker.
Native side is a thin Swift wrapper around `QLPreviewController`
(`QuickLookPresenter`) plus a JS bridge (`src/native/quicklook.ts`)
with non-iOS stubs that throw `QuickLookNotSupported`. An Expo config
plugin ensures `Info.plist` keys `LSSupportsOpeningDocumentsInPlace`
and `UIFileSharingEnabled` are set to `true`. Branch parent is
`031-spotlight-indexing`. Additive-only: registry +1, `app.json`
`plugins` +1; coexists with all 31 prior plugins.

## Overview

The Documents module ("Documents Lab") is a feature card in the iOS
Showcase registry (`id: 'documents-lab'`, label `"Documents Lab"`,
`platforms: ['ios','android','web']`, `minIOS: '11.0'`). Tapping the
card opens a single screen with five panels arranged in a fixed
top-to-bottom order:

1. **PickDocumentsCard** — explains what the iOS Document Picker is
   (a system-provided file browser into iCloud Drive, the local Files
   app, and any installed document-provider extension) and exposes a
   single **Open documents** CTA. The CTA invokes
   `expo-document-picker` so the same code path also works on Android
   and Web. Picked files are appended to the Files List below.
2. **BundledSamplesCard** — a 2x2 grid of four sample files shipped
   inside the app bundle under `src/modules/documents-lab/samples/`:
   `hello.txt` (small UTF-8 text), `note.md` (markdown text),
   `data.json` (small JSON), and `icon.png` (small PNG). Tapping any
   sample copies its descriptor into the Files List. PDF samples are
   intentionally **not** bundled to keep the binary small; PDF still
   appears in the Type filter and works for picked PDFs.
3. **FilesList** — the unified list of every file the user has either
   picked from the Document Picker or added from the Bundled Samples
   card during the lifetime of this module. Each row (`FileRow`)
   shows: file name, mime type label, formatted size, and three
   per-row actions: **Preview**, **Share**, **Delete from list**.
   The list is persisted to `AsyncStorage` under the key
   `spot.documents.list` and rehydrated on screen mount. Persistence
   is tolerant: if the stored payload fails to parse or references a
   file that no longer exists at its URI, that entry is dropped
   silently and the rest of the list still loads.
4. **QuickLookFallback / Quick Look demo** — on iOS, the **Preview**
   action on a `FileRow` calls the Swift native bridge
   (`QuickLookPresenter.present(uri:)`) which presents
   `QLPreviewController` modally over the current root view
   controller. On Android and Web the JS bridge throws a typed
   `QuickLookNotSupported` error and the screen renders a
   `QuickLookFallback` panel explaining the limitation and offering
   the **Share** action as a degraded path (which uses
   `expo-sharing`).
5. **TypeFilterControl** — a segmented control with four options:
   **All**, **Images**, **Text**, **PDF**. Changing the segment
   simultaneously (a) filters which rows are visible in the Files
   List by mime-type family and (b) restricts the next Document
   Picker invocation to the matching UTIs / mime types (e.g.
   `Images` → `public.image` on iOS, `image/*` on
   Android/Web; `Text` → `public.plain-text` + `public.text`,
   `text/*`; `PDF` → `com.adobe.pdf`, `application/pdf`; `All` →
   no constraint).

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry (registry size +1). No existing entry is modified.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-documents`). Coexists with all 31 prior plugins
   (007 / 013 / 014 / 019 / 023 / 025 / 026 / 027 / 028 / 029 / 030 /
   031 and every earlier plugin already in the array).
3. `app.json` `Info.plist` augmentation — the plugin sets
   `LSSupportsOpeningDocumentsInPlace = true` and
   `UIFileSharingEnabled = true`. Existing keys are preserved; if
   either key already exists with the desired value the plugin is a
   no-op (idempotent). If either exists with a different value the
   plugin overwrites only its two managed keys and leaves all other
   keys untouched.
4. New native sources under `native/ios/documents/` are linked via
   the existing autolinking pipeline. No `Podfile` edits are
   required.
5. Two new dependencies are introduced via `npx expo install`:
   `expo-document-picker` and `expo-sharing`. No other dependency
   versions move.

Cross-platform parity: Android and Web open the screen and render an
`IOSOnlyBanner` above the Quick Look section explaining that native
preview is iOS-only; the Pick Documents card and the Files List
remain fully functional on every platform via `expo-document-picker`
and `expo-sharing`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pick a document from the Files app and preview it (Priority: P1)

A user taps the Documents Lab card, taps **Open documents**, picks a
PDF from iCloud Drive, sees it appear in the Files List with the
correct name / mime / size, taps **Preview**, and the system Quick
Look sheet renders the PDF.

**Why this priority**: This is the headline path of the module — it
demonstrates both APIs (Document Picker and Quick Look) in a single
flow. Without it the module has no reason to exist.

**Independent Test**: Build and run on an iOS 11+ device, tap the
card, pick any document, tap Preview. The native QLPreviewController
must appear and dismiss cleanly.

**Acceptance Scenarios**:

1. **Given** the Files List is empty, **When** the user taps **Open
   documents** and selects a single file in the system picker,
   **Then** exactly one new row appears in the Files List with
   correct name, mime type, size, and date.
2. **Given** at least one row exists in the Files List, **When** the
   user taps **Preview** on that row on iOS, **Then**
   `QLPreviewController` is presented modally and the
   `present(uri:)` promise resolves with `{ shown: true }` after the
   sheet appears.
3. **Given** a previously picked file is in the Files List and the
   user fully closes and re-opens the app, **When** the screen
   re-mounts, **Then** the row is rehydrated from
   `spot.documents.list` and remains tappable for **Preview** and
   **Share** as long as the underlying URI is still resolvable.

---

### User Story 2 — Try the module without leaving the app (Priority: P2)

A user with no documents in iCloud Drive can still exercise every
part of the module by tapping a bundled sample.

**Why this priority**: Reviewers and first-time users should be able
to see Quick Look working in under five seconds with zero setup.
Bundled samples remove every external dependency for the demo path.

**Independent Test**: Fresh install, tap card, tap any of the four
bundled sample tiles. The sample appears in the Files List and
**Preview** works on iOS / **Share** works everywhere.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the user taps the
   `icon.png` tile, **Then** a row with name `icon.png`, mime
   `image/png`, and the file's actual size appears in the Files List.
2. **Given** a sample row is in the list, **When** the user taps
   **Preview** on iOS, **Then** Quick Look renders the bundled file
   directly from the app bundle URI without any copy step.
3. **Given** the same sample is tapped twice, **When** the second tap
   resolves, **Then** two distinct rows exist (duplicates are
   allowed; the user explicitly opted in twice).

---

### User Story 3 — Filter the list and the picker by type (Priority: P2)

A user toggles the Type filter to **Images** to find a picture they
just picked, and the next time they open the picker only image types
are offered.

**Why this priority**: Demonstrates that the module's filter is wired
to *both* the rendered list and the picker UTIs — a non-trivial UX
detail that distinguishes a real implementation from a toy.

**Independent Test**: With a mix of image / text / pdf rows in the
list, switch the segmented control and confirm visible rows match
the filter; then tap **Open documents** and confirm the system
picker only offers files of that family.

**Acceptance Scenarios**:

1. **Given** the Files List contains one PNG, one TXT, and one PDF,
   **When** the user selects **Images**, **Then** only the PNG row
   is visible.
2. **Given** the filter is set to **Text**, **When** the user taps
   **Open documents**, **Then** the picker is invoked with the text
   UTIs / mime constraint (`public.plain-text`, `public.text`,
   `text/*`) and image / pdf items are not selectable in the system
   sheet.
3. **Given** the filter is set to **All**, **When** the picker is
   invoked, **Then** no UTI / mime constraint is applied.

---

### User Story 4 — Cross-platform graceful fallback (Priority: P3)

An Android or Web user opens the same screen, picks a document, and
gets a clear, non-crashing fallback when they tap **Preview**.

**Why this priority**: The Showcase contract requires every module
to render on Android and Web. This story ensures the bridge surface
fails predictably with a typed error and the UI explains it.

**Independent Test**: Run on Android and Web. Pick a file. Tap
**Preview**. The app must not crash; the `QuickLookFallback` panel
must explain the limitation and the **Share** action must still
work.

**Acceptance Scenarios**:

1. **Given** the screen is rendered on Android, **When** the JS
   bridge `quicklook.isAvailable()` is called, **Then** it returns
   `false` synchronously.
2. **Given** the screen is rendered on Web, **When** the user taps
   **Preview**, **Then** the bridge throws `QuickLookNotSupported`,
   the error is caught by the row, and `QuickLookFallback` is
   rendered with an explanatory message and the platform's native
   share action remains available.
3. **Given** the screen is rendered on Android or Web, **Then** the
   `IOSOnlyBanner` is visible above the Quick Look section; it is
   absent on iOS.

---

### Edge Cases

- **Picker cancelled** — `expo-document-picker` resolves with a
  cancellation result; the Files List is unchanged and no error is
  surfaced.
- **Multiple-selection picker** — picking N files appends N rows in
  selection order; the operation is atomic from the user's
  perspective (either all rows are appended or none, on error).
- **AsyncStorage payload corrupted** — `documents-store` catches the
  parse error, logs once at debug level, and starts from an empty
  list; it does not crash the screen.
- **Stored URI no longer resolves** (file removed from iCloud, app
  reinstalled, sandbox path drift) — the row is dropped during
  rehydration; remaining valid rows still load.
- **Quick Look fails to present on iOS** (e.g. unsupported file
  type) — `QuickLookPresenter.present(uri:)` rejects the promise with
  a typed error; the row surfaces an inline error and **Share**
  remains available as a fallback.
- **Plugin re-applied** — running `expo prebuild` twice on the same
  project keeps `Info.plist` byte-identical after the second run.
- **Plugin coexistence** — applying `with-documents` after all 31
  prior plugins yields the same `Info.plist` keys regardless of
  ordering, except for the two keys this plugin manages.
- **Filter switch with hidden rows** — switching from **All** to
  **PDF** with no PDFs present renders an empty-state line ("No PDF
  files in your list") rather than a blank panel.
- **Delete from list** — only removes the row from the in-memory
  store and `spot.documents.list`; it never deletes the underlying
  file in iCloud or Files.
- **Share on iOS** — uses `expo-sharing`; if the file URI is a
  bundled sample, the share sheet still works because the URI is a
  valid file URL inside the app bundle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The module MUST register a single new entry in
  `src/modules/registry.ts` with `id: 'documents-lab'`, label
  `"Documents Lab"`, `platforms: ['ios','android','web']`, and
  `minIOS: '11.0'`.
- **FR-002**: Tapping the card MUST navigate to the Documents Lab
  screen which renders, in order: `PickDocumentsCard`,
  `BundledSamplesCard`, `TypeFilterControl`, `FilesList`, and
  (on non-iOS only) `IOSOnlyBanner` + `QuickLookFallback`.
- **FR-003**: `PickDocumentsCard` MUST invoke
  `expo-document-picker.getDocumentAsync` with a `type` argument
  derived from the current `TypeFilterControl` value.
- **FR-004**: Picked documents MUST be appended (not replaced) to the
  existing Files List in the order returned by the picker.
- **FR-005**: `BundledSamplesCard` MUST render exactly four sample
  tiles loaded from `src/modules/documents-lab/samples.ts`. Tapping a
  tile appends one row to the Files List.
- **FR-006**: Each `FileRow` MUST display name, mime type label, and
  human-readable size, plus three actions: **Preview**, **Share**,
  **Delete from list**.
- **FR-007**: On iOS, **Preview** MUST call
  `quicklook.present(uri)`; on Android / Web it MUST render
  `QuickLookFallback` instead.
- **FR-008**: **Share** MUST call `expo-sharing.shareAsync` on every
  platform that supports it; if not supported, the action button is
  disabled.
- **FR-009**: **Delete from list** MUST remove the row from the
  in-memory `documents-store` and from `AsyncStorage` key
  `spot.documents.list`. It MUST NOT touch the underlying file.
- **FR-010**: `TypeFilterControl` MUST expose four mutually
  exclusive options (All / Images / Text / PDF) and MUST drive both
  the visible rows in `FilesList` and the picker `type` argument.
- **FR-011**: `documents-store` MUST persist the list to
  `AsyncStorage` under the key `spot.documents.list` after every
  mutation and MUST rehydrate on screen mount with tolerant parsing
  (parse failure → empty list; missing-URI rows → dropped).
- **FR-012**: `usePickedDocuments` MUST expose `{ files, add, remove,
  clear, filter, setFilter }` and MUST be the only public surface
  consumed by `screen.tsx`, `screen.android.tsx`, and `screen.web.tsx`.
- **FR-013**: A native Swift class
  `native/ios/documents/QuickLookPresenter.swift` MUST wrap
  `QLPreviewController` and expose `present(uri: String) -> Promise<{
  shown: Bool }>` to JS.
- **FR-014**: `src/native/quicklook.ts` MUST expose `present(uri:
  string): Promise<{ shown: boolean }>` and `isAvailable(): boolean`,
  and MUST throw a typed `QuickLookNotSupported` error on Android and
  Web.
- **FR-015**: `plugins/with-documents/` MUST set
  `LSSupportsOpeningDocumentsInPlace = true` and
  `UIFileSharingEnabled = true` in `Info.plist` and MUST be
  idempotent across multiple `expo prebuild` runs.
- **FR-016**: The plugin MUST coexist with all 31 prior plugins in
  `app.json`'s `plugins` array; ordering relative to those plugins
  MUST NOT change the resulting `Info.plist` for keys outside this
  plugin's scope.
- **FR-017**: On Android and Web, `IOSOnlyBanner` MUST be visible
  above the Quick Look section; on iOS it MUST NOT render.
- **FR-018**: Two new runtime dependencies MUST be added via
  `npx expo install`: `expo-document-picker` and `expo-sharing`. No
  other dependency versions may move.
- **FR-019**: All native bridge usage in tests MUST be mocked at the
  import boundary (`src/native/quicklook.ts`,
  `expo-document-picker`, `expo-sharing`). No test may exercise a
  real native module.
- **FR-020**: No `eslint-disable` directive may be introduced
  anywhere in the feature's source or test files.

### Key Entities *(include if feature involves data)*

- **DocumentEntry** — one row in the Files List. Attributes: `id`
  (stable, generated client-side), `name`, `uri`, `mimeType`, `size`
  (bytes), `addedAt` (ISO timestamp), `source` (`'picker' |
  'sample'`).
- **DocumentFilter** — `'all' | 'images' | 'text' | 'pdf'`; drives
  both list visibility and picker UTI / mime constraint.
- **DocumentsStoreState** — `{ files: DocumentEntry[]; filter:
  DocumentFilter }`; persisted under `spot.documents.list`.
- **BundledSample** — static descriptor for a file shipped under
  `src/modules/documents-lab/samples/`. Attributes: `name`,
  `mimeType`, `size`, `requireAsset` (the bundled asset reference).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a fresh install on an iOS 11+ device, a user can
  tap the card, pick one document, and see Quick Look render in
  under 10 seconds end-to-end.
- **SC-002**: All four bundled samples render in Quick Look on iOS
  without any file-copy step and without any "could not load"
  error.
- **SC-003**: `expo prebuild` run twice in succession produces a
  byte-identical `Info.plist`; `with-documents` introduces exactly
  two managed keys and modifies no others.
- **SC-004**: Test suite covers, at minimum, `mime-types`,
  `samples`, `documents-store`, `usePickedDocuments`, all 7
  components (`PickDocumentsCard`, `BundledSamplesCard`, `FilesList`,
  `FileRow`, `TypeFilterControl`, `QuickLookFallback`,
  `IOSOnlyBanner`), all 3 screen variants (`screen.tsx`,
  `screen.android.tsx`, `screen.web.tsx`), the JS bridge
  (`src/native/quicklook.ts`), the plugin (idempotency +
  coexistence with all 31 prior plugins), and the registry
  manifest. `pnpm check` exits green with zero warnings.
- **SC-005**: Registry size is exactly previous + 1 after the
  feature lands; `app.json` `plugins` array length is exactly
  previous + 1.
- **SC-006**: On Android and Web, tapping **Preview** never crashes
  the app; the `QuickLookNotSupported` error is caught and
  `QuickLookFallback` renders within 100 ms of the tap.
- **SC-007**: AsyncStorage corruption (manually written invalid
  JSON to `spot.documents.list`) MUST result in the screen mounting
  with an empty list and no error toast.

## Assumptions

- iOS deployment target is already 11.0 or higher; no project-level
  bump is required.
- `expo-document-picker` and `expo-sharing` are compatible with the
  current Expo SDK pinned by the project; `npx expo install` will
  resolve the correct versions.
- The existing iOS Showcase registry pattern (`src/modules/registry.ts`,
  one entry per module, ordered by feature number) is preserved and
  extended without refactor.
- Bundled sample files are small enough (<50 KB total) that bundling
  them in `src/modules/documents-lab/samples/` adds negligible weight
  to the app binary.
- PDF samples are intentionally out of scope for bundling; the PDF
  branch of the type filter is exercised against picker-sourced files
  in tests via a mocked `expo-document-picker` response.
- `QLPreviewController` is sufficient for the formats this module
  exposes (text, JSON, PNG, picked PDFs); no custom data source
  beyond a single-URI preview item is required.
- The autolinking pipeline already used by prior native modules
  (007 / 013 / 027 / 029 / 030 / 031) handles the new
  `native/ios/documents/` sources without `Podfile` edits.
- Constitution v1.1.0 governs: additive-only integration, no
  `eslint-disable`, native bridges mocked at the import boundary,
  registry growth +1 per feature.
