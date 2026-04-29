# Feature Specification: Share Sheet (UIActivityViewController) Module

**Feature Branch**: `033-share-sheet`
**Feature Number**: 033
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 8+ module showcasing the system Share Sheet
(`UIActivityViewController`) for sharing Text, URL, Image, and File
content, with optional excluded built-in activities, an in-app custom
`UIActivity` ("Copy with prefix") that copies "Spot says: <text>" to
the clipboard via `expo-clipboard`, and an iPad anchor source-view
selector. Adds a "Share Sheet" card to the 006 iOS Showcase registry
(`id: 'share-sheet'`, `platforms: ['ios','android','web']`,
`minIOS: '8.0'`). Native side is a thin Swift wrapper
(`ShareSheetPresenter`) plus a `CopyWithPrefixActivity` `UIActivity`
subclass; JS bridge `src/native/share-sheet.ts` exposes
`present(opts)` and `isAvailable()`. Android and Web delegate to
`expo-sharing` (cross-platform file share) and `navigator.share`
(Web), with a clipboard-copy fallback. Branch parent is
`032-document-picker-quicklook`. Additive-only: registry +1; no
plugin entry is added in `app.json` (the placeholder Expo config
plugin is a no-op and registered only if research confirms a need —
default is to skip the plugin entirely).

## Overview

The Share Sheet module ("Share Sheet") is a feature card in the iOS
Showcase registry (`id: 'share-sheet'`, label `"Share Sheet"`,
`platforms: ['ios','android','web']`, `minIOS: '8.0'`). Tapping the
card opens a single screen with six panels arranged in a fixed
top-to-bottom order:

1. **ContentTypePicker** — a four-segment control that selects which
   kind of content the share sheet will broadcast: **Text**, **URL**,
   **Image**, or **File**. The selection drives which content-input
   panel renders directly below it.
2. **Content input panel** — exactly one of the following, matching
   the active content type:
   - **TextContentInput**: multi-line text field, default
     `"Hello from spot showcase"`.
   - **UrlContentInput**: single-line text field with synchronous URL
     validation, default `https://expo.dev`. Invalid URLs disable the
     Share button and show an inline validation message.
   - **ImageContentPicker**: a 2x2 grid of four bundled sample images
     loaded via `require()` (1x1 PNGs are acceptable; sources may be
     reused from feature 016 / 032). One image is selected at a time.
   - **FileContentPicker**: lists files from the Documents Lab
     (feature 032) when its persisted list is non-empty; otherwise
     falls back to a single bundled sample text file. One file is
     selected at a time.
3. **ExcludedActivitiesPicker** — a checklist of well-known
   `UIActivity.ActivityType` values (Mail, Print, SaveToCameraRoll,
   Message, AddToReadingList, AssignToContact, CopyToPasteboard,
   PostToFacebook, PostToTwitter, AirDrop, OpenInIBooks, Markup,
   etc.). Each item is a checkbox; checked items are passed to
   `UIActivityViewController.excludedActivityTypes`. A **"Hide all"**
   master toggle, when on, marks every built-in activity as excluded
   (the custom activity, if enabled, is not affected).
4. **CustomActivityToggle** — a single switch labelled
   `"Include 'Copy with prefix' custom activity"`. When on, the
   share sheet includes a custom `UIActivity` whose action prepends
   `"Spot says: "` to the text representation of the current content
   and copies the result to the clipboard via `expo-clipboard`.
5. **AnchorSelector (iPad only)** — a 2x2 grid of buttons selecting
   the anchor source view used to position the share sheet popover
   on iPad: **top-left**, **top-right**, **center**, **bottom**. The
   chosen button's frame is passed to the native presenter as the
   anchor rect. On iPhone and on non-iOS platforms this panel is
   hidden entirely (returns `null`).
6. **Share button + ResultLog** — a single primary **Share** button
   invokes the share sheet with the configured content, exclusion
   list, custom-activity flag, and anchor. Below it, a
   **ResultLog** lists the most recent 10 share invocations, newest
   first. Each entry displays: content type, chosen activity type
   string (or `"(none)"` when the user cancelled), outcome
   (`completed` / `cancelled` / `error`), and a timestamp.

The module is fully self-contained inside
`src/modules/share-sheet-lab/`. iOS uses a Swift native bridge for
full `UIActivityViewController` capability (custom activity,
exclusions, anchor); Android and Web use platform-appropriate
fallbacks (`expo-sharing` on Android, `navigator.share` on Web with
a clipboard-copy fallback when the Web Share API is unavailable).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share text or URL via the system Share Sheet (Priority: P1)

