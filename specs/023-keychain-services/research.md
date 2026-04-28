# Research — 023 Keychain Services Lab

Phase 0 output for the Keychain Lab module. Resolves every
NEEDS-CLARIFICATION item implicit in the spec and records the
rationale for each technical decision.

## 1. Keychain accessibility classes (`kSecAttrAccessible*`)

Apple's Keychain Services exposes five mutually exclusive
accessibility classes that determine **when the OS will let the
process read the item back**. Each class is a constant string passed
as the value of the `kSecAttrAccessible` attribute when the item is
written. Once written, the class is immutable for that item — to
change it, delete and re-add.

| Constant                                            | JS key                                | Readable when…                                          | iCloud Keychain backup | Survives device migration |
|-----------------------------------------------------|---------------------------------------|---------------------------------------------------------|------------------------|---------------------------|
| `kSecAttrAccessibleWhenUnlocked`                    | `whenUnlocked`                        | device unlocked                                         | yes                    | yes                       |
| `kSecAttrAccessibleAfterFirstUnlock`                | `afterFirstUnlock`                    | after first unlock since boot                           | yes                    | yes                       |
| `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`      | `whenUnlockedThisDeviceOnly`          | device unlocked                                         | **no**                 | **no**                    |
| `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`  | `afterFirstUnlockThisDeviceOnly`      | after first unlock since boot                           | **no**                 | **no**                    |
| `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`   | `whenPasscodeSetThisDeviceOnly`       | device unlocked **and** passcode is currently set       | **no**                 | **no** (cleared if passcode is removed) |

**Two deprecated classes** (`AccessibleAlways` and
`AccessibleAlwaysThisDeviceOnly`) are intentionally **not** exposed
by this module — they are deprecated since iOS 12 and Apple's
guidance is to migrate away.

### When to use each (used as picker copy in `accessibility-classes.ts`)

- **`whenUnlocked`** — short-lived secrets users expect to roam to
  their other devices via iCloud Keychain (e.g. demo "syncable" data).
  The keychain item is restored when restoring from an iCloud backup
  to a different device.
- **`afterFirstUnlock`** — background-readable secrets needed before
  the user has interacted with the device this boot (e.g. a token a
  push-notification handler needs at 3am). Still iCloud-backed.
- **`whenUnlockedThisDeviceOnly`** — *the default we ship.* Strongest
  default for "user secret I do not want leaving this physical
  device". No iCloud restore on a new device.
- **`afterFirstUnlockThisDeviceOnly`** — background-readable, but
  bound to this device. Use for refresh tokens, signing material,
  device-specific caches.
- **`whenPasscodeSetThisDeviceOnly`** — strictest. The item is
  irrecoverable if the user removes their passcode (the OS deletes
  the item on passcode removal). Required pairing for items that the
  spec describes as "cannot exist on a non-passcode device".

**Decision**: ship all five; default to `whenUnlockedThisDeviceOnly`
(D-03 in plan.md).
**Rationale**: covers Apple's full recommended matrix while picking
the defensive default for unfamiliar users.
**Alternatives considered**: shipping only the three "ThisDeviceOnly"
variants — rejected because the demo's pedagogical value is the
trade-off explanation, which requires the iCloud-backed pair.

## 2. `kSecAccessControl` flags — `.biometryCurrentSet` vs `.biometryAny`

`kSecAttrAccessControl` is built via
`SecAccessControlCreateWithFlags(allocator, protection, flags, &error)`
where `protection` is one of the accessibility classes from §1 and
`flags` is a `SecAccessControlCreateFlags` bitfield. Relevant flags:

- `.userPresence` — biometric **or** passcode satisfies. Falls back
  silently to passcode if biometry is not enrolled / locked out.
- `.biometryAny` — any currently-enrolled biometric (Face ID or
  Touch ID) satisfies. **Survives** enrollment changes: adding or
  removing a fingerprint / face does not invalidate the item.
- `.biometryCurrentSet` — the **current** set of enrolled biometrics
  satisfies. Adding or removing **any** enrolled biometric
  invalidates the item; the next read returns `errSecAuthFailed`.
- `.devicePasscode` — only the device passcode satisfies; biometry
  is not offered.
- `.applicationPassword` — extra app-supplied password layer (not
  used by this module).

### Decision

`.biometryCurrentSet` is what we apply when the user toggles
**Biometry required**. Rationale:

1. The user-facing copy promises *"the value can only be read after a
   successful biometric auth"*. `.biometryAny` would let an attacker
   who enrols their own face/finger after stealing an unlocked phone
   read the secret — `.biometryCurrentSet` invalidates the item the
   moment they add their biometric, which is the property a user
   reading the copy actually expects.
2. It matches Apple's guidance for "high-value, biometry-protected"
   items (e.g. password managers, authenticator apps).

