# Implementation Plan: Keychain Services Lab Module

**Branch**: `023-keychain-services` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `keychain-lab` (id `keychain-lab`, label "Keychain Lab",
`platforms: ['ios','android','web']`, `minIOS: '8.0'`) as a single-line
addition to `src/modules/registry.ts` and the `app.json` `plugins` array
(11 → 12 entries). The module showcases Apple's **Security.framework /
Keychain Services** API on iOS through a two-tier strategy:

1. **Basic CRUD** delegates to `expo-secure-store` (already a transitive
   dep from feature 021) on iOS in Expo Go and on Android.
2. **Extended capabilities** (explicit `kSecAttrAccessControl` flags,
   `kSecAttrAccessGroup`, all five `kSecAttrAccessible*` classes) are
   exposed by a custom in-tree Swift bridge
   `native/ios/keychain/KeychainBridge.swift` wrapping
   `SecItemAdd / SecItemCopyMatching / SecItemUpdate / SecItemDelete`.
   The JS bridge `src/native/keychain.ts` returns typed discriminated
   results (`{ kind: 'ok' | 'cancelled' | 'auth-failed' |
   'missing-entitlement' | 'not-found' | 'unsupported' | 'error' }`)
   and never throws across the boundary in normal operation.

A new Expo config plugin `plugins/with-keychain-services/` idempotently
adds `keychain-access-groups` to the iOS entitlements with a single
entry `$(AppIdentifierPrefix)<ios.bundleIdentifier>`, coexisting with
all 9 prior custom plugins (10 if counting `with-local-auth` from 022).

No new public package dependency. Reuses `expo-secure-store` (021) and
ships the Swift bridge in-tree.

## Technical Context

- **Language**: TypeScript 5.9 strict; Swift 5.9 for the iOS bridge.
- **Runtime**: React 19.2 (React Compiler enabled), React Native 0.83,
  Expo SDK 55, expo-router (typed routes),
  `react-native-reanimated` Keyframe API.
- **Native bridge (iOS)**: custom Expo native module
  `native/ios/keychain/KeychainBridge.swift` wrapping the C
  `Security.framework` Keychain Services API:
  `SecItemAdd`, `SecItemCopyMatching`, `SecItemUpdate`,
  `SecItemDelete`, `SecAccessControlCreateWithFlags`. Exposed to JS via
  the Expo Modules API (`Module { Function ... }`). Autolinked when the
  app is built via a custom dev client.
- **JS bridge (universal)**: `src/native/keychain.ts` resolves the
  native module at import time; if absent (Expo Go, Android, Web) it
  short-circuits to either `expo-secure-store` (basic CRUD) or
  `{ kind: 'unsupported' }` (extended methods). No throws across the
  boundary in normal operation.
- **Persistence**:
  - Per-item: keychain (iOS) / Android Keystore (Android) /
    short-circuited (Web).
  - Self-managed metadata index: a single keychain entry
    `spot.keychain.lab.index` (accessibility class
    `whenUnlocked`, no biometry) holds a JSON-encoded array of
    `{ label, accessibilityClass, biometryRequired, createdAt }`. The
    index never contains values. Used to enumerate items the module
    created, avoiding an unbounded
    `SecItemCopyMatching(kSecMatchLimitAll)` scan.
- **State shapes**:
  ```ts
  type AccessibilityClass =
    | 'whenUnlocked'
    | 'afterFirstUnlock'
    | 'whenUnlockedThisDeviceOnly'
    | 'afterFirstUnlockThisDeviceOnly'
    | 'whenPasscodeSetThisDeviceOnly';

  interface KeychainItemMeta {
    id: string;                     // === label
    label: string;
    accessibilityClass: AccessibilityClass;
    biometryRequired: boolean;
    createdAt: string;              // ISO
  }

  type KeychainResult<T = void> =
    | { kind: 'ok'; value?: T }
    | { kind: 'cancelled' }
    | { kind: 'auth-failed' }
    | { kind: 'missing-entitlement' }
    | { kind: 'not-found' }
    | { kind: 'unsupported' }
    | { kind: 'error'; message: string };

  interface AddItemInput {
    label: string;
    value: string;
    accessibilityClass: AccessibilityClass;
    biometryRequired: boolean;
    accessGroup?: string;
  }

  interface UseKeychainItems {
    items: KeychainItemMeta[];
    loading: boolean;
    error: string | null;
    refresh(): Promise<void>;
    addItem(input: AddItemInput): Promise<KeychainResult>;
    revealItem(id: string): Promise<string | null>;   // null on cancel/fail
    deleteItem(id: string): Promise<KeychainResult>;
  }
  ```
