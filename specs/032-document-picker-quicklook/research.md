# Phase 0 Research — Document Picker + Quick Look Module (032)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-F**. Spec-level decisions were already
approved in `spec.md`; they are not re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent `present()` calls

### Decision

`src/native/quicklook.ts` exposes an internal, module-scoped promise
chain inherited verbatim from features 030 / 031:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

The async bridge method `present(uri)` wraps its native call through
`enqueue(...)`. The synchronous read-only `isAvailable()` is NOT
serialised.

### Rationale

- Two rapid taps on **Preview** (a common test motion on a populated
  Files List) would otherwise call `QLPreviewController.present` twice
  in parallel; UIKit handles overlapping presentations by ignoring the
  second one but not by rejecting it deterministically. Serialising
  at the JS bridge ensures the second `present()` only fires AFTER the
  first sheet has appeared (or its presentation has rejected), giving
  tests a deterministic invariant: "two back-to-back present() calls
  produce exactly two native invocations in submission order".
- Inheriting the helper verbatim from 030 / 031 reduces reviewer
  cognitive load and reuses the same flake-free guarantee that 030's
  bridge test demonstrated. The closure over module scope cannot be
  bypassed by re-importing.
- Errors are preserved for the caller (R6 mitigation under Risks) but
  the chain itself is detoxified by `chain.catch(...)` so a rejected
  presentation does not block subsequent ones.
- `isAvailable()` is synchronous and pure (returns `Platform.OS ===
  'ios' && nativeModule != null`); serialising it would be both
  meaningless and a regression in render-time performance.

### Alternatives considered

- **No serialisation, rely on UIKit's "ignore second present" behaviour**.
  Rejected: behaviour is documented but not deterministic across iOS
  versions; tests would have to assert "at most two" rather than
  "exactly two" native invocations, which is weaker.
- **Serialise at the Swift layer with a single semaphore**.
  Rejected: harder to assert in JS tests; adds Swift-side state that
  must be cleaned up on dismissal.
- **Reject the second call synchronously when the chain is busy**.
  Rejected: turns a UX "wait briefly" into a UX "tap was lost",
  contradicting FR-007's "Preview MUST call quicklook.present(uri)"
  expectation.

---

## §2 — R-B: Pure mime-type / filter helpers

### Decision

`src/modules/documents-lab/mime-types.ts` exposes:

```ts
export type DocumentFilter = 'all' | 'images' | 'text' | 'pdf';
export type MimeFamily = 'image' | 'text' | 'pdf' | 'other';

export function mimeFromExtension(name: string): string;
export function familyOfMime(mime: string): MimeFamily;
export function pickerTypeForFilter(filter: DocumentFilter): string | string[] | undefined;
export function filterMatchesEntry(filter: DocumentFilter, entry: { mimeType: string }): boolean;
export function formatSize(bytes: number): string;
```

The functions are **pure** — no React imports, no I/O, no global
mutation.

`pickerTypeForFilter` returns:

| Filter   | Return value (suitable for `expo-document-picker.getDocumentAsync({ type })`) |
|----------|-------------------------------------------------------------------------------|
| `all`    | `undefined` (no constraint) |
| `images` | `'image/*'` (Android/Web) — on iOS, `expo-document-picker` accepts the same string and maps internally to `public.image` |
| `text`   | `['text/plain', 'text/markdown', 'text/*', 'application/json']` (a small explicit list rather than just `'text/*'` so JSON files surface in the Text branch) |
| `pdf`    | `'application/pdf'` |

`familyOfMime` collapses each mime to one of the four
`{image,text,pdf,other}` families used both for filter-matching and
for the row's mime label colour token.

### Rationale

- **FR-010** mandates that the type filter drive both list visibility
  and picker UTIs from a single source of truth. Centralising the
  mapping in a pure helper gives the hook a clean unit to test
  against (mirrors 031 R-B / 030 R-C).
- The string-based `type` argument is what `expo-document-picker`
  documents; passing it through unchanged on every platform is the
  smallest viable contract. The library handles the iOS UTI mapping
  internally.
- `formatSize` rounds to one decimal place at the kB / MB boundary
  and returns `'0 B'` for zero (used by tests as the exact equality
  expectation).
- Inlining the family check in `FilesList.tsx` would couple list
  visibility to mime parsing and break testability without a render.

### Alternatives considered