We do **not** OR in `.devicePasscode` (no fallback): the demo's
explicit value is "biometry-only access". The `.userPresence`
fallback is offered transparently by the OS when needed for the
unbound case (no `kSecAttrAccessControl`) via `requireAuthentication`
in `expo-secure-store`.

### Alternatives considered

- `.biometryAny` — rejected, weaker security model than the copy
  promises (D-02).
- `.userPresence` — rejected, falls back to passcode silently and
  thus does not demonstrate the biometry-binding feature.
- OR-ing `.devicePasscode` as fallback — rejected, would dilute the
  demo's stated guarantee.

## 3. Keychain access groups + `$(AppIdentifierPrefix)`

A **keychain access group** is an `kSecAttrAccessGroup` attribute
whose value is a string of the form
`<TeamIdentifier>.<bundleIdentifier>` or a custom group name shared
across multiple apps owned by the same team. The OS enforces that:

- An app may only read/write items in groups whose identifiers are
  declared in the app's signed `keychain-access-groups` entitlement.
- An app's *default* access group is the **first** entry in the
  entitlement array; if no entitlement is present, the default is
  the implicit "primary" group for the app id (which is itself
  `<TeamID>.<bundleIdentifier>` in practice but is not addressable
  from JS without the entitlement being explicit).

`$(AppIdentifierPrefix)` is an Xcode build setting that expands at
sign time to the team identifier followed by a trailing dot
(e.g. `ABCDE12345.`). Apple's recommended pattern for the
entitlement is therefore `$(AppIdentifierPrefix)<bundleId>` — the
final signed value resolves to `ABCDE12345.com.izkizk8.spot`.

### Why the demo can only fully succeed in a signed build

- Expo Go is signed with **Expo's** team identifier and bundle id;
  it does not carry our `keychain-access-groups` entitlement, so any
  attempt to address `ABCDE12345.com.izkizk8.spot` (our resolved
  group) returns `errSecMissingEntitlement` (-34018).
- The iOS Simulator strips entitlements on most build configurations
  (only signed-for-device builds carry the entitlement faithfully);
  even on a custom dev-client simulator build the access-group probe
  may fall back to the default group, which from the runtime's
  perspective looks like "no group entitlement" for any *named* group.
- A development-signed build on a real device with the entitlement
  embedded is what `'ok'` requires.

### Decision

The plugin emits `$(AppIdentifierPrefix)<bundleId>` (the literal
build-setting expansion, not the resolved string). At runtime the
JS bridge passes the resolved string `<TeamID>.<bundleId>` to the
Swift bridge — the team id is read at runtime from the embedded
provisioning profile by the bridge (or, in fallback, just from the
bundle id with the team-prefix omitted; the bridge then surfaces
`'missing-entitlement'`, which the UI handles).

### Alternatives considered

- A hard-coded team-prefixed string in the plugin — rejected, the
  team prefix changes per CI signing identity and is not knowable
  at config-plugin time.
- An empty `keychain-access-groups` array — rejected, has no effect
  and produces a misleading "entitlement present but useless"
  configuration.

## 4. Why a custom Swift bridge is necessary

`expo-secure-store` exposes (as of Expo SDK 55):

```ts
interface SecureStoreOptions {
  keychainService?: string;                 // kSecAttrService
  keychainAccessible?:
    | AFTER_FIRST_UNLOCK
    | AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
    | ALWAYS                               // deprecated
    | ALWAYS_THIS_DEVICE_ONLY              // deprecated
    | WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    | WHEN_UNLOCKED
    | WHEN_UNLOCKED_THIS_DEVICE_ONLY;
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
}
```

It maps `requireAuthentication: true` to a fixed
`SecAccessControl` built with `.userPresence` (biometry-or-passcode,
not `.biometryCurrentSet`). The five accessibility classes are
**all** addressable through `keychainAccessible`, so the gap is
*not* the accessibility classes themselves — it is:

1. **No `kSecAttrAccessGroup`**. The package does not accept an
   `accessGroup` option; you cannot read/write items in a named group.
2. **No control over the `SecAccessControl` flags**. The biometry
   choice is fixed at `.userPresence`; you cannot bind to
   `.biometryCurrentSet`, `.biometryAny`, or `.devicePasscode`.
3. **No enumeration**. There is no `getAllKeysAsync` equivalent;
   `expo-secure-store` reads/writes/deletes by key only. (This is
   the underlying reason for the self-managed metadata index — §5 —
   even on the fallback path.)

The custom Swift bridge addresses (1) and (2) directly and lets the
JS bridge expose typed `KeychainResult` values for every error path.
For (3) we use the metadata index strategy described next, which
works for **both** the custom-bridge path and the
`expo-secure-store` fallback path and is the only way to enumerate
"items this module created" deterministically.