A user opens the Share Sheet card, types or accepts the default
text/URL, taps **Share**, picks a destination from the system share
sheet, and observes the outcome logged in the result log.

**Why this priority**: Sharing text and URLs is the most common and
most demoable use of `UIActivityViewController`. It exercises the
full bridge contract end-to-end (content + exclusions + completion
callback) and is the MVP the rest of the feature builds on.

**Independent Test**: With the module screen open and content type
set to **Text** or **URL**, tap **Share**, complete or cancel the
system share sheet, and verify a new entry appears at the top of
the result log with the correct content type, activity type, and
outcome.

**Acceptance Scenarios**:

1. **Given** content type **Text** and the default text, **When**
   the user taps **Share** and selects a destination in the system
   sheet, **Then** the system share sheet presents with the text as
   its activity item, the result log records `{type: 'text',
   activityType: '<chosen>', outcome: 'completed'}`, and no error is
   thrown.
2. **Given** content type **URL** with the default URL, **When**
   the user taps **Share** and dismisses the sheet without choosing
   anything, **Then** the result log records
   `{type: 'url', activityType: '(none)', outcome: 'cancelled'}`.
3. **Given** content type **URL** and the user clears the field,
   **When** the value fails URL validation, **Then** the **Share**
   button is disabled and an inline validation message is shown.

---

### User Story 2 - Exclude specific built-in activities (Priority: P2)

A user wants to hide certain default activities (e.g., Mail, Print)
from the system share sheet — either individually via checkboxes or
all at once via the **Hide all** master toggle — and confirm those
activities do not appear in the next share invocation.

**Why this priority**: Demonstrates a non-trivial
`UIActivityViewController` configuration commonly required by real
apps (e.g., hiding `SaveToCameraRoll` for non-image payloads).

**Independent Test**: With at least one activity checked in the
exclusions picker, invoke **Share** and verify the chosen activity
types are passed to the native bridge and absent from the resulting
sheet.

**Acceptance Scenarios**:

1. **Given** the user checks **Mail** and **Print** in the
   exclusions picker, **When** they tap **Share**, **Then** the
   native bridge receives
   `excludedActivityTypes: ['com.apple.UIKit.activity.Mail',
   'com.apple.UIKit.activity.Print']`.
2. **Given** the user toggles **Hide all** on, **When** they tap
   **Share**, **Then** every built-in activity type from the
   catalog is passed in `excludedActivityTypes` and the share sheet
   shows only the **Copy with prefix** custom activity (if enabled)
   or an empty/minimal sheet otherwise.

---

### User Story 3 - Use the "Copy with prefix" custom activity (Priority: P2)

A user enables the **Copy with prefix** custom activity, taps
**Share**, picks the custom activity from the share sheet, and
confirms the clipboard contains `"Spot says: <text>"`.

**Why this priority**: Custom `UIActivity` subclasses are an
advanced but very common iOS pattern. Including one in the showcase
is a key learning outcome.

**Independent Test**: Toggle **Include 'Copy with prefix' custom
activity** on, choose Text content, tap **Share**, select the
custom activity, then read clipboard contents and verify the
expected prefixed string.

**Acceptance Scenarios**:

1. **Given** custom-activity toggle on and content `"Hello"`,
   **When** the user picks **Copy with prefix** in the share
   sheet, **Then** the clipboard reads `"Spot says: Hello"` and the
   result log records
   `{activityType: '<custom-activity-id>', outcome: 'completed'}`.
2. **Given** custom-activity toggle off, **When** the share sheet
   is presented, **Then** the **Copy with prefix** entry does not
   appear.

---

### User Story 4 - Share image and file content (Priority: P3)

A user selects an image (from the bundled grid) or a file (from
documents-lab or the bundled fallback) and shares it via the system
share sheet.

**Why this priority**: Rounds out the four supported content types
and exercises the file-uri code path. Lower priority than text/URL
because Documents Lab already covers file sharing fundamentals.

**Independent Test**: With content type **Image** and an image
selected, tap **Share** and verify the bridge receives a
PNG-image-or-uri activity item; repeat for **File**.

**Acceptance Scenarios**:

1. **Given** content type **Image** and a bundled image selected,
   **When** the user taps **Share**, **Then** the native bridge
   receives that image as the activity item and the result log
   records the chosen activity type.