- **Use `mime` npm package**. Rejected: NFR violation (FR-018: only
  two new dependencies, both Expo-blessed).
- **Map filter → UTI literal on iOS, mime on Android**. Rejected: the
  `expo-document-picker` API already abstracts this; passing one
  string per platform doubles the contract surface for no benefit.
- **Return a `Set<string>` from `pickerTypeForFilter`**. Rejected:
  `expo-document-picker.getDocumentAsync` accepts `string | string[]`,
  not `Set`.

---

## §3 — R-C: AsyncStorage rehydration tolerance

### Decision

`src/modules/documents-lab/documents-store.ts` exposes:

```ts
export const STORAGE_KEY = 'spot.documents.list' as const;

export type DocumentEntry = {
  readonly id: string;
  readonly name: string;
  readonly uri: string;
  readonly mimeType: string;
  readonly size: number;
  readonly addedAt: string; // ISO-8601
  readonly source: 'picker' | 'sample';
};

export type DocumentsStoreState = {
  readonly files: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
};

export type ParseOptions = {
  readonly onError?: (err: unknown) => void;
};

export function parsePersisted(raw: string | null, opts?: ParseOptions): DocumentsStoreState;
export async function load(opts?: ParseOptions): Promise<DocumentsStoreState>;
export async function save(state: DocumentsStoreState): Promise<void>;
export async function dropMissingURIs(
  state: DocumentsStoreState,
  resolver: (uri: string) => Promise<boolean>,
): Promise<DocumentsStoreState>;
```

Tolerance contract:

1. `raw === null` → return `{ files: [], filter: 'all' }`.
2. `JSON.parse` throws → fire `onError(err)` once, return default.
3. Parsed root is not an object / missing `files` array → fire
   `onError({ kind: 'shape', root })` once, return default.
4. Per-row validation: any row missing `id` / `name` / `uri` /
   `mimeType` (or with non-string types, or non-finite `size`) is
   dropped. The remaining valid rows are returned. `onError` is fired
   exactly once per parse pass (not once per dropped row) with a
   `{ kind: 'rows', dropped: number }` payload.
5. `filter` field, if present and one of the four valid values, is
   carried through; otherwise defaults to `'all'`.

`dropMissingURIs` is called separately at mount time (after parsing)
with a resolver that probes each URI via `FileSystem.getInfoAsync` (or
the bundle-asset equivalent for sample URIs). Resolution failures are
swallowed (the row is dropped, the rest survive).

### Rationale

- **FR-011** + **EC** + **SC-007** mandate that a corrupt blob never
  crash the screen and never produce a user-visible error toast.
- Splitting parse-tolerance from URI-resolution-tolerance gives two
  independently testable seams: the parser is pure (string in,
  state out) and the URI-pruner is async + injectable (resolver
  function in tests can be a `jest.fn()` returning fixed booleans).
- The `onError` funnel mirrors 030 R-C / 031 R-B: the store does
  not couple to React state; the hook supplies the callback and
  surfaces failures on its `error` channel exactly once per mount.
- The `'sample'` source branch is significant: when the app
  reinstalls, sample URIs from the previous bundle point at a
  defunct asset directory. The URI-pruner drops them silently and
  the user sees an empty Files List on the freshly reinstalled
  build, which is the correct UX (the sample tiles are still
  available to re-tap).

### Alternatives considered

- **Throw on parse failure and let an error boundary catch it**.
  Rejected: spec mandates "no error toast" (SC-007); error
  boundaries are visible UI artifacts.
- **Validate with `zod` / `valibot`**. Rejected: NFR violation
  (FR-018 caps deps at +2). The hand-rolled validator is ~30 lines.
- **Keep all rows even if URI is unresolvable; show an error icon
  per-row**. Rejected: an unresolvable URI on `Preview` /
  `Share` would fail at the action level; pre-pruning at mount is
  simpler and matches the spec's "row dropped silently" wording
  in EC and FR-011.

---

## §4 — R-D: Plugin scope — two scalar `Info.plist` keys, no `pbxproj`

### Decision

`plugins/with-documents/index.ts` mutates exactly two `Info.plist`
keys via a single `withInfoPlist` mod:

```ts
import { withInfoPlist, type ConfigPlugin } from '@expo/config-plugins';

const withDocuments: ConfigPlugin<void> = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults.LSSupportsOpeningDocumentsInPlace = true;
    mod.modResults.UIFileSharingEnabled = true;
    return mod;
  });
};

export default withDocuments;
```