- **Test stack**: jest-expo + RNTL, JS-pure. New global mock
  `test/__mocks__/native-keychain.ts` exposes a configurable
  in-memory keychain (label → `{ value, acc, biometry, accessGroup }`),
  recordable call history (asserts `kSecAttrAccessible*` constant per
  call — see SC-007), and per-call result injection
  (`cancelled` / `auth-failed` / `missing-entitlement` / `error`).
  Existing `test/__mocks__/expo-secure-store.ts` (021) is reused for
  the fallback path tests.
- **No new pnpm dependency.** No `eslint-disable` directives for
  unregistered rules.

## Architecture

```
src/modules/keychain-lab/
  index.tsx                        ModuleManifest (id 'keychain-lab', icon 'lock.shield')
  screen.tsx                       iOS screen — composes ItemsList + AddItemForm + AccessGroupCard
  screen.android.tsx               Android — basic CRUD only; AccessGroupCard hidden;
                                   AccessibilityPicker disabled with note
  screen.web.tsx                   Web — IOSOnlyBanner only; bridge never invoked
  keychain-store.ts                Single seam over src/native/keychain.ts;
                                   owns the metadata index; tolerant fallbacks
  accessibility-classes.ts         Canonical list + plain-language descriptions +
                                   mapping to kSecAttrAccessible* constant strings
  hooks/
    useKeychainItems.ts            items / loading / error / refresh / addItem /
                                   revealItem / deleteItem
  components/
    ItemsList.tsx                  Empty-state + ItemRow per metadata entry
    ItemRow.tsx                    label + class label + biometry badge +
                                   Show/Hide + Delete; inline reveal; tolerates
                                   cancelled/auth-failed inline
    AddItemForm.tsx                Label TextInput + Value TextInput (secure) +
                                   AccessibilityPicker + Biometry Switch + Save
    AccessibilityPicker.tsx        All 5 classes with descriptions; disabled on
                                   Android with note
    AccessGroupCard.tsx            Explainer + resolved access-group string +
                                   Try shared keychain button; iOS only
    IOSOnlyBanner.tsx              Per-module banner (fresh; mirrors 021/022)

src/native/
  keychain.ts                      Universal JS bridge facade. Resolves native
                                   module via requireOptionalNativeModule;
                                   falls back to expo-secure-store for basic
                                   CRUD; { kind: 'unsupported' } for extended.

native/ios/keychain/
  KeychainBridge.swift             Expo module wrapping SecItem* with explicit
                                   kSecAttrAccessControl + kSecAttrAccessGroup
  KeychainBridge.podspec           Pod definition (autolinked by custom dev
                                   client; not used in Expo Go)
  expo-module.config.json          { platforms: ['ios'], ios.modules: [...] }

plugins/with-keychain-services/
  index.ts                         withEntitlementsPlist; idempotent;
                                   no-op + console.warn when bundleIdentifier
                                   is missing
  package.json                     { name, version, main, types }

test/__mocks__/
  native-keychain.ts               (new) in-memory keychain + recorder

test/unit/modules/keychain-lab/
  manifest.test.ts
  keychain-store.test.ts
  accessibility-classes.test.ts
  hooks/useKeychainItems.test.tsx
  components/ItemsList.test.tsx
  components/ItemRow.test.tsx
  components/AddItemForm.test.tsx
  components/AccessibilityPicker.test.tsx
  components/AccessGroupCard.test.tsx
  components/IOSOnlyBanner.test.tsx
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx

test/unit/native/
  keychain.test.ts                 Bridge contract: result shape per result
                                   kind; fallback to expo-secure-store when
                                   native module is absent

test/unit/plugins/with-keychain-services/
  index.test.ts                    Idempotent add; coexistence with all 10
                                   prior plugins; no-op on missing bundleId;
                                   AppIdentifierPrefix prefix correctness
```

## JS Bridge Contract — `src/native/keychain.ts`

```ts
export interface KeychainBridge {
  addItem(input: AddItemInput): Promise<KeychainResult>;
  getItem(args: { label: string; accessGroup?: string }):
    Promise<KeychainResult<string>>;
  updateItem(args: { label: string; value: string; accessGroup?: string }):
    Promise<KeychainResult>;
  deleteItem(args: { label: string; accessGroup?: string }):
    Promise<KeychainResult>;
  listLabels(args?: { accessGroup?: string }):
    Promise<KeychainResult<string[]>>;
  tryAccessGroupProbe(args: { accessGroup: string }):
    Promise<KeychainResult<{ bytes: number }>>;
}
```

