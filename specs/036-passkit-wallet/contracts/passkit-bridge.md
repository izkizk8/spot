# Contract — JS bridge to the PassKit / Wallet surface

**Feature**: 036-passkit-wallet
**See**: [spec.md](../spec.md) FR-012, FR-013, FR-014, FR-015, FR-017, FR-027
**See**: [data-model.md](../data-model.md) Entities 1–4 + typed errors
**See**: [research.md](../research.md) §1 (R-A serialisation),
   §3 (R-C scaffold), §4 (R-D classification),
   §5 (R-E openPass gate), §6 (R-F native fetch)

Implementation files:

- `src/native/passkit.ts` (iOS path; imports
  `requireNativeModule('PassKitBridge')`)
- `src/native/passkit.android.ts` (Android stub; rejects every method
  with `PassKitNotSupported`)
- `src/native/passkit.web.ts` (Web stub; rejects every method with
  `PassKitNotSupported`)
- `src/native/passkit.types.ts` (shared types + 5 typed error classes)
- `native/ios/passkit/PassKitBridge.swift` (the native module
  delegated to)

## Invariants (asserted by `test/unit/native/passkit.test.ts`)

- **B1**. Bridge module identity is the literal export shape declared
  below. The native module name `'PassKitBridge'` is distinct from
  prior modules:
    - 013 `'AppIntents'`
    - 014/027/028 `'WidgetCenter'`
    - 029 `'FocusFilters'`
    - 030 `'BackgroundTasks'`
    - 031 `'Spotlight'`
    - 032 `'QuickLook'`
    - 033 `'ShareSheet'`
    - 034 `'ARKitBridge'` / `'ARKitView'`
    - 035 `'BleCentralBridge'`
- **B2**. On iOS the bridge delegates every method to the native
  module obtained from
  `requireNativeModule('PassKitBridge')`. The native module is
  imported in `passkit.ts` and **no other file** in the project.
- **B3**. All mutating async methods (`addPassFromBytes`,
  `addPassFromURL`, `openPass`) are serialised through a
  closure-scoped promise chain inherited verbatim from 030 / 031 /
  032 / 033 / 034 / 035 (`enqueue` helper). Two back-to-back calls
  produce native invocations in submission order even if the first
  rejects. Capability probes (`canAddPasses`,
  `isPassLibraryAvailable`) and the read-only `passes()` are NOT
  serialised.
- **B4**. On Android (`passkit.android.ts`) and Web
  (`passkit.web.ts`), every async method rejects with
  `PassKitNotSupported`. `canAddPasses()` and
  `isPassLibraryAvailable()` resolve with `false` on those
  platforms (FR-013 — see Method behaviour below). No native module
  is imported on those variants.
- **B5**. `openPass` short-circuits on iOS < 13.4 with a synchronous
  `PassKitOpenUnsupported` rejection (R-E); the JS bridge inspects
  `Platform.constants?.osVersion` parsed as a `[major, minor]`
  tuple. The Swift bridge ALSO rejects on iOS < 13.4 via
  `if #available(iOS 13.4, *) { ... } else { ... }`, so the gate
  is enforced even if the JS-side check is bypassed.
- **B6**. The Swift bridge resolves `addPassFromBytes` /
  `addPassFromURL` with `{ added: true }` when the user approves
  `PKAddPassesViewController` and `{ added: false }` when the user
  cancels. The hook treats both `{ added: false }` and a
  `PassKitCancelled` rejection as a cancellation (R-D, defensive).
- **B7**. The five typed error classes (`PassKitNotSupported`,
  `PassKitOpenUnsupported`, `PassKitDownloadFailed`,
  `PassKitInvalidPass`, `PassKitCancelled`) are the SAME class
  identity across the three platform files (each variant imports
  them from `passkit.types.ts`). `instanceof` works across
  platforms.
- **B8**. `passes()` resolves with an empty array when the library
  is empty; never resolves with `null`/`undefined`. Each entry's
  `passType` is one of the five `PassCategory` values; unknown
  native cases fall through to `'generic'` with a `console.warn`
  emitted by the iOS bridge wrapper (research §8).
- **B9**. The bridge never emits events. Any state synchronisation
  with Wallet (e.g., a pass added by the user via Safari) requires
  an explicit `passes()` refresh from the JS layer (FR-007).

## Typed surface

