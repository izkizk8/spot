# Phase 1 Data Model — Share Sheet Module (033)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 033.
JS-side type definitions live in `src/native/share-sheet.types.ts`
(entities 1–4), `src/modules/share-sheet-lab/activity-types.ts`
(entity 5), and `src/modules/share-sheet-lab/hooks/useShareSession.ts`
(entities 6–7). Swift-side analogues live in
`ShareSheetPresenter.swift`. The two sides MUST agree on the
wire-format JSON encoding of entities 1–4 documented below.

Unlike feature 032, feature 033 has **no JS-side persistent store**.
The result log is in-memory only.

---

## Entity 1 — `ShareContent`

The discriminated union describing a single shareable payload.

### Type

```ts
export type ShareContent =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'image'; readonly source: number /* require() module id */; readonly alt: string }
  | { readonly kind: 'file'; readonly uri: string; readonly name: string; readonly mimeType: string; readonly size: number };
```

### Fields and validation

| Variant | Field | Type | Nullability | Validation |
|---------|-------|------|-------------|------------|
| `text` | `text` | `string` | NOT NULL | Non-empty after trim. Default: `"Hello from spot showcase"`. |
| `url` | `url` | `string` | NOT NULL | Must pass `isValidShareUrl` (research §2 / R-B): non-empty, prefixed `http://` or `https://`, and parses via `new URL(...)`. Default: `"https://expo.dev"`. |
| `image` | `source` | `number` | NOT NULL | A `require()` module id resolving to a bundled PNG. Sourced from `bundled-images.ts`. |
| `image` | `alt` | `string` | NOT NULL | Non-empty; used as the share-sheet activity item's text fallback. |
| `file` | `uri` | `string` | NOT NULL | `file://` or `content://` (Android) or bundled-asset URI (web). |
| `file` | `name` | `string` | NOT NULL | Non-empty; used as the row label in `FileContentPicker`. |
| `file` | `mimeType` | `string` | NOT NULL | Non-empty; e.g., `"text/plain"`. |
| `file` | `size` | `number` | NOT NULL | Finite, non-negative. `0` is valid. |

### Wire format (JSON sent to the Swift presenter)

```json
{
  "content": {
    "kind": "text",
    "text": "Hello from spot showcase"
  }
}
```

The Swift side decodes this into a typed `SharePayload` enum and
builds the corresponding activity items array.

---

## Entity 2 — `ShareOptions`

The full payload passed to `share-sheet.present(opts)`.

### Type

```ts
export interface ShareOptions {
  readonly content: ShareContent;
  readonly excludedActivityTypes: readonly string[];
  readonly includeCustomActivity: boolean;
  readonly anchor: AnchorRect | null;
}
```

### Fields and validation

| Field | Type | Nullability | Validation |
|-------|------|-------------|------------|
| `content` | `ShareContent` | NOT NULL | Validated per Entity 1. |
| `excludedActivityTypes` | `readonly string[]` | NOT NULL | Each entry MUST appear in the `activity-types.ts` catalog (asserted at the screen level, not at the bridge — bridge tolerates unknown strings and forwards them verbatim). Empty array is valid. |
| `includeCustomActivity` | `boolean` | NOT NULL | Default: `false`. |
| `anchor` | `AnchorRect \| null` | NULLABLE | `null` on iPhone / Android / Web. NOT NULL on iPad — the screen guarantees a non-null value (default: `'top-left'`) before passing to the bridge. |

### Wire format

```json
{
  "content": { "kind": "text", "text": "..." },
  "excludedActivityTypes": ["com.apple.UIKit.activity.Mail"],
  "includeCustomActivity": true,
  "anchor": { "x": 0, "y": 0, "width": 44, "height": 44 }
}
```

---

## Entity 3 — `ShareResult`

The native bridge's resolved value.

### Type

```ts
export interface ShareResult {
  readonly activityType: string | null;
  readonly completed: boolean;
}
```

### Fields and validation