2. **Given** content type **File** and the documents-lab list is
   empty, **When** the user opens the file picker panel, **Then**
   the bundled sample text file is shown as the only selectable
   option and is used when the user taps **Share**.

---

### User Story 5 - Anchor share sheet correctly on iPad (Priority: P3)

An iPad user picks an anchor position (top-left, top-right, center,
bottom) and verifies the share sheet popover appears anchored to
the corresponding source-view rect without a runtime crash.

**Why this priority**: iPad-only crash protection — failing to
provide a `popoverPresentationController.sourceView`/`sourceRect`
when the share sheet is presented on iPad causes a hard crash —
is a well-known footgun and worth showcasing.

**Independent Test**: On iPad, select each anchor in turn, tap
**Share**, and verify the share sheet presents without crashing
and visually anchors near the selected button.

**Acceptance Scenarios**:

1. **Given** the device is iPad and anchor is **top-right**,
   **When** the user taps **Share**, **Then** the bridge receives
   a non-null anchor rect derived from the top-right button's
   measured frame and the share sheet presents as a popover.
2. **Given** the device is iPhone, **When** the screen renders,
   **Then** the AnchorSelector panel is not visible and the bridge
   is invoked with `anchor: null`.

---

### User Story 6 - Cross-platform behaviour on Android and Web (Priority: P3)

A user runs the same module on Android or Web. On Android the
basic share works for files via `expo-sharing`; on Web it uses
`navigator.share` if available, otherwise it copies the text/URL
to the clipboard and shows an inline notice. Custom activity,
exclusions, and the anchor selector are unavailable on these
platforms and are visibly disabled or hidden.

**Why this priority**: Constitution v1.1.0 requires graceful
non-iOS fallbacks; this story keeps the module additive and safe
on Android and Web without crashes.

**Independent Test**: Open the module on Android and Web, attempt
each content type, verify expected fallback behaviour and that no
unsupported control is operable.

**Acceptance Scenarios**:

1. **Given** the platform is Android, **When** the user taps
   **Share** with content type **File**, **Then** `expo-sharing`
   is invoked with the file URI and no exception escapes.
2. **Given** the platform is Web and `navigator.share` is
   unavailable, **When** the user taps **Share** with content type
   **Text**, **Then** the text is copied to the clipboard and an
   inline notice is shown; the result log records
   `{outcome: 'completed', activityType: 'web.clipboard-fallback'}`.
3. **Given** any non-iOS platform, **When** the screen renders,
   **Then** AnchorSelector is hidden, ExcludedActivitiesPicker
   options are visibly disabled, and the CustomActivityToggle is
   visibly disabled with an explanatory caption.

### Edge Cases

- URL field contains an invalid URL → **Share** button disabled,
  inline validation error shown, no bridge invocation occurs.
- User cancels the system share sheet → outcome `cancelled`, no
  error, log entry recorded with `activityType: '(none)'`.
- Native bridge throws (e.g., presentation failed because the root
  view controller is unavailable) → outcome `error`, error message
  recorded in the log entry, no crash, no toast spam.
- `Hide all` is on and the custom-activity toggle is off → the
  share sheet is presented anyway (system policy), but it may
  appear empty; this is the iOS-defined behaviour and is not
  treated as an error by the module.
- Documents Lab persisted list is empty → FileContentPicker shows
  the bundled fallback file and the panel does not error.
- iPad orientation changes between anchor selection and share
  invocation → the anchor rect is recomputed at invocation time
  using the latest measured frame, not the value captured at
  selection time.
- ResultLog reaches capacity (10 entries) → the oldest entry is
  dropped to make room for the newest.
- Image selected from grid before any image is loaded → defaults
  to the first bundled image.
- Non-iOS platform attempts to enable custom-activity / exclusions
  → controls are disabled at the UI layer and the bridge ignores
  the corresponding fields.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register a **Share Sheet** card in
  the 006 iOS Showcase registry with `id: 'share-sheet'`,
  `platforms: ['ios','android','web']`, and `minIOS: '8.0'`.
- **FR-002**: Tapping the registry card MUST navigate to the
  Share Sheet module screen.
- **FR-003**: The screen MUST render a four-segment
  ContentTypePicker (Text / URL / Image / File) and exactly one
  matching content-input panel.
- **FR-004**: TextContentInput MUST default to
  `"Hello from spot showcase"` and accept multi-line input.