```ts
import type {
  PassMetadata,
  PassCategory,
  Capabilities,
} from './passkit.types';

// 6 methods.

// Capability probes — never serialised; resolve with `false` on Android / Web.
declare function canAddPasses(): Promise<boolean>;
declare function isPassLibraryAvailable(): Promise<boolean>;

// Read-only enumeration — never serialised; rejects with PassKitNotSupported on Android / Web.
declare function passes(): Promise<readonly PassMetadata[]>;

// Mutating — serialised through closure-scoped promise chain (B3).
declare function addPassFromBytes(base64: string): Promise<{ added: boolean }>;
declare function addPassFromURL(url: string): Promise<{ added: boolean }>;
declare function openPass(
  passTypeIdentifier: string,
  serialNumber: string,
): Promise<void>;

// iOS-version helper (synchronous; pure read; no native side-effect).
declare function isOpenPassSupported(): boolean;

export {
  canAddPasses,
  isPassLibraryAvailable,
  passes,
  addPassFromBytes,
  addPassFromURL,
  openPass,
  isOpenPassSupported,
};
export {
  PassKitNotSupported,
  PassKitOpenUnsupported,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitCancelled,
} from './passkit.types';
```

## Method behaviour

| Method | Resolves with | Common rejections |
|--------|---------------|-------------------|
| `canAddPasses()` | `true` iff `PKPassLibrary.isPassLibraryAvailable() && +[PKPassLibrary canAddPasses]`; `false` on Android / Web | none in normal operation |
| `isPassLibraryAvailable()` | `PKPassLibrary.isPassLibraryAvailable()`; `false` on Android / Web | none |
| `passes()` | `readonly PassMetadata[]` (empty array if library has no passes) | `PassKitNotSupported` (Android / Web) |
| `addPassFromBytes(base64)` | `{ added: true }` on user approval; `{ added: false }` on user cancel | `PassKitInvalidPass`, `PassKitNotSupported`, native presentation failure → `Error` |
| `addPassFromURL(url)` | `{ added: true }` on approval; `{ added: false }` on cancel | `PassKitDownloadFailed` (with `httpStatus`), `PassKitInvalidPass`, `PassKitNotSupported`, `Error` |
| `openPass(id, serial)` | `void` once Wallet is opened to the pass | `PassKitOpenUnsupported` (iOS < 13.4), `PassKitNotSupported` (Android / Web), `Error` if the pair doesn't match a pass in the library |

## Error mapping

The Swift bridge translates platform errors to the typed JS classes:

| Source | Typed class |
|--------|-------------|
| `PKPass(data:)` initialiser throws | `PassKitInvalidPass` |
| `URLSession` returns non-2xx response | `PassKitDownloadFailed(message, httpStatus)` |
| `URLSession` task fails (network error) | `PassKitDownloadFailed(message)` (no `httpStatus`) |
| User dismisses `PKAddPassesViewController` without approving | resolves with `{ added: false }` (B6); also accepted as `PassKitCancelled` from older iOS that surface cancellation as a delegate error |
| iOS < 13.4 `openPass` invocation | `PassKitOpenUnsupported` |
| Any other `NSError` | `Error` (generic; the hook classifier dispatches as `'failed'`) |

## Cross-platform identity guarantee

- The shared module `passkit.types.ts` is the single source of the
  five typed error classes. The three platform variants of the
  bridge re-export them; this guarantees `e instanceof
  PassKitNotSupported` works regardless of which platform's bridge
  threw.
- Imported via:
  ```ts
  import { PassKitNotSupported } from '@/native/passkit.types';
  ```
  consumers MAY also import via `@/native/passkit` which re-exports
  the same identities.

## Test surface (sketch)

`test/unit/native/passkit.test.ts` exercises:

- **iOS path** with a mocked `requireNativeModule('PassKitBridge')`:
  every method delegates exactly once to the native module; the
  serialisation invariant (B3) holds for two back-to-back
  `addPassFromBytes` calls; the iOS-version short-circuit (B5)
  rejects with `PassKitOpenUnsupported` on `'13.0'`, `'13.3'`,
  `'13.10'`-malformed, and a missing version; resolves through to
  the native call on `'13.4'`, `'13.4.1'`, `'14.0'`, `'17.0'`.
- **Android path**: every async method rejects with
  `PassKitNotSupported`; capability probes resolve with `false`;
  `requireNativeModule` is NOT imported (verified by mocking the
  module and asserting it's untouched).
- **Web path**: identical to Android.
- **Cross-platform identity**: importing
  `PassKitNotSupported` from `passkit.ts` and from
  `passkit.web.ts` yields the SAME class
  (`A === B` and `instanceof` both round-trip).
- **`PassMetadata.passType` normalisation**: a native-side
  `'unknown'` value is normalised to `'generic'` with a
  `console.warn` (research §8 + R12).
