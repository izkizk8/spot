# Phase 1 Data Model — PassKit / Wallet (Add Pass) Module (036)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 036.
JS-side type definitions live in `src/native/passkit.types.ts`
(entities 1–4 + the 5 typed error classes) and
`src/modules/passkit-lab/hooks/usePassKit.ts` (entity 5). The five
typed error classes are also declared in `src/native/passkit.types.ts`
so every platform variant of the bridge shares the same class identity
(`instanceof` works across files).

There is **no JS-side persistent store** and **no on-disk
persistence** (v1). All state is in-memory, scoped to the screen's
lifetime. Apple Wallet itself owns the persisted pass list; the module
queries it read-only via `PKPassLibrary.passes()`.

---

## Entity 1 — `PassMetadata`

The surface representation of a `PKPass` enumerated via
`PKPassLibrary.passes()`. Identity is the
`(passTypeIdentifier, serialNumber)` tuple — the same tuple
`PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` accepts.

### Type

```ts
export interface PassMetadata {
  /** Reverse-DNS Pass Type ID (e.g., "pass.com.example.boarding"). */
  readonly passTypeIdentifier: string;
  /** Per-pass serial number, unique within a given Pass Type ID. */
  readonly serialNumber: string;
  /** PKPass.organizationName (issuer name shown in Wallet). */
  readonly organizationName: string;
  /** PKPass.localizedDescription (short user-facing summary). */
  readonly localizedDescription: string;
  /** PKPass.passType, normalised to one of the five PassCategory values. */
  readonly passType: PassCategory;
}
```

### Invariants

- All five fields are non-empty strings on iOS in practice (Wallet
  does not accept passes missing any of them). Tests treat them as
  `string` and do not assert non-empty (defensive).
- `passType` is exhaustive over `PassCategory`. Unknown native cases
  fall through to `'generic'` (research §8).
- The Swift bridge serialises `PKPass` instances into plain
  dictionaries; no Swift handles cross the bridge boundary.
- Identity for `openPass` is `(passTypeIdentifier, serialNumber)`;
  `PassRow` passes both verbatim.

---

## Entity 2 — `PassCategory`

A string union mirroring Apple's `PKPassType` taxonomy.

### Type

```ts
export type PassCategory =
  | 'boardingPass'
  | 'coupon'
  | 'eventTicket'
  | 'generic'
  | 'storeCard';
```

### Mapping

| Apple `PKPassType` | JS string |
|--------------------|-----------|
| `.boardingPass` | `'boardingPass'` |
| `.coupon` | `'coupon'` |
| `.eventTicket` | `'eventTicket'` |
| `.generic` | `'generic'` |
| `.storeCard` | `'storeCard'` |
| any future / unknown case | `'generic'` (with `console.warn`) |

### Invariants

- The union is exhaustive over the catalog declared in
  `src/modules/passkit-lab/pass-types.ts`. The catalog test asserts
  bijection.
- Capitalised "Boarding pass" / "Event ticket" / etc. labels live
  ONLY in the catalog (`PASS_CATEGORY_CATALOG[k].label`); the union
  values themselves are camelCase to match Apple's symbol names and
  avoid copy-collisions.

---

## Entity 3 — `Capabilities`

Captures the two boolean probes used by the `CapabilitiesCard`;
recomputed on screen mount and on Refresh.

### Type

```ts
export interface Capabilities {
  /** PKPassLibrary.isPassLibraryAvailable() — false on extremely old / restricted devices. */
  readonly isPassLibraryAvailable: boolean;
  /** PKPassLibrary.isPassLibraryAvailable() && +[PKPassLibrary canAddPasses]. */
  readonly canAddPasses: boolean;
}
```

### Invariants

- Default value before the first bridge read:
  `{ isPassLibraryAvailable: false, canAddPasses: false }`.
- `canAddPasses === true` implies `isPassLibraryAvailable === true`
  (the bridge enforces this by ANDing the two natively).
- On Android / Web, the stub bridge returns `false` for both probes
  without rejecting (the rejection path is reserved for the
  mutating methods).

---

## Entity 4 — `EntitlementStatus`

A derived boolean indicating whether `app.json` still carries the
placeholder Pass Type ID array (true → `EntitlementBanner` visible).

### Type

```ts
export type EntitlementStatus =
  | { kind: 'placeholder' }   // banner visible
  | { kind: 'configured' };   // banner hidden
```

### Detection