Resolution order at module import time:

1. `requireOptionalNativeModule('SpotKeychain')` → real bridge if
   present (custom dev client on iOS).
2. Else if `Platform.OS === 'ios' || Platform.OS === 'android'` →
   `expo-secure-store` adapter exposing only `addItem`, `getItem`,
   `updateItem`, `deleteItem`, `listLabels` (the latter via the
   metadata index). All extended-only methods
   (`tryAccessGroupProbe`, ACL flags beyond
   `keychainAccessible: AFTER_FIRST_UNLOCK | WHEN_UNLOCKED`,
   `accessGroup` parameter) resolve to `{ kind: 'unsupported' }`.
3. Else (Web) → every method resolves to `{ kind: 'unsupported' }`.

Error normalisation in the Swift bridge (mapped from `OSStatus`):

| OSStatus                       | Code   | KeychainResult.kind     |
|--------------------------------|--------|-------------------------|
| `errSecSuccess`                | 0      | `'ok'`                  |
| `errSecUserCanceled`           | -128   | `'cancelled'`           |
| `errSecAuthFailed`             | -25293 | `'auth-failed'`         |
| `errSecMissingEntitlement`     | -34018 | `'missing-entitlement'` |
| `errSecItemNotFound`           | -25300 | `'not-found'`           |
| `errSecDuplicateItem`          | -25299 | upgraded to update      |
| `errSecParam`                  | -50    | `'error'`               |
| anything else                  | …      | `'error'`               |

## Hook Contract — `useKeychainItems`

```ts
interface UseKeychainItems {
  items: KeychainItemMeta[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  addItem(input: AddItemInput): Promise<KeychainResult>;
  revealItem(id: string): Promise<string | null>;
  deleteItem(id: string): Promise<KeychainResult>;
}
```

Lifecycle:

1. **Mount** — call `keychainStore.list()` once; sets
   `items` from the metadata index. `mountedRef` guards `setState`
   after unmount (021/022 pattern).
2. **addItem** — write the item via the bridge using the chosen ACL,
   on `'ok'` upsert into the metadata index then `refresh()`. On
   `errSecDuplicateItem` the store retries with `updateItem` so the UI
   never sees a duplicate error.
3. **revealItem** — `getItem({ label })`; biometry-bound items trigger
   the system prompt automatically (the ACL is enforced by the OS).
   On `'ok'` return the cleartext to the caller; the cleartext is
   **never** stored in hook state. On `'cancelled'` / `'auth-failed'`
   return `null`; the row component renders an inline informational
   message. On `'not-found'` remove the row from the metadata index
   and `refresh()` (treats it as already gone).
4. **deleteItem** — `deleteItem({ label })`; on `'ok'` or
   `'not-found'` remove from the metadata index and `refresh()`.
5. **Tolerant errors**: any unexpected throw at the store boundary is
   caught and reduced to `error` state + a single `console.warn`.
   Cancellations are never warned (NFR-006).

## Config Plugin — `with-keychain-services`

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

const KEY = 'keychain-access-groups';

const withKeychainServices: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (modConfig) => {
    const bundleId = modConfig.ios?.bundleIdentifier;
    if (!bundleId) {
      console.warn(
        '[with-keychain-services] ios.bundleIdentifier is missing; ' +
          'skipping keychain-access-groups entitlement.'
      );
      return modConfig;
    }
    const entry = `$(AppIdentifierPrefix)${bundleId}`;
    const existing = modConfig.modResults[KEY];
    const list = Array.isArray(existing) ? existing : [];
    if (!list.includes(entry)) {
      modConfig.modResults[KEY] = [...list, entry];
    }
    return modConfig;
  });
};