| Field | Type | Nullability | Notes |
|-------|------|-------------|-------|
| `activityType` | `string \| null` | NULLABLE | iOS: `UIActivity.ActivityType.rawValue` for the chosen activity, or `null` when the sheet was dismissed without choosing. Android: always `null` for `expo-sharing`; `'android.clipboard-fallback'` for the clipboard path. Web: `null` for `navigator.share`; `'web.clipboard-fallback'` for the clipboard path. |
| `completed` | `boolean` | NOT NULL | `true` if a destination was chosen (or the clipboard fallback ran). `false` if the user cancelled / dismissed. |

### Wire format (returned from the Swift presenter)

```json
{ "activityType": "com.apple.UIKit.activity.Mail", "completed": true }
```

`null` is encoded as JSON `null` (Swift side: `NSNull()` mapped via
the Expo Modules JSON bridge).

---

## Entity 4 — `AnchorRect`

iPad-only popover source rectangle.

### Type

```ts
export interface AnchorRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
```

### Fields and validation

| Field | Type | Nullability | Validation |
|-------|------|-------------|------------|
| `x` | `number` | NOT NULL | Finite. Measured in the parent view's coordinate space (the screen). |
| `y` | `number` | NOT NULL | Finite. |
| `width` | `number` | NOT NULL | Finite, positive. |
| `height` | `number` | NOT NULL | Finite, positive. |

### Wire format

```json
{ "x": 16, "y": 120, "width": 44, "height": 44 }
```

The Swift side maps this to `CGRect(x:y:width:height:)` and assigns
to `popoverPresentationController.sourceRect`. `sourceView` is set to
the root view controller's view.

---

## Entity 5 — `ActivityTypeCatalogEntry`

One row in the curated `activity-types.ts` catalog.

### Type

```ts
export interface ActivityTypeCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly synthetic?: 'web.clipboard-fallback' | 'android.clipboard-fallback';
}
```

### Fields and validation

| Field | Type | Nullability | Validation |
|-------|------|-------------|------------|
| `id` | `string` | NOT NULL | Non-empty. iOS entries match `/^com\.apple\.UIKit\.activity\.[A-Za-z]+$/`. Synthetic entries match `/^(web\|android)\.clipboard-fallback$/`. |
| `label` | `string` | NOT NULL | Non-empty; human-readable. |
| `synthetic` | optional literal | NULLABLE | Present only on the two synthetic fallback entries. |

### Catalog contents

See research §8 for the full 12-entry iOS list plus the two synthetic
entries. The catalog is hand-curated and frozen
(`as const` arrays).

### Validation rules

- No duplicate `id` values across the catalog.
- The `'web.clipboard-fallback'` and `'android.clipboard-fallback'`
  entries MUST NOT have `id`s starting with `com.apple.`.
- The catalog MUST contain **exactly** 12 iOS entries + 2 synthetic
  entries (asserted by `activity-types.test.ts`).

---

## Entity 6 — `ExcludedActivitySelection`

The `ExcludedActivitiesPicker` component's local state.

### Type

```ts
export interface ExcludedActivitySelection {
  /** Set of activity-type ids the user has checked. */
  readonly checked: ReadonlySet<string>;
  /** True when the "Hide all" master toggle is on. */
  readonly hideAll: boolean;
}
```

### Derivation rule

The list passed to the bridge is computed at `share()` time:

```ts
function deriveExcludedActivityTypes(
  catalog: readonly ActivityTypeCatalogEntry[],
  selection: ExcludedActivitySelection,
): string[] {
  if (selection.hideAll) {
    return catalog.filter(e => !e.synthetic).map(e => e.id);
  }
  return catalog
    .filter(e => !e.synthetic && selection.checked.has(e.id))
    .map(e => e.id);
}
```

