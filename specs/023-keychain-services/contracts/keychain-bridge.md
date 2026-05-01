# Contract — `src/native/keychain.ts`

The universal JS bridge over the iOS Swift module
`native/ios/keychain/KeychainBridge.swift` and the
`expo-secure-store` fallback. Defines the typed surface every
caller (the store, the hook, the components, the tests) sees.

## Surface

```ts
import type {
  AccessibilityClass,
  AddItemInput,
  KeychainResult,
} from '@/modules/keychain-lab/types';

export interface KeychainBridge {
  addItem(input: AddItemInput): Promise<KeychainResult>;

  getItem(args: {
    label: string;
    accessGroup?: string;
  }): Promise<KeychainResult<string>>;

  updateItem(args: {
    label: string;
    value: string;
    accessGroup?: string;
  }): Promise<KeychainResult>;

  deleteItem(args: {
    label: string;
    accessGroup?: string;
  }): Promise<KeychainResult>;

  listLabels(args?: {
    accessGroup?: string;
  }): Promise<KeychainResult<string[]>>;

  tryAccessGroupProbe(args: {
    accessGroup: string;
  }): Promise<KeychainResult<{ bytes: number }>>;
}

export const keychain: KeychainBridge;
```

## Resolution

At module import time:

1. **Native module present** (custom dev client on iOS):
   `requireOptionalNativeModule('SpotKeychain')` returns the
   real bridge; every method calls into Swift.
2. **iOS / Android without the native module** (e.g. Expo Go):
   the export is a thin adapter over `expo-secure-store`:
   - `addItem` / `getItem` / `updateItem` / `deleteItem` map to
     `setItemAsync` / `getItemAsync` / `setItemAsync` /
     `deleteItemAsync` respectively, with `keychainAccessible`
     set from the `accessibilityClass` (clamped to the two
     classes `expo-secure-store` accepts on iOS:
     `WHEN_UNLOCKED` and `AFTER_FIRST_UNLOCK`; the picker is
     constrained to these two on the fallback path) and
     `requireAuthentication` set from `biometryRequired`.
   - `listLabels` reads the metadata index entry and returns
     `{ kind: 'ok', value: items.map(i => i.label) }`.
   - `tryAccessGroupProbe` resolves
     `{ kind: 'unsupported' }` (no access-group support in
     `expo-secure-store`).
   - `addItem` with `accessGroup` set, with
     `biometryRequired: true`, **or** with an
     `accessibilityClass` outside the two-class clamp resolves
     `{ kind: 'unsupported' }`.
3. **Web**: every method resolves `{ kind: 'unsupported' }`.

## Invariants

- **No throws across the boundary in normal operation.** Every
  documented Apple `OSStatus` maps to a `KeychainResult.kind`.
  Unexpected throws are caught at the bridge edge and returned as
  `{ kind: 'error', message }`.
- **No `console.error` on cancellation** (NFR-006). Cancellation is
  a typed result, not an error.
- **No silent data loss.** `'not-found'` is distinguishable from
  `'ok'` with empty value.
- **No leakage of cleartext into logs.** The bridge never logs
  values; only labels and result kinds.

## Method semantics

### `addItem(input)`

- **Pre**: `input.label` non-empty trimmed; `input.value` non-empty.
- **Post on `'ok'`**: a keychain entry exists for `(label,
  accessGroup ?? defaultGroup)` with the requested
  `kSecAttrAccessible*` constant and (if `biometryRequired`) a
  `SecAccessControl` built with `.biometryCurrentSet` over that
  protection class.
- **`errSecDuplicateItem`**: bridge automatically retries with
  `SecItemUpdate` so the caller never sees `'error'` for duplicate.

### `getItem({ label, accessGroup? })`

- **Post on `'ok'`**: `value` is the stored UTF-8 string. For
  biometry-bound items the OS prompt is presented before the bridge
  resolves; user cancel → `'cancelled'`; failed auth →
  `'auth-failed'`.
- **`errSecItemNotFound`** → `'not-found'`.

### `updateItem({ label, value, accessGroup? })`

- **Post**: replaces the value, preserving the existing ACL. If the
  item does not exist → `'not-found'` (does **not** create).

### `deleteItem({ label, accessGroup? })`

- **Post on `'ok'`**: the keychain entry is gone. Idempotent —
  `'not-found'` is *not* an error from the caller's perspective; the
  store treats it as success.

### `listLabels({ accessGroup? })`

- **Post on `'ok'`**: `value` is the array of labels in the
  metadata index for the requested group (defaults to the lab's
  primary group). Order is insertion order; duplicates impossible.

### `tryAccessGroupProbe({ accessGroup })`

- **Post on `'ok'`**: a probe entry was written into the named
  group and immediately read back; `value.bytes` is the byte length
  of the probe value (currently
  `'spot.keychain.shared.probe'` → 26 bytes).
- **`errSecMissingEntitlement`** → `'missing-entitlement'` (the
  signed entitlement does not include the requested group).

## Test contract (`test/unit/native/keychain.test.ts`)

- **Native present, iOS** — every method returns the typed result;
  the in-memory mock records the `kSecAttrAccessible*` constant
  per call and the test asserts switching the picker switches the
  recorded constant on the next call (SC-007).
- **Native absent, iOS Expo Go** — basic CRUD delegates to
  `expo-secure-store`; extended-only inputs resolve to
  `'unsupported'`.
- **Native absent, Android** — same as iOS Expo Go; the picker is
  constrained to the two clamped classes; biometry via
  `requireAuthentication`.
- **Web** — every method resolves `'unsupported'`.
- **Cancellation** — produces neither `console.error` nor
  `console.warn`; the test asserts both via spies.