export default withKeychainServices;
```

Properties (FR-020 / FR-021 / FR-022):

- Touches **only** `keychain-access-groups`. Never reads or writes
  Info.plist, capabilities, build settings, or any other entitlement.
- Idempotent: re-running on a config that already contains the entry
  is a no-op.
- Safe: missing `bundleIdentifier` produces a single `console.warn`
  and returns the config untouched.
- Coexists with all 10 prior custom plugins; the `app.json` `plugins`
  array grows by exactly one entry (11 → 12 — see SC-004).

## Test Strategy

- **`accessibility-classes.test.ts`** — five entries; each maps to the
  correct `kSecAttrAccessible*` constant string; descriptions are
  non-empty and mention key OS behavior (lock state / device-only /
  passcode-required).
- **`keychain-store.test.ts`** — round-trip via the in-memory mock;
  metadata index is read on `list()`, mutated on `add` / `delete`;
  `errSecDuplicateItem` from the bridge becomes an upsert; bridge
  throws are swallowed → `null` / no-op + single `console.warn`;
  cancellation produces no warn.
- **`useKeychainItems.test.tsx`** — initial mount loads items;
  `addItem` updates the list; `revealItem` returns cleartext on `'ok'`,
  `null` on `'cancelled'` and on `'auth-failed'` (no warn for cancel);
  `deleteItem` removes the row; `not-found` on reveal/delete is
  tolerated (row dropped, no error state).
- **`native/keychain.test.ts`** — bridge contract: when the native
  module is present every method returns the typed result; when the
  module is absent on iOS/Android the basic CRUD methods delegate to
  the `expo-secure-store` mock and `tryAccessGroupProbe` /
  `addItem` with extended ACL flags resolve to `{ kind: 'unsupported' }`;
  Web returns `{ kind: 'unsupported' }` everywhere. Asserts the
  recorder captured the exact `kSecAttrAccessible*` constant per call
  (SC-007).
- **Component tests** (one file each):
  - `ItemsList` — empty-state copy renders; renders one `ItemRow`
    per metadata entry; Add item button visible.
  - `ItemRow` — label / class label / biometry badge render correctly;
    Show toggles to Hide and reveals the value; `cancelled` and
    `auth-failed` paths render the inline informational message and
    keep the value hidden; Delete invokes the callback exactly once.
  - `AddItemForm` — Save disabled until both inputs filled; default
    accessibility class is `whenUnlockedThisDeviceOnly`; biometry
    Switch toggles; Save calls the callback with the typed payload;
    form resets on successful save.
  - `AccessibilityPicker` — renders all five classes with descriptions;
    selection updates via callback; on Android the picker is rendered
    disabled with the documented note.
  - `AccessGroupCard` — explainer + resolved access-group string + Try
    button render; `'ok'` shows the byte-count message; cancellation,
    `'missing-entitlement'`, `'unsupported'` each render their distinct
    inline copy and never throw / log.
  - `IOSOnlyBanner` — renders the per-module copy (mirrors 021/022).
- **Screen variants**:
  - `screen.test.tsx` — iOS variant mounts; ItemsList + AddItemForm +
    AccessGroupCard all render; Add → Show → Delete flow wires through
    the hook.
  - `screen.android.test.tsx` — AccessGroupCard hidden; picker
    disabled; basic CRUD via the `expo-secure-store` mock works.
  - `screen.web.test.tsx` — IOSOnlyBanner present; every interactive
    surface is disabled; the bridge is never instantiated.
- **`manifest.test.ts`** — id `'keychain-lab'`, kebab-case,
  `platforms: ['ios','android','web']`, `minIOS: '8.0'`, single
  occurrence in `MODULES`.
- **`plugins/with-keychain-services/index.test.ts`** — adds the entry
  when absent; preserves existing entries when present (no duplicate);
  re-running is idempotent (call twice → still one entry); missing
  `ios.bundleIdentifier` → `console.warn` + untouched config;
  coexistence smoke test running the plugin **after** all 10 prior
  plugins on a fresh config copy.

## Constitution Compliance (v1.1.0)

- **I. Cross-Platform Parity** — three screen variants; iOS full,
  Android basic, Web disabled with banner. Core "store and reveal a
  secret" journey works on iOS and Android (the extended ACL surface
  is iOS-only and clearly labeled, satisfying the parity exemption
  for "platform-specific behavior that improves UX on that platform").
- **II. Token-Based Theming** — `ThemedText` / `ThemedView`,
  `Spacing` scale, `useTheme()` for colors. No hex literals.
- **III. Platform File Splitting** — `screen.tsx` /
  `screen.android.tsx` / `screen.web.tsx`; native bridge path
  difference handled by the universal `src/native/keychain.ts`
  facade (not by inline `Platform.OS` branches in components).
- **IV. StyleSheet Discipline** — `StyleSheet.create()` only.
- **V. Test-First** — every new module export has a JS-pure test
  including the Swift bridge (covered indirectly via the
  `native-keychain` mock per the 021/022 mock convention; FR-023).
- **Validate-Before-Spec (1.1.0)** — applies. The spec assumes
  `errSecMissingEntitlement` (-34018) is what unentitled builds
  surface for an access-group probe. Validation in research:
  cross-checked against Apple's `Security/SecBase.h`, the
  `keychain-access-groups` documentation, and the documented behavior
  of `SecItemAdd` against an unentitled access group. No build
  validation is required (no new pipeline; pure additive native module
  + entitlement). Documented in research.md §3.

## Risks & Decisions

- **D-01** Custom Swift bridge (vs. `expo-secure-store` only) is
  necessary because `expo-secure-store` does not expose
  `kSecAttrAccessGroup` or any `kSecAttrAccessControl` flags beyond
  the binary `requireAuthentication` + a two-value `keychainAccessible`
  enum. Three of the five accessibility classes the spec demonstrates
  (`whenUnlockedThisDeviceOnly`,
  `afterFirstUnlockThisDeviceOnly`, `whenPasscodeSetThisDeviceOnly`)
  cannot be expressed without `SecItem*` directly. See research §4.
- **D-02** Biometry binding uses `.biometryCurrentSet` — the safer
  default that invalidates the item when the user adds or removes a
  Face ID / Touch ID enrollment. `.biometryAny` would survive
  enrollment changes which weakens the security guarantee the demo
  copy makes. See research §2.
- **D-03** Default accessibility class is
  `whenUnlockedThisDeviceOnly` — no iCloud Keychain backup, only
  readable while the device is unlocked. The most defensive default
  for user secrets and matches Apple's own guidance for password-
  manager-style data.
- **D-04** Self-managed metadata index instead of
  `SecItemCopyMatching(kSecMatchLimitAll)` — the latter would surface
  every keychain item the app has ever written (including those from
  features 021 and 022) and would make the demo's "items the user
  added in this lab" mental model leak. See research §5.
- **D-05** Typed `KeychainResult` discriminated union (no throws
  across the bridge in normal operation) — matches the 021/022
  cancellation policy (NFR-005 / NFR-006); cancellation is not an
  error.
- **D-06** Plugin uses `withEntitlementsPlist` (writes only the
  `keychain-access-groups` key); never touches Info.plist,
  capabilities, build settings, or other entitlements (FR-021).
  Idempotent by checking inclusion before append.
- **D-07** Access-group probe value is the constant
  `'spot.keychain.shared.probe'`; never a user value. The probe is
  small (< 64 bytes) and is safe to write/read repeatedly.
- **R-01** The custom Swift bridge requires a custom dev client; it
  cannot be exercised in Expo Go. The fallback path
  (`expo-secure-store`) keeps basic CRUD working in Expo Go with the
  documented capability reduction (no extended ACL flags, no access
  groups, two accessibility classes only). This is an explicit spec
  assumption, not a deviation.
- **R-02** The shared-keychain probe will only return `'ok'` in a
  signed build with the entitlement; in unsigned simulator builds
  and in Expo Go it returns `'missing-entitlement'`. The UI surfaces
  the friendly "needs entitlement" copy and never throws — verified
  by tests injecting the result.
- **R-03** Android's accessibility-class affordance is intentionally
  collapsed to "Keystore default" and disabled. KeyStore aliases /
  `sharedUserId` are explicitly out of scope.

## Project Structure

```text
specs/023-keychain-services/
├── plan.md              # this file
├── spec.md              # already authored
├── research.md          # Phase 0 output — accessibility classes,
│                        # access controls, access groups, bridge
│                        # rationale, metadata index strategy
├── data-model.md        # Phase 1 output — entities + state shapes
├── contracts/           # Phase 1 output — JS bridge contract +
│                        # plugin contract
│   ├── keychain-bridge.md
│   └── with-keychain-services.md
├── quickstart.md        # Phase 1 output — manual verification steps
└── tasks.md             # Phase 2 output (NOT created by this command)
```

**Structure Decision**: Mobile + native bridge. Module code under
`src/modules/keychain-lab/`; universal JS bridge under `src/native/`;
Swift bridge under `native/ios/keychain/` (autolinked by custom dev
client); Expo config plugin under `plugins/with-keychain-services/`;
all tests under `test/unit/`. Mirrors the layout established by 021
(`sign-in-with-apple`) and 022 (`local-auth-lab`).

## Complexity Tracking

> No constitution violations. The custom Swift bridge increases
> implementation complexity beyond a managed-only feature, but is
> required by the API surface the spec demonstrates (D-01); it is
> not a violation of any constitutional principle.