Computed at module load by reading the resolved Expo config (via
`expo-constants`'s `Constants.expoConfig?.ios?.entitlements?.['com.apple.developer.pass-type-identifiers']`)
and comparing the array to the placeholder value
`['$(TeamIdentifierPrefix)pass.example.placeholder']`. Any deviation
(empty array, different value, missing key) is treated as
`'configured'` for banner-display purposes — the bridge layer is the
real gate; the banner is purely informational.

### Invariants

- Default: `'placeholder'` (match the in-repo state).
- Detection is read-once at screen mount; not recomputed on every
  render (the entitlement does not change at runtime).
- `EntitlementBanner` reads this via a small selector hook; tests
  override the value directly.

---

## Entity 5 — `PassKitState`

In-memory state held by `usePassKit`. Reducer-shaped (action-driven)
to keep transitions deterministic and covered by the hook test.

### Type

```ts
export interface PassKitState {
  readonly capabilities: Capabilities;
  readonly passes: readonly PassMetadata[];
  readonly inFlight:
    | { kind: 'idle' }
    | { kind: 'refresh' }
    | { kind: 'addFromBytes' }
    | { kind: 'addFromURL'; url: string }
    | { kind: 'openPass'; passTypeIdentifier: string; serialNumber: string };
  readonly lastError:
    | { kind: 'none' }
    | { kind: 'unsupported'; message: string }
    | { kind: 'open-unsupported'; message: string }
    | { kind: 'download-failed'; message: string }
    | { kind: 'invalid-pass'; message: string }
    | { kind: 'cancelled'; message: string }
    | { kind: 'failed'; message: string };
  readonly lastResult:
    | { kind: 'none' }
    | { kind: 'added' }
    | { kind: 'cancelled' }
    | { kind: 'opened' };
}
```

### Action surface (reducer)

```ts
type Action =
  | { type: 'capabilities'; capabilities: Capabilities }
  | { type: 'passes'; passes: readonly PassMetadata[] }
  | { type: 'inFlight'; inFlight: PassKitState['inFlight'] }
  | { type: 'error'; error: PassKitState['lastError'] }
  | { type: 'result'; result: PassKitState['lastResult'] }
  | { type: 'reset' };
```

### Invariants

- Default state:
  `{ capabilities: { …false, false }, passes: [], inFlight: { kind: 'idle' }, lastError: { kind: 'none' }, lastResult: { kind: 'none' } }`.
- A successful `addFromBytes` / `addFromURL` transitions to
  `lastResult.kind === 'added'` AND triggers an automatic
  `passes()` refresh. A user-cancel transitions to
  `lastResult.kind === 'cancelled'` and does NOT trigger a refresh.
- `inFlight.kind === 'idle'` for the `'unsupported'` /
  `'open-unsupported'` / `'invalid-pass'` / `'download-failed'` /
  `'cancelled'` / `'failed'` error transitions (errors clear the
  in-flight marker).
- Setting `lastError` clears `lastResult` and vice versa, so the UI
  shows exactly one status caption at a time per card.
- The hook checks a `mounted` ref before every dispatch; post-unmount
  dispatches are no-ops (carryover from 030–035 SC-010).

---

## Typed error classes (5)

Declared in `src/native/passkit.types.ts` so all three platform
variants of the bridge import the SAME class identity (`instanceof`
works across `passkit.ts` / `passkit.android.ts` / `passkit.web.ts`).

```ts
export class PassKitNotSupported extends Error {
  readonly code = 'unsupported';
  constructor(message = 'PassKit is iOS-only.') {
    super(message);
    this.name = 'PassKitNotSupported';
  }
}

export class PassKitOpenUnsupported extends Error {
  readonly code = 'open-unsupported';
  constructor(message = 'openPass requires iOS 13.4 or later.') {
    super(message);
    this.name = 'PassKitOpenUnsupported';
  }
}

export class PassKitDownloadFailed extends Error {
  readonly code = 'download-failed';
  readonly httpStatus: number | undefined;
  constructor(message: string, httpStatus?: number) {
    super(message);
    this.name = 'PassKitDownloadFailed';
    this.httpStatus = httpStatus;
  }
}

export class PassKitInvalidPass extends Error {
  readonly code = 'invalid-pass';
  constructor(message = 'Pass invalid or unsigned.') {
    super(message);
    this.name = 'PassKitInvalidPass';
  }
}

export class PassKitCancelled extends Error {
  readonly code = 'cancelled';
  constructor(message = 'Cancelled.') {
    super(message);
    this.name = 'PassKitCancelled';
  }
}
```

### Invariants

- Each class identity is single — re-importing from a different file
  yields `instanceof` equality. The bridge test asserts this round-trip
  across the three platform variants (B7 in
  `contracts/passkit-bridge.md`).
- The `code` field is a `readonly` literal so the hook's classifier
  can `switch (e.code)` for type narrowing.
- `PassKitDownloadFailed` carries an optional `httpStatus` for
  inline-status text ("Download failed (status 404)").