### Decision

Ship a thin in-tree Expo native module
`native/ios/keychain/KeychainBridge.swift` exposing six methods
(`addItem`, `getItem`, `updateItem`, `deleteItem`, `listLabels`,
`tryAccessGroupProbe`). Build the `SecAccessControl` per call from
the (accessibilityClass × biometryRequired) pair. Map every
`OSStatus` to a typed `KeychainResult.kind` per the table in plan.md.

### Alternatives considered

- Forking / patching `expo-secure-store` — rejected, would fork a
  shared dependency and add maintenance debt for the showcase.
- Using a third-party package (`react-native-keychain`) — rejected,
  introduces a new public dependency for a single-feature
  demonstration and would still need a config plugin for the
  entitlement.
- A pure JS implementation via `NativeModules` — rejected, the
  Expo Modules API is the project standard and gives us typed
  function signatures, autolinking, and a managed JSI path.

## 5. Self-managed metadata index strategy

`SecItemCopyMatching(kSecMatchLimitAll)` returns *every* keychain
item visible to this app id, including items written by:

- `expo-secure-store` from feature 021 (Sign in with Apple — stores
  the user identifier) and 022 (Local Auth — secure note).
- Any future feature that uses the keychain.
- Items the app received via iCloud Keychain restore.

Surfacing all of these in the lab's Items List would (a) leak
unrelated app state into a demo screen, (b) make the spec's
acceptance scenarios non-deterministic across feature additions,
and (c) potentially expose biometry-bound items from other features
to a non-biometry-bound enumeration call (which on iOS does not
*read* the value but does enumerate the metadata).

### Decision

Maintain a single keychain entry under the fixed key
`spot.keychain.lab.index` (accessibility class
`whenUnlocked`, no biometry, no access group) whose value is a
JSON-encoded array of `KeychainItemMeta`:

```json
[
  {
    "id": "demo",
    "label": "demo",
    "accessibilityClass": "whenUnlockedThisDeviceOnly",
    "biometryRequired": false,
    "createdAt": "2026-04-28T12:34:56.789Z"
  }
]
```

The store reads/writes the index on `list()` / `add()` / `delete()`
and exposes it as the source of truth for the Items List. The
metadata index never contains the cleartext value (NFR-004).

### Properties

- **Bounded**: the index only grows for items the user added in
  this lab. Empty by default; reset by deleting all items in the
  Items List.
- **Recoverable**: if the index is missing or corrupt, `list()`
  returns an empty list and silently rewrites it on next `add()`.
- **Cheap**: a JSON parse/serialise per list refresh. The Items
  List is interactively bounded by what a user types into the
  Add form (single-digit counts in practice).
- **Cross-platform consistent**: the same index exists on the
  Android fallback path via `expo-secure-store`; the index key is
  identical so test assertions are platform-agnostic.

### Alternatives considered

- `SecItemCopyMatching(kSecMatchLimitAll)` with a per-item label
  prefix filter — rejected, fragile to label collisions, exposes
  unrelated items if a user happens to choose a colliding prefix,
  and still requires native code for filtering.
- A file under `FileSystem.documentDirectory` — rejected, secrets
  metadata sitting outside the keychain would create an awkward
  asymmetry; keychain is the natural store and we already have the
  bridge.
- An in-memory-only list — rejected, would not survive an app
  restart, breaking the spec's "Items List immediately shows all
  items previously written by this module" acceptance.

## 6. Build / Validate-Before-Spec note

Per Constitution v1.1.0 the plan phase must include a validation
step for build-pipeline / infrastructure / external-service work.
This feature is purely additive in JS + an in-tree native module +
a single-key entitlement plugin; there is no new build pipeline,
no new external service, and no new pnpm dependency. **No
proof-of-concept build is required.** The validations performed
here are documentary (Apple `Security/SecBase.h` constants, public
documentation of `keychain-access-groups`) and cover every
non-obvious assumption the spec makes.

## Summary of decisions

| ID    | Decision                                                                 | Source       |
|-------|--------------------------------------------------------------------------|--------------|
| D-01  | Custom Swift bridge for ACL + access groups                              | §4           |
| D-02  | Biometry binds to `.biometryCurrentSet`                                  | §2           |
| D-03  | Default class `whenUnlockedThisDeviceOnly`                               | §1           |
| D-04  | Self-managed metadata index, not `kSecMatchLimitAll`                     | §5           |
| D-05  | Typed `KeychainResult` discriminated union; no throws on cancellation    | plan §JS Bridge |
| D-06  | Plugin uses `withEntitlementsPlist`, idempotent, scoped                  | plan §Plugin |
| D-07  | Probe constant `'spot.keychain.shared.probe'`                            | plan §Risks  |