- **FR-005**: UrlContentInput MUST default to `https://expo.dev`,
  validate input synchronously, disable the **Share** button on
  invalid input, and show an inline validation message.
- **FR-006**: ImageContentPicker MUST display exactly four
  bundled sample images via `require()` and allow single-select.
- **FR-007**: FileContentPicker MUST list files from the
  Documents Lab persisted list when present and otherwise show a
  single bundled fallback text file; selection is single.
- **FR-008**: ExcludedActivitiesPicker MUST present a checklist
  of well-known `UIActivity.ActivityType` strings (catalog
  defined in `activity-types.ts`) and a **Hide all** master
  toggle that selects every built-in entry.
- **FR-009**: CustomActivityToggle MUST be a single switch and
  default to off.
- **FR-010**: AnchorSelector MUST render only when the device is
  iPad; on iPhone, Android, and Web it MUST return `null`.
- **FR-011**: The **Share** button MUST invoke
  `share-sheet.present(opts)` with the active content payload,
  current exclusion list, custom-activity flag, and anchor rect.
- **FR-012**: ResultLog MUST display the most recent 10 share
  invocations newest-first, each row showing content type,
  activity type, outcome (`completed`/`cancelled`/`error`), and a
  timestamp.
- **FR-013**: The iOS native bridge MUST wrap
  `UIActivityViewController` and resolve a Promise with
  `{ activityType: string | null, completed: boolean }`.
- **FR-014**: The custom activity MUST be a `UIActivity` subclass
  named `CopyWithPrefixActivity` that, on perform, copies
  `"Spot says: <text>"` to `UIPasteboard.general`.
- **FR-015**: On iPad, the bridge MUST set
  `popoverPresentationController.sourceView` and `sourceRect`
  from the supplied anchor; failure to do so MUST be treated as
  an error and surfaced via the Promise.
- **FR-016**: On Android, `share-sheet.present` MUST delegate
  file-content shares to `expo-sharing` and reject text/URL
  shares with an explanatory error or copy-to-clipboard fallback.
- **FR-017**: On Web, `share-sheet.present` MUST use
  `navigator.share` when available and otherwise copy the text/URL
  payload to the clipboard and resolve with a synthetic
  `activityType: 'web.clipboard-fallback'`.
- **FR-018**: `share-sheet.isAvailable()` MUST return `true` on
  iOS and `true`/`false` on Android/Web according to whether a
  usable share path exists at runtime.
- **FR-019**: All non-iOS platforms MUST throw or surface a
  typed `ShareSheetNotSupported` error for capabilities (custom
  activity, exclusions, anchor) that are iOS-only — but MUST NOT
  throw for the basic share path.
- **FR-020**: The module MUST NOT modify any existing registry
  entry; the registry change MUST be additive (one new card).
- **FR-021**: If a config plugin is created, it MUST be
  idempotent and a passthrough (no `Info.plist` mutation),
  registered as a single new entry in `app.json` `plugins`. If
  research confirms no `Info.plist` change is needed, the
  plugin MUST NOT be created and `app.json` MUST NOT be
  modified.
- **FR-022**: All native bridge entry points MUST be mocked at
  the import boundary in tests; no test MUST require a live
  iOS runtime.
- **FR-023**: The module MUST run `pnpm format` before its
  final commit and MUST NOT add any `eslint-disable` directives.
- **FR-024**: Cancelling the system share sheet MUST be
  classified as outcome `cancelled` (not `error`) in the result
  log.
- **FR-025**: Bridge errors MUST be classified as outcome
  `error`, recorded in the log with the error message, and MUST
  NOT crash the screen or surface as an unhandled rejection.

### Key Entities

- **ShareContent**: a discriminated union with variants `text`,
  `url`, `image`, `file`. `text` carries a string; `url` carries
  a validated absolute URL string; `image` carries a `require()`
  module id resolving to a bundled PNG; `file` carries
  `{ uri, name, mimeType, size }`.
- **ExcludedActivity**: a string ID drawn from a fixed catalog
  (`activity-types.ts`) of well-known
  `UIActivity.ActivityType` values, each paired with a
  human-readable label.
- **ShareOptions**: the payload passed to the native bridge —
  `{ content: ShareContent, excludedActivityTypes: string[],
  includeCustomActivity: boolean, anchor: AnchorRect | null }`.
- **AnchorRect**: `{ x: number, y: number, width: number,
  height: number }` measured from a button's `onLayout` event.
  iPad-only.
