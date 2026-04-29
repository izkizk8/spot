# Phase 1 Data Model — Document Picker + Quick Look Module (032)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, persisted, or held in memory by feature
032. JS-side type definitions live in `src/modules/documents-lab/
documents-store.ts` (entities 1–3), `src/modules/documents-lab/
samples.ts` (entity 4), and `src/native/quicklook.types.ts` (entity
5). Swift-side analogues live in `QuickLookPresenter.swift`. The two
sides MUST agree on the wire-format JSON encoding of entity 5
documented below.

Unlike feature 031, feature 032 has a **JS-side persistent store**
(AsyncStorage key `spot.documents.list`). Entities 1–3 describe both
the in-memory shape and the wire-format encoded under that key.

---

## Entity 1 — `DocumentEntry`

One row in the Files List. Created by either the picker action (one
per file returned by `expo-document-picker.getDocumentAsync`) or the
sample tile action (one per tap on `BundledSamplesCard`).

### Fields

| Field       | Type                          | Nullability | Source                                                           | Notes |
|-------------|-------------------------------|-------------|------------------------------------------------------------------|-------|
| `id`        | `string`                      | NOT NULL    | Generated client-side: `${addedAt}-${name}-${randomSuffix}`      | Stable; used as React key + as `remove(id)` argument. |
| `name`      | `string`                      | NOT NULL    | `picker.name` or `sample.name`                                   | Renders as the row title. |
| `uri`       | `string`                      | NOT NULL    | `picker.uri` or `Asset.fromModule(...).localUri`                 | `file://...` on iOS / Android, `blob:` or `https:` on Web (sample) / `content://` allowed (Android picker). |
| `mimeType`  | `string`                      | NOT NULL    | `picker.mimeType` (with `mimeFromExtension(name)` fallback) or `sample.mimeType` | Used by `filterMatchesEntry` and by the row's mime label. |
| `size`      | `number`                      | NOT NULL    | `picker.size` or `sample.size`                                   | Bytes; non-finite values are rejected at parse time (R-C). `0` is valid. |
| `addedAt`   | `string` (ISO-8601)           | NOT NULL    | `new Date().toISOString()` at insert time                        | Used for default sort (newest first). |
| `source`    | `'picker' \| 'sample'`        | NOT NULL    | Constant per code path                                           | Used by the URI pruner to apply different resolution strategies (sample URIs are bundle-relative; picker URIs are sandbox-absolute). |

### Validation rules

- `id`, `name`, `uri`, `mimeType`, `addedAt` MUST be non-empty strings.
- `size` MUST be a finite non-negative number.
- `source` MUST be one of `'picker'` / `'sample'`.
- The mapper drops any row that fails validation (R-C). Validation is
  applied both at JS-level construction time AND at parse time during
  rehydration; the second pass is a defence against a corrupted
  AsyncStorage blob being constructed by an external process.

### Wire format (JSON, persisted under `spot.documents.list`)

```json
{
  "files": [
    {
      "id": "2026-04-29T10:00:00.000Z-hello.txt-a1b2",
      "name": "hello.txt",
      "uri": "file:///var/mobile/.../Bundle/Application/.../assets/hello.txt",
      "mimeType": "text/plain",
      "size": 24,
      "addedAt": "2026-04-29T10:00:00.000Z",
      "source": "sample"
    }
  ],
  "filter": "all"
}
```

The persisted shape is exactly `DocumentsStoreState` (entity 3).

---

## Entity 2 — `DocumentFilter`

Drives both the visible rows in `FilesList` (`filterMatchesEntry`)
and the picker `type` argument (`pickerTypeForFilter`). See research
§2 (R-B).

### Type

```ts
export type DocumentFilter = 'all' | 'images' | 'text' | 'pdf';
```

### Validation rules

- MUST be exactly one of the four literals. Any other value during
  rehydration falls back to `'all'` (R-C).
- The four filter values are mutually exclusive (FR-010).

### Filter ↔ family mapping

| Filter   | Matches `MimeFamily`            | Picker `type` argument                                      |
|----------|---------------------------------|-------------------------------------------------------------|
| `all`    | every family                    | `undefined` (no constraint)                                 |
| `images` | `image`                         | `'image/*'`                                                 |
| `text`   | `text`                          | `['text/plain','text/markdown','text/*','application/json']`|
| `pdf`    | `pdf`                           | `'application/pdf'`                                         |

`MimeFamily` is `'image' | 'text' | 'pdf' | 'other'`. `'other'` is
visible only under the `all` filter; this is intentional — it lets a
user see picked files of unanticipated types without losing the
ability to filter the common families.

---

## Entity 3 — `DocumentsStoreState`

The full persisted state under `spot.documents.list`. The store
exposes load / save / parsePersisted / dropMissingURIs operations
over this shape (research §3 / R-C).

### Type

```ts
export interface DocumentsStoreState {
  readonly files: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
}
```

### Validation rules

- `files` MUST be an array. Non-array roots → empty default
  (`{ files: [], filter: 'all' }`) and `onError` fired once.
- `filter` MUST be a valid `DocumentFilter`. Otherwise defaults to
  `'all'` (silent — not an error).
- The store does NOT enforce uniqueness on `files`. Duplicate
  entries are explicitly allowed (FR-005 acceptance scenario 3:
  "two distinct rows exist (duplicates are allowed; the user
  explicitly opted in twice)").

### State transitions

| Action            | Effect                                                       |
|-------------------|--------------------------------------------------------------|
| `add(entry)`      | Append `entry` to `files`. Persist.                          |
| `add(entries[])`  | Append all entries in order. Persist once.                   |
| `remove(id)`      | Filter `files` by `e.id !== id`. Persist.                    |
| `clear()`         | Set `files` to `[]`. Persist.                                |
| `setFilter(f)`    | Set `filter` to `f`. Persist.                                |