Behaviour:

- **Absent key** → set to `true`. (FR-015)
- **Present key with value `true`** → assignment is a no-op
  (byte-identical second run; idempotency).
- **Present key with value `false`** → overwritten to `true` (FR-015
  wording: "if either exists with a different value the plugin
  overwrites only its two managed keys and leaves all other keys
  untouched").

The plugin does NOT call `withXcodeProject`, does NOT touch
entitlements, and does NOT mutate any `Info.plist` key other than
these two. `QuickLook.framework` linkage is provided by the existing
autolinking pipeline (same path used by every prior `native/ios/*`
directory in this project).

### Rationale

- **FR-015 / FR-016** + **SC-003** require strict scope isolation
  and idempotency. Scalar booleans are the simplest possible mutation
  surface — no union-merge, no ordering concern, no array dedup.
- Because the mutation is a direct assignment, the second run of
  `expo prebuild` produces a byte-identical Info.plist trivially.
- Coexistence with all 31 prior plugins reduces to "no key
  collision". None of the 31 prior plugins manage
  `LSSupportsOpeningDocumentsInPlace` or `UIFileSharingEnabled`
  (verified by grep over `plugins/` at branch start). Therefore
  prior-plugin output is byte-identical for every key OTHER than the
  two this plugin manages — asserted by test (h) of T010 against a
  reference fixture.
- Avoiding `pbxproj` mutation matches the project-wide convention
  (R-E from feature 031's research carries forward verbatim:
  framework linkage is autolinking's job, not plugin's).

### Alternatives considered

- **Add `LSItemContentTypes` for declared file types**. Rejected:
  out of scope for v1; the module accepts arbitrary picked files and
  exposes them via `expo-sharing`, not via the system "Open With"
  pipeline. Adding `LSItemContentTypes` would invite a future
  expectation of round-trip "Open in spot from Files app" which is
  not in the spec.
- **Use `withDangerousMod` to write Info.plist directly**. Rejected:
  bypasses Expo's diff layer and breaks idempotency guarantees;
  `withInfoPlist` is the documented contract.
- **Add a `withXcodeProject` mod for QuickLook.framework**. Rejected:
  redundant with autolinking; inflates plugin test surface.

---

## §5 — R-E: Bundled samples via `Asset.fromModule(require(...))`

### Decision

`src/modules/documents-lab/samples.ts` declares four bundled samples
as static descriptors:

```ts
import { Asset } from 'expo-asset';

export type BundledSample = {
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly requireAsset: number; // result of require('./samples/<name>')
};

export const SAMPLES: readonly BundledSample[] = [
  { name: 'hello.txt', mimeType: 'text/plain',     size: /* exact bytes */, requireAsset: require('./samples/hello.txt') },
  { name: 'note.md',   mimeType: 'text/markdown',  size: /* exact bytes */, requireAsset: require('./samples/note.md') },
  { name: 'data.json', mimeType: 'application/json', size: /* exact bytes */, requireAsset: require('./samples/data.json') },
  { name: 'icon.png',  mimeType: 'image/png',      size: /* exact bytes */, requireAsset: require('./samples/icon.png') },
] as const;

export async function resolveSampleUri(sample: BundledSample): Promise<string> {
  const asset = Asset.fromModule(sample.requireAsset);
  if (!asset.localUri) await asset.downloadAsync();
  return asset.localUri ?? asset.uri;
}
```

`BundledSamplesCard` calls `resolveSampleUri(sample)` inside the tile
tap handler (lazy resolution, not at module evaluation time) and then
appends a `DocumentEntry` with `source: 'sample'` to the store.

### Rationale

- `Asset.fromModule(require(...))` is the Expo-blessed pattern for
  bundling arbitrary file assets and resolving them to a runtime
  file URI. It works on every platform Expo SDK 55 supports.
- Lazy resolution keeps the screen mount fast: the four assets are
  not downloaded / unpacked unless the user actually taps a tile.
- The `requireAsset: number` is a Metro bundler asset id; tests can
  assert it is a non-zero number without hitting the file system.
- `source: 'sample'` is preserved on the persisted row so the URI
  pruner can recognize and drop stale sample URIs across reinstalls
  (R-C).

### Alternatives considered

- **Embed sample contents inline as JS string literals** and write
  them to a temp file at runtime. Rejected: forces a write-on-every-
  mount cost and bypasses the bundle-asset pipeline; `expo-sharing`
  would also receive a `file://.../tmp/...` URI with no obvious
  cleanup story.
- **Ship samples in `assets/` instead of inside the module
  directory**. Rejected: violates module locality (every other
  module's bundled chrome lives under its own directory). Tests
  asserting "exactly four samples in `src/modules/documents-lab/
  samples/`" enforce locality.
- **Generate the PNG at build time via a script**. Rejected:
  introduces a build-time dependency for a 70-byte file. Hand-
  authoring an 8x8 valid PNG is faster.

---

## §6 — R-F: PDF samples intentionally absent from the bundled set

### Decision

The four bundled samples are `hello.txt`, `note.md`, `data.json`, and
`icon.png`. **No PDF.** The `pdf` filter branch in
`pickerTypeForFilter` and `filterMatchesEntry` is fully exercised in
tests via a mocked `expo-document-picker.getDocumentAsync` response
that returns a fake PDF descriptor (name `mock.pdf`, mime
`application/pdf`, size 1024, uri `file:///mock/mock.pdf`).

`SC-002` is scoped accordingly: "All four bundled samples render in
Quick Look on iOS without any 'could not load' error." — txt / md /
json / png only.

### Rationale

- Even a minimal valid PDF is ~700 bytes (txt+md+json+png is ~150
  bytes total). Bundling a PDF would 5× the asset weight for a
  format that the picker branch already covers.
- The PDF case is the **filter** case (does the row pass the
  filter? does the picker get the right `application/pdf`
  argument?), not the **rendering** case. Filter logic is unit-
  testable without an actual PDF byte sequence.
- On-device acceptance for PDF preview (US1: pick a PDF from iCloud
  Drive, tap Preview) is exercised against a real iCloud-hosted
  PDF in T016 (quickstart on-device verification), not against a
  bundled sample.

### Alternatives considered

- **Bundle a tiny PDF generated by a deterministic Python script**.
  Rejected: introduces a non-trivial generation step that has to be
  reproduced cross-platform and verified byte-identical in CI. Cost
  (build complexity) >> benefit (a fifth bundled sample).
- **Bundle a third-party-licensed PDF (e.g. a public-domain one
  page)**. Rejected: surfaces a licensing-attribution requirement
  for a feature whose value is the API surface, not the content.
- **Drop the PDF filter entirely**. Rejected: spec explicitly
  enumerates four filter values (FR-010); reducing to three would
  weaken parity with the iOS Files app's own type filter.

---

## §7 — Build validation (Constitution v1.1.0 Validate-Before-Spec gate)

This feature is **not** a build-pipeline feature; the
Validate-Before-Spec mandate (constitution v1.1.0) does not require a
proof-of-concept `expo prebuild` invocation. The plugin's mutation
surface is fully testable via `@expo/config-plugins`'s `withInfoPlist`
mock; the plugin test (T010) is the validation gate.

The on-device verification step (T016) is executed at the end of
implementation, not during research, because `QLPreviewController`'s
actual presentation behaviour (modal sheet animation, gesture
handling) cannot be deterministically measured in CI — it is a
property of the live iOS UIKit runtime.

If, during implementation, on-device behaviour diverges from the
spec's assumptions (e.g. `expo-document-picker` v13 changes its
`type` argument shape, or `QLPreviewController` rejects a sample
URI we expected to be valid), the spec MUST be back-patched per
Constitution v1.1.0 "Spec back-patching" before T016 is signed off.
A "Discoveries" appendix in `retrospective.md` will capture any such
divergence.

---

## Cross-references

- spec.md §"Functional Requirements" — FR-001..020
- spec.md §"Edge Cases" — picker cancelled, AsyncStorage corruption,
  unresolvable URI, Quick Look failure, plugin re-applied
- plan.md §"Resolved decisions" — R-A..R-F
- plan.md §"Risks" — R1..R10 reference these decisions for mitigation
- 030's research.md §1 — bridge serialisation pattern inherited
  verbatim into 032 R-A
- 031's research.md §2 (R-B) — pure-mapper pattern inherited into
  032 R-B (pure helpers + optional onError funnel)
- 030's research.md §3 (R-C) — AsyncStorage tolerance pattern
  inherited into 032 R-C
- 031's research.md §5 (R-E) — autolinking-not-pbxproj framework
  linkage decision inherited into 032 R-D