- **ShareResult**: `{ activityType: string | null, completed:
  boolean }` returned by the bridge, plus `error?: string` when
  outcome is error.
- **ShareLogEntry**: `{ id: string, type: 'text'|'url'|'image'
  |'file', activityType: string, outcome: 'completed'
  |'cancelled'|'error', errorMessage?: string, timestamp:
  number }`.
- **ShareSession** (hook state): `{ content, exclusions,
  includeCustomActivity, anchor, log }` plus a `share()` action
  composing options and invoking the bridge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can share the default text via the system
  share sheet, see the share sheet present, dismiss it, and see
  the result log update — all in under 10 seconds from tapping
  the registry card.
- **SC-002**: 100% of share-sheet invocations on iPad with any of
  the four anchor presets present without a runtime crash.
- **SC-003**: When the **Copy with prefix** custom activity is
  selected, the clipboard contains exactly
  `"Spot says: <text>"` (verified programmatically) in 100% of
  invocations.
- **SC-004**: When the user enables **Hide all**, every built-in
  activity from the catalog is absent from the presented share
  sheet (verified by inspecting the bridge call payload) in 100%
  of invocations.
- **SC-005**: `pnpm test` for the module's test suite passes with
  100% pass rate; project-wide `pnpm check` is green.
- **SC-006**: Result log retains the 10 most recent invocations
  with no entry older than the 10th-most-recent visible.
- **SC-007**: On Android and Web, no share invocation produces an
  unhandled promise rejection or visible crash, across all four
  content types.
- **SC-008**: The module adds exactly one registry entry and
  zero existing-file modifications outside the registry, the
  module folder, the native folder, and (only if created) one
  `app.json` `plugins` entry.
- **SC-009**: All file/component additions land under the paths
  declared in this spec; no lint disables and no
  format-on-commit drift.
- **SC-010**: First-time users complete the full demo flow
  (pick content type, configure exclusions, share, observe log)
  in under 60 seconds without consulting external docs.

## Assumptions

- The feature branch `033-share-sheet` already exists and is
  checked out; branch creation is delegated to the
  `before_specify` git hook and is not part of this command's
  responsibilities.
- Constitution v1.1.0 applies: cross-platform safety, additive
  changes, no breaking edits, full `pnpm check` green.
- `expo-clipboard` is already a project dependency (used by
  prior features); if not, planning will add it as a single
  additive package install.
- `expo-sharing` is available from feature 032 and is reused
  here for the Android file-share path.
- The four bundled sample images for ImageContentPicker can be
  reused from features 016 / 032 (or any 1x1 PNG of acceptable
  size); no new asset pipeline is required.
- Documents Lab (feature 032) exposes its persisted file list
  via a stable read API; if not, FileContentPicker degrades to
  the bundled fallback file only — the module does not require
  documents-lab to function.
- iOS 8.0 minimum is sufficient (`UIActivityViewController` ships
  in iOS 6 and the custom-activity API is stable from iOS 6;
  8.0 aligns with the project's overall floor).
- No `Info.plist` keys are required for in-app `UIActivity`
  subclasses or for `UIActivityViewController` itself; the
  research phase will confirm and, if confirmed, the config
  plugin will be skipped entirely (no `app.json` change). If
  any key is needed, a no-op idempotent plugin will be added
  under `plugins/with-share-sheet/` with one `app.json`
  `plugins` entry.
- Unit tests run in a JS-only environment (Jest + React Native
  Testing Library) and mock the native bridge at the import
  boundary; no on-device test rig is needed.
- iPad detection uses the project's existing platform helper or
  `Platform.isPad`; no new device-detection abstraction is
  introduced.
- Well-known `UIActivity.ActivityType` strings are stable across
  iOS versions; the catalog in `activity-types.ts` is the single
  source of truth and is hand-curated rather than generated.
- The result log is in-memory only; persistence is out of scope
  for v1 (can be added in a follow-up if needed).
- Web Share API support detection (`'share' in navigator`) is
  reliable enough for the fallback decision; no UA sniffing is
  introduced.

## Out of Scope

- Persisting the result log across app launches.
- Sharing multiple items in a single invocation (the demo
  shares exactly one activity item at a time).
- Custom completion UI / per-activity branding beyond the
  single `CopyWithPrefixActivity`.
- Building or registering a Share Extension target (separate
  iOS extension, not `UIActivityViewController`).
- Automated UI tests on real iOS devices; coverage is JS-pure.