Each mutation is atomic from the hook's perspective: the in-memory
state is updated synchronously via the reducer, and the persistence
write is fire-and-forget (errors surface on the hook's `error`
channel; the in-memory state remains consistent regardless).

---

## Entity 4 — `BundledSample`

Static descriptor for a file shipped under
`src/modules/documents-lab/samples/`. Loaded lazily into a
`DocumentEntry` when the user taps a sample tile. See research §5
(R-E).

### Type

```ts
export interface BundledSample {
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly requireAsset: number; // Metro asset id from require('./samples/<name>')
}
```

### Validation rules

- `SAMPLES.length` MUST be exactly 4 (FR-005).
- The four entries MUST be `hello.txt` (text/plain), `note.md`
  (text/markdown), `data.json` (application/json), `icon.png`
  (image/png) — **no PDF** (research §6 / R-F).
- `size` MUST match the on-disk byte count of the corresponding
  bundled file. Tests assert each `size` is a positive finite number;
  on-device verification (T016) confirms the byte count.
- `requireAsset` MUST be a non-zero integer (Metro asset ids start at
  1).

---

## Entity 5 — `QuickLookPresentInput` / `QuickLookPresentOutput`

Wire-format payloads for `present(uri:)` JS ↔ Swift bridge calls.

### JS → Swift

```json
{ "uri": "file:///path/to/file.png" }
```

The URI MUST be a non-empty string. The Swift side calls
`URL(string:)` to parse it; parse failure rejects the promise with a
typed error. Both `file://` and `https://` URIs are accepted; the
former is the common case (picker results, bundle samples).

### Swift → JS

```json
{ "shown": true }
```

Returned exactly when the `QLPreviewController` has been presented
modally and `viewDidAppear` has been called (the presenter resolves
the promise from the controller's
`previewController(_:willPresent:)` hook for determinism).

On error (URI parse failure, file not readable, unsupported file
type, no root view controller available), the promise rejects with a
JS-side `Error` whose `code` is one of:

| Code                          | Meaning                                              |
|-------------------------------|------------------------------------------------------|
| `'invalid-uri'`               | `URL(string:)` returned `nil`                        |
| `'unreadable'`                | `FileManager.default.isReadableFile(atPath:)` false  |
| `'no-root-view-controller'`   | UIKit could not provide a presenter                  |
| `'preview-failed'`            | `QLPreviewController` rejected the item              |

The JS bridge wraps these into ordinary `Error` instances with the
`code` preserved on the message. `FileRow` catches the rejection and
renders the inline error + `QuickLookFallback` (sharing remains
available).

---

## Entity 6 — `QuickLookNotSupported` (typed error class)

Thrown by `src/native/quicklook.android.ts` and
`src/native/quicklook.web.ts` from `present(uri)`. Consumers MAY
`instanceof`-check.

```ts
export class QuickLookNotSupported extends Error {
  readonly name: 'QuickLookNotSupported';
  constructor(message?: string);
}
```

### Validation rules

- `name` MUST be the literal `'QuickLookNotSupported'`.
- The class MUST be exported from `src/native/quicklook.types.ts` so
  cross-platform `instanceof` checks work regardless of which sibling
  module the bridge resolved at bundle time.
- `isAvailable()` MUST return `false` synchronously on the same
  platforms that throw `QuickLookNotSupported`. The two are
  symmetric.

---

## Persistence layer summary

| Layer                                          | Owner                       | Schema                              | Write frequency                                |
|------------------------------------------------|------------------------------|-------------------------------------|------------------------------------------------|
| AsyncStorage `spot.documents.list`             | JS (`documents-store.ts`)    | `DocumentsStoreState` (entity 3)    | After every mutation (debounced by reducer)    |
| App bundle `src/modules/documents-lab/samples/`| Build-time (Metro)           | Four binary files                   | Build-time only; read-only at runtime          |
| iOS sandbox / Files app / iCloud Drive         | iOS / `expo-document-picker` | Opaque file URIs                    | Read-only from this module's perspective       |
| App Group `UserDefaults`                       | **NOT USED** by 032          | n/a                                 | n/a                                            |

No App Group write is performed by feature 032. The `LastRunSnapshot`
namespace (used by 030 / 031) is untouched.

---

## Cross-platform behaviour matrix

| Surface              | iOS 11+              | Android              | Web                      | iOS < 11                       |
|----------------------|----------------------|----------------------|--------------------------|--------------------------------|
| PickDocumentsCard    | functional           | functional           | functional               | functional                     |
| BundledSamplesCard   | functional           | functional           | functional               | functional                     |
| FilesList            | functional           | functional           | functional               | functional                     |
| FileRow.Preview      | native Quick Look    | renders Fallback     | renders Fallback         | renders Fallback (rare)        |
| FileRow.Share        | `expo-sharing`       | `expo-sharing`       | `navigator.share` if any | `expo-sharing` (best-effort)   |
| FileRow.Delete       | functional           | functional           | functional               | functional                     |
| TypeFilterControl    | functional           | functional           | functional               | functional                     |
| IOSOnlyBanner        | NOT rendered         | rendered             | rendered                 | rendered                       |
| QuickLookFallback    | NOT rendered (top-level); rendered inline on per-row Preview error | rendered above QL section | rendered above QL section | rendered above QL section |

The "above QL section" placement on non-iOS is the screen-level
informational banner; the per-row inline render on iOS only occurs
when `quicklook.present()` rejects.
