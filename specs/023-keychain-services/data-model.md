# Data Model — 023 Keychain Services Lab

Phase 1 output. All types are TypeScript; field validation rules
mirror the spec's Functional Requirements.

## Entities

### `AccessibilityClass`

Enum of the five `kSecAttrAccessible*` constants the module exposes.

```ts
type AccessibilityClass =
  | 'whenUnlocked'                      // kSecAttrAccessibleWhenUnlocked
  | 'afterFirstUnlock'                  // kSecAttrAccessibleAfterFirstUnlock
  | 'whenUnlockedThisDeviceOnly'        // kSecAttrAccessibleWhenUnlockedThisDeviceOnly
  | 'afterFirstUnlockThisDeviceOnly'    // kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  | 'whenPasscodeSetThisDeviceOnly';    // kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
```

Validation:

- Must be one of the five literal values; the picker enforces this.
- Default value: `'whenUnlockedThisDeviceOnly'` (FR-017, D-03).

### `AccessibilityClassDescriptor`

Drives the picker UI and the Swift bridge mapping. Lives in
`src/modules/keychain-lab/accessibility-classes.ts`.

```ts
interface AccessibilityClassDescriptor {
  key: AccessibilityClass;
  label: string;                  // short label, e.g. "When Unlocked"
  description: string;            // single sentence, plain language
  secAttrConstant: string;        // 'kSecAttrAccessibleWhenUnlocked', etc.
  deviceOnly: boolean;            // true for *ThisDeviceOnly variants
  requiresPasscode: boolean;      // true for whenPasscodeSetThisDeviceOnly
}
```

### `KeychainItemMeta`

Metadata for one stored item. Held in the metadata index; never
contains the value.

```ts
interface KeychainItemMeta {
  id: string;                       // === label; unique within the lab
  label: string;                    // user-supplied; trimmed, non-empty
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  createdAt: string;                // ISO 8601
}
```

Validation:

- `label`: trimmed; length ≥ 1 and ≤ 64; printable characters only.
- `id` is structurally identical to `label`; collision = upsert
  (the store performs `SecItemUpdate` on `errSecDuplicateItem`).
- `createdAt`: produced by `new Date().toISOString()` at add time.

State transitions:

- **created** — `addItem` resolves `'ok'`; row appended to index.
- **updated** — `addItem` with an existing `label` →
  `SecItemUpdate`; `createdAt` is preserved.
- **deleted** — `deleteItem` resolves `'ok'` or `'not-found'`; row
  removed from index.

### `AddItemInput`

Inputs accepted by `useKeychainItems.addItem` and the JS bridge
`addItem`.

```ts
interface AddItemInput {
  label: string;
  value: string;
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  accessGroup?: string;             // optional; default = app's primary group
}
```

Validation:

- `label`: as in `KeychainItemMeta`.
- `value`: length ≥ 1 and ≤ 4096 (keychain practical limit;
  enforced before the bridge call).
- `accessGroup`: when provided, must match
  `^[A-Z0-9]{10}\.[a-zA-Z0-9.-]+$` (TeamID-prefixed bundle id) **or**
  the literal `$(AppIdentifierPrefix)<bundleId>` form when emitted by
  the plugin; the bridge accepts both and resolves at sign time.

### `KeychainResult<T>`

Discriminated union returned by every JS bridge method. No throws
across the boundary in normal operation (NFR-005).

```ts
type KeychainResult<T = void> =
  | { kind: 'ok'; value?: T }
  | { kind: 'cancelled' }
  | { kind: 'auth-failed' }
  | { kind: 'missing-entitlement' }
  | { kind: 'not-found' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };
```

Mapping from `OSStatus`:

| OSStatus                       | Code   | kind                    |
|--------------------------------|--------|-------------------------|
| `errSecSuccess`                | 0      | `'ok'`                  |
| `errSecUserCanceled`           | -128   | `'cancelled'`           |
| `errSecAuthFailed`             | -25293 | `'auth-failed'`         |
| `errSecMissingEntitlement`     | -34018 | `'missing-entitlement'` |
| `errSecItemNotFound`           | -25300 | `'not-found'`           |
| `errSecDuplicateItem`          | -25299 | (upgraded to update)    |
| any other                      | …      | `'error'`               |

### `MetadataIndex`

The persisted enumeration record. One keychain entry under the fixed
key `spot.keychain.lab.index`, accessibility class `whenUnlocked`,
no biometry, no access group.

```ts
interface MetadataIndex {
  version: 1;
  items: KeychainItemMeta[];
}
```

Validation:

- `version`: exactly `1`. On version mismatch the store treats the
  index as missing and rebuilds empty.
- `items`: deduplicated by `id`; the store enforces uniqueness on
  every write.

### `UseKeychainItems` (hook return)

```ts
interface UseKeychainItems {
  items: KeychainItemMeta[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  addItem(input: AddItemInput): Promise<KeychainResult>;
  revealItem(id: string): Promise<string | null>;   // null on cancel/fail/not-found
  deleteItem(id: string): Promise<KeychainResult>;
}
```

Invariants:

- `revealItem` never stores the cleartext in hook or component
  state outside the lifetime of the inline reveal in `ItemRow`
  (NFR-004).
- `error` is reset to `null` on every successful `refresh()`.
- `loading` is `true` only during the initial mount load and
  refresh calls; per-action operations (`addItem` / `deleteItem` /
  `revealItem`) own their own local in-flight indicators inside
  the components that triggered them.

## Relationships

```
                       ┌──────────────────────────┐
                       │    KeychainItemMeta[]    │
                       │   (in MetadataIndex)     │
                       └────────────┬─────────────┘
                                    │ 1:N
                                    ▼
   ┌────────────────────┐      ┌────────────────────┐
   │  Keychain entry    │ 1:1  │  KeychainItemMeta  │
   │ (label, value, ACL)│◀────▶│ (label, class,     │
   │ stored via SecItem │      │  biometry, created)│
   └────────────────────┘      └────────────────────┘
```

The metadata index is the **source of truth for enumeration**;
each entry in it corresponds to exactly one keychain entry written
by the lab. Cleartext values live only in the keychain itself —
never in the index, never in React state past a reveal's lifetime.