The synthetic fallback entries are NEVER added to the
`excludedActivityTypes` array (they're not real iOS activities).

### Validation rules

- `checked` may contain ids not in the catalog (defensive — the
  derivation function filters); however, the UI only ever adds
  catalog ids.
- `hideAll === true` overrides per-entry checks (per spec FR-008).

---

## Entity 7 — `ShareLogEntry`

One row in the in-memory result log.

### Type

```ts
export interface ShareLogEntry {
  readonly id: string;
  readonly type: 'text' | 'url' | 'image' | 'file';
  readonly activityType: string;
  readonly outcome: 'completed' | 'cancelled' | 'error';
  readonly errorMessage?: string;
  readonly timestamp: number;
}
```

### Fields and validation

| Field | Type | Nullability | Validation |
|-------|------|-------------|------------|
| `id` | `string` | NOT NULL | `${timestamp}-${randomSuffix}`. Stable; used as React key. |
| `type` | discriminated string | NOT NULL | Must equal `content.kind`. |
| `activityType` | `string` | NOT NULL | `result.activityType` if non-null; otherwise the literal string `'(none)'`. |
| `outcome` | `'completed' \| 'cancelled' \| 'error'` | NOT NULL | See classification below. |
| `errorMessage` | `string` | OPTIONAL | Set iff `outcome === 'error'`; the `Error.message` from the bridge rejection. |
| `timestamp` | `number` | NOT NULL | `Date.now()` at the moment the bridge resolved/rejected. |

### Outcome classification

```ts
function classifyOutcome(
  result: ShareResult | null,
  error: unknown,
): { outcome: ShareLogEntry['outcome']; errorMessage?: string } {
  if (error) return { outcome: 'error', errorMessage: String(error.message ?? error) };
  if (!result) return { outcome: 'error', errorMessage: 'Bridge returned no result' };
  if (result.completed) return { outcome: 'completed' };
  return { outcome: 'cancelled' };
}
```

Per FR-024: cancelling MUST be `'cancelled'`, not `'error'`. Per
FR-025: bridge rejections MUST be `'error'` with the message in
`errorMessage`.

---

## Entity 8 — `ShareSession` (composite hook state)

The complete state surface returned by `useShareSession()`.

### Type

```ts
export interface ShareSession {
  // State
  readonly content: ShareContent;
  readonly exclusions: ExcludedActivitySelection;
  readonly includeCustomActivity: boolean;
  readonly anchor: AnchorRect | null;
  readonly log: readonly ShareLogEntry[];
  // Setters (each replaces the corresponding slice)
  readonly setContent: (content: ShareContent) => void;
  readonly setExclusions: (selection: ExcludedActivitySelection) => void;
  readonly setIncludeCustomActivity: (value: boolean) => void;
  readonly setAnchor: (anchor: AnchorRect | null) => void;
  // Action
  readonly share: () => Promise<void>;
  // Status
  readonly isSharing: boolean;
}
```

### Invariants

- `log.length <= 10` at all times. The 11th `share()` drops the
  oldest entry (per spec EC + FR-012).
- `log` is sorted newest-first (`log[0]` is the most recent).
- `isSharing` is `true` only while a single `share()` invocation is
  in flight; concurrent calls are serialised at the bridge (R-A) but
  the hook also debounces by short-circuiting if `isSharing` is
  already `true` when `share()` is called.
- `setX` and `share` are stable references across re-renders (returned
  from `useReducer` dispatch wrappers via `useCallback` or stable
  reducer pattern).

### State machine

```text
idle ── setX ──────────────────────► idle (state slice updated)
idle ── share() ──► sharing ──► idle (log appended, latest entry first)
sharing ── share() ──► (no-op, returns immediately)
```

---

## Cross-entity invariants

- `Entity 1` (`ShareContent`) and `Entity 7` (`ShareLogEntry`)
  agree on the `kind`/`type` discriminator strings:
  `'text' | 'url' | 'image' | 'file'`.
- `Entity 3` (`ShareResult`) `activityType` field is the source for
  `Entity 7` (`ShareLogEntry`) `activityType` field, with a single
  transform: `null -> '(none)'`.
- `Entity 5` (`ActivityTypeCatalogEntry`) `id` field is the source
  for `Entity 2` (`ShareOptions`) `excludedActivityTypes` array
  values, modulo the `synthetic` filter in
  `deriveExcludedActivityTypes`.
- `Entity 4` (`AnchorRect`) is `null` exactly when `Platform.isPad`
  returns false (or the platform is not iOS); the screen enforces
  this invariant before calling `share-sheet.present`.
