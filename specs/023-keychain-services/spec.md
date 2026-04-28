# Feature Specification: Keychain Services Lab Module

**Feature Branch**: `023-keychain-services`
**Feature Number**: 023
**Created**: 2026-04-28
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS module showcasing Apple's **Keychain Services** framework
features that go beyond what `expo-secure-store` exposes by default —
biometry-bound items, Access Control List (ACL) flags, accessibility
classes, and access groups for sharing items across apps and extensions.

## Overview

The Keychain Services module ("Keychain Lab") is a feature card in the
iOS Showcase registry (`id: 'keychain-lab'`, label `"Keychain Lab"`,
`platforms: ['ios','android','web']`, `minIOS: '8.0'`). It demonstrates
the **Security.framework / Keychain Services** API on iOS through a
combination of two layers:

1. **Basic CRUD** uses `expo-secure-store` (already a transitive
   dependency from feature 021) with the options it exposes today
   (`keychainAccessible`, `requireAuthentication`,
   `authenticationPrompt`). Android falls through to the Android Keystore
   via the same package; Web is unsupported and shows an
   `IOSOnlyBanner`.
2. **Extended capabilities** — explicit
   `kSecAttrAccessControl` flags (e.g. `.biometryCurrentSet`,
   `.biometryAny`, `.userPresence`, `.devicePasscode`), arbitrary
   `kSecAttrAccessGroup`, and per-item accessibility classes
   (`kSecAttrAccessibleWhenUnlocked`,
   `kSecAttrAccessibleAfterFirstUnlock`,
   `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`,
   `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`,
   `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`) — surface through
   a thin custom Swift bridge `native/ios/keychain/KeychainBridge.swift`
   that wraps `SecItemAdd / SecItemCopyMatching / SecItemUpdate /
   SecItemDelete`. The JS bridge `src/native/keychain.ts` exposes the
   extended API and falls back to a `KeychainNotSupported` error on
   non-iOS platforms.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-keychain-services`).
3. `package.json` / `pnpm-lock.yaml` — no new public package; reuses
   `expo-secure-store` (already installed) and ships a private native
   module under `native/ios/`.
4. `plugins/with-keychain-services/` — new Expo config plugin that
   idempotently adds the `keychain-access-groups` entitlement using the
   app's bundle identifier (`$(AppIdentifierPrefix)<bundleId>`) as the
   access-group prefix, and coexists with all prior 9 plugins (10 → 11
   after this feature, accounting for `./plugins/with-local-auth` from
   022).

The screen has three sections: an **Items List** of all keychain items
written by this module (label, accessibility class, biometry-bound flag,
per-row Show / Delete buttons, plus an "Add item" affordance); an
**Add Item** form (label + value inputs, accessibility-class picker,
biometry-required toggle, Save button); and an **Access Group** card
(short explainer + a "Try shared keychain" button that attempts a
read/write into the shared access group and surfaces a clear
"needs entitlement" message in unentitled / unsigned builds).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inspect stored keychain items (Priority: P1)

A user opens the Keychain Lab card. The Items List immediately shows all
keychain items previously written by this module: each row shows the
item's label, the accessibility class it was stored with, and a badge if
the item is biometry-bound. Each row has Show and Delete buttons. Below
the list there is an "Add item" button.

**Why P1**: Without the list, the rest of the feature has no surface to
demonstrate against; CRUD without read is invisible.

**Independent Test**: Open the screen — the Items List renders with
either an empty-state placeholder ("No keychain items yet — tap Add
item to create one") or one row per stored item, with all three columns
populated.

**Acceptance Scenarios**:

1. **Given** no items have been stored, **When** the screen mounts,
   **Then** the Items List renders an empty-state placeholder and the
   Add item button is enabled.
2. **Given** at least one item exists, **When** the screen mounts,
   **Then** the list renders one row per item with label, accessibility
   class label, and a "🔒 biometry" badge when applicable; each row has
   Show and Delete buttons.
3. **Given** an item row, **When** the user taps Show, **Then** the row
   inline-reveals the value; if the item is biometry-bound the read
   triggers the system biometric prompt first; on cancel/failure the
   value remains hidden and a non-error informational message is shown
   inline on the row.
4. **Given** an item row, **When** the user taps Delete, **Then**
   `SecItemDelete` (or `SecureStore.deleteItemAsync`) is invoked exactly
   once, the row is removed from the list, and the empty-state
   placeholder reappears if the list becomes empty.

---

### User Story 2 — Add a keychain item with explicit accessibility class and optional biometry binding (Priority: P1)

A user taps Add item, types a label and a value, picks one of the five
accessibility classes from a picker (default
`whenUnlockedThisDeviceOnly`), optionally toggles **Biometry required**,
and taps Save. The item is written to the keychain with the configured
ACL. The Items List re-renders with the new row.

**Why P1**: This is the core showcase: the only way to demonstrate the
extended Keychain Services API is to let the user pick the ACL and
accessibility class explicitly.

**Independent Test**: From the empty state, fill the form (label
`"demo"`, value `"hello"`, default class, biometry off) and tap Save;
the form collapses, the Items List shows one row labelled `"demo"` with
the chosen accessibility class, and tapping Show reveals `"hello"`.

**Acceptance Scenarios**:

1. **Given** an empty form, **When** the user submits with a blank
   label, **Then** the Save button is disabled and no bridge call is
   made.
2. **Given** a valid label + value + accessibility class **with biometry
   off**, **When** the user taps Save, **Then** the bridge invokes
   `SecItemAdd` with the chosen `kSecAttrAccessible*` constant, **no**
   `kSecAttrAccessControl`, the value as `kSecValueData`, the label as
   `kSecAttrAccount` (and `kSecAttrLabel`), and resolves successfully.
3. **Given** a valid form **with biometry on**, **When** the user taps
   Save, **Then** the bridge invokes `SecItemAdd` with a
   `SecAccessControl` created from the chosen accessibility class plus
   `.biometryCurrentSet` (no fallback flag), and the resulting row in
   the Items List shows the "🔒 biometry" badge.
4. **Given** an item with the same label already exists, **When** the
   user submits Save, **Then** the bridge performs `SecItemUpdate` (or
   `SecItemDelete` + `SecItemAdd`) so duplicate-add (`errSecDuplicate`)
   never surfaces to the UI as an error.
5. **Given** a Save succeeds, **When** the form is reset, **Then**
   inputs are cleared, the picker resets to the default class, biometry
   toggle resets to off, and the Items List re-fetches.

---

### User Story 3 — Pick an accessibility class to compare lifecycle behavior (Priority: P2)

A user opens the accessibility-class picker and reads a one-line
description for each of the five classes. The selection determines when
the OS will keep the item readable (locked vs unlocked, this device
only, requires passcode set, etc.).

**Acceptance Scenarios**:

1. **Given** the picker is open, **When** the user reads each option,
   **Then** each option renders a short, plain-language description
   (e.g. `"whenUnlocked — readable while the device is unlocked; backed
   up to iCloud Keychain"`).
2. **Given** a `*ThisDeviceOnly` class is selected and the item is
   saved, **When** the row renders, **Then** the row visually
   distinguishes "device-only" items (e.g. a small "device-only" badge).
3. **Given** the `whenPasscodeSetThisDeviceOnly` class is selected on a
   device with **no passcode set**, **When** the user taps Save,
   **Then** the bridge surfaces a friendly inline error
   (e.g. `"Passcode required: this accessibility class requires a
   device passcode to be set."`) and the item is **not** written.

---

### User Story 4 — Demonstrate keychain access groups (Priority: P2)

A user reads a short text card explaining what keychain access groups
are (a way to share keychain items across apps/extensions that share
the same App ID prefix and declare the same `keychain-access-groups`
entitlement) and taps **Try shared keychain**. The button attempts a
write and a read against an item stored under the shared access group.

**Why P2**: Access groups are the second deepest piece of the Keychain
Services API that `expo-secure-store` does not expose; they are the
canonical reason teams reach for a custom bridge.

**Independent Test**: Tap the button on an entitled signed build — the
card shows `"✅ Shared keychain OK (read X bytes from group <prefix>)"`.
Tap the same button on an unentitled (e.g. Expo Go, simulator without
the entitlement) build — the card shows
`"⚠️ Needs entitlement: this app's signed entitlements do not include
the keychain-access-groups entry; rebuild with the with-keychain-services
config plugin and a custom dev client."` and never throws.

**Acceptance Scenarios**:

1. **Given** the screen is mounted, **When** the Access Group card
   renders, **Then** it shows: a 1–2 sentence explainer, the resolved
   access-group string the bridge will attempt
   (`<AppIdentifierPrefix><bundleId>`), and the Try shared keychain
   button.
2. **Given** the entitlement is present, **When** the user taps the
   button, **Then** the bridge writes a small probe value
   (`"spot.keychain.shared.probe"`) into the access group and
   immediately reads it back; the card surfaces a success message
   including the byte count.
3. **Given** the entitlement is **absent** (e.g. `errSecMissingEntitlement`,
   error code `-34018`), **When** the user taps the button, **Then** the
   bridge resolves with a typed `KeychainAccessGroupUnavailable` result
   and the card surfaces the "needs entitlement" message; no exception
   bubbles to React, no `console.error` is produced.
4. **Given** the user is on Web or Android, **When** the screen mounts,
   **Then** the Access Group card is hidden (or rendered disabled with
   the iOS-only-banner copy explaining the feature is iOS-only).

---

### User Story 5 — Cross-platform graceful degradation (Priority: P3)

On Web, the screen renders a single **IOSOnlyBanner** and disables all
interactive surfaces; the JS bridge is never imported in a way that
forces a native call. On Android, the basic Items List + Add item form
work via `expo-secure-store` (Android Keystore), the biometry-required
toggle still applies via `requireAuthentication`, but the
accessibility-class picker is collapsed to "Android Keystore default"
(disabled) and the Access Group card is hidden.

**Acceptance Scenarios**:

1. **Given** the user is on Web, **When** they open the screen,
   **Then** an `IOSOnlyBanner` renders, every form field is disabled,
   no row in the Items List is interactive, and the bridge is never
   invoked.
2. **Given** the user is on Android, **When** they Add and Show an item
   with biometry on, **Then** `expo-secure-store.setItemAsync` /
   `getItemAsync` are invoked with `requireAuthentication: true` and the
   `keychainAccessible` value mapped from the picker's default; the
   accessibility-class picker is rendered disabled with the Android
   note.
3. **Given** the user is on iOS in Expo Go (no custom dev client),
   **When** they use Add item with biometry off, **Then** the basic
   path works via `expo-secure-store`; the Access Group "Try shared
   keychain" button surfaces the "needs entitlement" message; biometry
   binding via `expo-secure-store`'s `requireAuthentication` continues
   to work as a soft fallback when the custom bridge is unavailable.

---

### Edge Cases

- **Custom bridge missing at runtime** (e.g. running in Expo Go): the
  `keychain.ts` JS bridge detects the missing native module and falls
  back to `expo-secure-store` for the four operations it can express
  (basic CRUD + biometry via `requireAuthentication` + `keychainAccessible`).
  The accessibility-class picker is constrained to the two values
  `expo-secure-store` accepts (`whenUnlocked` /
  `afterFirstUnlock`-equivalent via its `keychainAccessible` enum),
  with the rest disabled and a small note.
- **Duplicate add** (`errSecDuplicateItem`, -25299): treated as
  update-in-place; never surfaced as an error.
- **Item not found** (`errSecItemNotFound`, -25300) on Show / Delete:
  treated as "already gone"; the row is removed from local state with
  no user-visible error.
- **User cancels** the biometric prompt during Show
  (`errSecUserCanceled`, -128): row collapses back to hidden state with
  an inline informational message; never produces `console.error`.
- **Authentication failed** (`errSecAuthFailed`, -25293): inline
  informational error on the row; the value remains hidden.
- **Entitlement missing** (`errSecMissingEntitlement`, -34018) for the
  access-group probe: surfaced as the "needs entitlement" copy; never
  thrown.
- **Passcode not set** + `whenPasscodeSetThisDeviceOnly` selected:
  `SecAccessControlCreateWithFlags` returns `nil` / `SecItemAdd`
  returns `errSecParam`; surfaced as a friendly inline error before
  Save.
- **Bridge throws unexpectedly**: caught at the hook boundary; inline
  error on the surface that triggered it; UI remains consistent.
- **Web**: the JS bridge is loaded but every method short-circuits to a
  rejected promise of type `KeychainNotSupported`; the screen never
  invokes those methods because the IOSOnlyBanner disables every
  affordance.

## Functional Requirements

### Module + manifest

- **FR-001** Module manifest `id === 'keychain-lab'`, kebab-case,
  present in `MODULES` exactly once.
- **FR-002** Registry entry is a single import line + a single array
  entry (additive, matches features 007–022 pattern).
- **FR-003** `platforms: ['ios','android','web']`, `minIOS: '8.0'`.
- **FR-004** Module title `"Keychain Lab"`, description, icon
  (`{ ios: 'lock.shield', fallback: '' }`).
- **FR-005** Screen variants: `screen.tsx` (iOS), `screen.android.tsx`,
  `screen.web.tsx`.

### Hook + stores

- **FR-006** `useKeychainItems` hook owns: `items` (array of
  `KeychainItem` metadata, never includes the value), `loading`,
  `error`, `refresh()`, `addItem(input)`, `revealItem(id)` →
  `Promise<string | null>`, `deleteItem(id)`. `revealItem` triggers
  biometric authentication when the item is biometry-bound and never
  caches the cleartext.
- **FR-007** `keychain-store.ts` is the single read/write seam over the
  JS bridge `src/native/keychain.ts`. It serialises an internal
  metadata index (label, accessibility class, biometry flag, created-at)
  under a fixed keychain key (`spot.keychain.lab.index`,
  accessibility-class `whenUnlocked`, no biometry) so the Items List can
  enumerate items without iterating the entire keychain.
- **FR-008** All store methods are **tolerant**: any underlying bridge
  failure resolves to a non-throwing fallback (`null` for read, no-op
  for write/delete, empty list for enumerate) plus a single
  `console.warn`. Cancellations are not warned.
- **FR-009** `accessibility-classes.ts` exports the canonical list of
  the five accessibility classes plus their plain-language descriptions
  and a mapping to the underlying `kSecAttrAccessible*` constant string
  consumed by the Swift bridge.

### Native bridge

- **FR-010** `src/native/keychain.ts` exposes a typed JS API:
  `addItem({ label, value, accessibilityClass, biometryRequired,
  accessGroup? })`, `getItem({ label, accessGroup? })`,
  `updateItem({ label, value, accessGroup? })`,
  `deleteItem({ label, accessGroup? })`, `listLabels({ accessGroup? })`,
  `tryAccessGroupProbe({ accessGroup })`. Every method returns a typed
  result discriminated by a `kind` field
  (`'ok' | 'cancelled' | 'auth-failed' | 'missing-entitlement' |
  'not-found' | 'unsupported' | 'error'`) — no throws across the
  bridge boundary in normal operation.
- **FR-011** `native/ios/keychain/KeychainBridge.swift` wraps
  `SecItemAdd / SecItemCopyMatching / SecItemUpdate / SecItemDelete`
  with explicit `kSecAttrAccessControl` (built via
  `SecAccessControlCreateWithFlags` — `.biometryCurrentSet` when
  `biometryRequired === true`) and explicit
  `kSecAttrAccessGroup` when supplied; otherwise omits it.
- **FR-012** Non-iOS platforms (Android, Web) ship JS-only stub
  implementations that resolve to `{ kind: 'unsupported' }` for the
  extended methods; the basic CRUD path on Android delegates to
  `expo-secure-store` so the basic Items List + Add item flow still
  works.
- **FR-013** `KeychainNotSupported` is a typed result, **not** an
  exception class to be thrown across the bridge; the hook surfaces it
  as a disabled UI rather than an error toast.

### UI components

- **FR-014** `ItemsList` renders each item via `ItemRow`; renders an
  empty-state placeholder with a one-sentence explanation and the Add
  item CTA.
- **FR-015** `ItemRow` renders label, accessibility-class label, the
  biometry badge, and Show / Delete buttons; on Show, inline-reveals
  the value and replaces the Show button with Hide; tolerates and
  reflects `cancelled` / `auth-failed` results inline (no global toast).
- **FR-016** `AddItemForm` has: label text input (required, trimmed),
  value text input (required, secureTextEntry), `AccessibilityPicker`,
  Biometry-required `Switch`, Save button. Save is disabled while any
  required field is empty or the in-flight save has not resolved.
- **FR-017** `AccessibilityPicker` renders all five accessibility
  classes with the plain-language descriptions from
  `accessibility-classes.ts`; default selection is
  `whenUnlockedThisDeviceOnly`. On Android the picker is rendered
  disabled with a one-line note.
- **FR-018** `AccessGroupCard` renders the explainer text, the resolved
  access-group string, and the Try shared keychain button. On
  cancellation / missing-entitlement / unsupported it surfaces the
  matching message inline; success surfaces the byte count read back.
  Hidden on Android and Web.
- **FR-019** `IOSOnlyBanner` is a fresh component for this module
  (per-module copy; mirrors the 021/022 pattern).

### Config plugin

- **FR-020** `plugins/with-keychain-services/` is an Expo config plugin
  that idempotently adds the `keychain-access-groups` entitlement under
  `ios.entitlements['keychain-access-groups']` with a single entry
  `$(AppIdentifierPrefix)<ios.bundleIdentifier>`. If the entitlement
  array already contains the entry, the plugin must **not** duplicate
  it; if `ios.bundleIdentifier` is missing, the plugin logs a single
  `console.warn` and is a no-op.
- **FR-021** Plugin only edits the `keychain-access-groups` entitlement;
  never touches other entitlements, Info.plist, capabilities, or any
  other Expo config field.
- **FR-022** Plugin coexists with all 10 prior plugins (the `app.json`
  `plugins` array grows by exactly one entry).

### Tests

- **FR-023** Test coverage: manifest, `keychain-store.ts`,
  `useKeychainItems` hook, all six components (`ItemsList`, `ItemRow`,
  `AddItemForm`, `AccessibilityPicker`, `AccessGroupCard`,
  `IOSOnlyBanner`), all three screen variants, plugin (idempotency,
  bundle-id-missing no-op, coexistence with all prior plugins),
  `accessibility-classes.ts` mapping. JS-pure tests; the Swift bridge
  is covered indirectly via a global mock under `test/__mocks__/`
  following the 021/022 convention.
- **FR-024** No new `pnpm` package dependency. (The Swift bridge ships
  in-tree under `native/ios/`; the existing native-module autolinking
  picks it up via the `with-keychain-services` plugin if a
  `podspec`-based delivery is required, otherwise via the bundled
  Expo module template.)

## Non-Functional Requirements

- **NFR-001** Constitution v1.1.0 compliant: `ThemedText` /
  `ThemedView`, `Spacing` scale, `StyleSheet.create`, no inline color
  literals where a themed token exists.
- **NFR-002** No `eslint-disable` directives for unregistered rules.
- **NFR-003** `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
  all green.
- **NFR-004** Cleartext keychain values are never persisted in
  React state outside the lifetime of an inline reveal; the metadata
  index never contains the value.
- **NFR-005** No method on the JS bridge throws across the boundary in
  normal operation (cancellation, missing entitlement, not-found,
  auth-failed are all typed results).
- **NFR-006** Cancellation never produces `console.error` or
  `console.warn`.
- **NFR-007** Follows existing global mock pattern in `test/setup.ts`;
  new mock for the keychain native module lives under `test/__mocks__/`
  and follows the 021/022 convention.

## Success Criteria

- **SC-001** Adding the module is single-line additive in `registry.ts`
  and `app.json` `plugins` (one import, one array entry, one plugin
  entry).
- **SC-002** `pnpm check` is green with the new tests included.
- **SC-003** Test suite count and total test count grow strictly
  (delta from 022's totals).
- **SC-004** `app.json` plugin entries: 11 → 12 (one new), no edits to
  existing entries.
- **SC-005** Cancellation, missing-entitlement, not-found, and
  auth-failed paths produce zero `console.error` and zero
  `console.warn` (cancellation is informational).
- **SC-006** A new module of similar shape can be added in ≤ 10 minutes
  (registry + app.json contract preserved).
- **SC-007** Switching the accessibility-class picker for a single new
  item changes exactly one keychain attribute on the underlying call —
  verified by the Swift-bridge mock recording the
  `kSecAttrAccessible*` constant per call.

## Assumptions

- The custom Swift bridge `native/ios/keychain/KeychainBridge.swift` is
  delivered as an in-tree Expo native module and is autolinked when the
  app is built via a custom dev client; running in Expo Go falls back
  to the `expo-secure-store` path with the documented capability
  reduction (no extended ACL flags, no access groups, two
  accessibility classes only).
- `expo-secure-store` is already installed in the project (transitive
  dependency added in feature 021); this feature does **not** add a
  new public package dependency.
- The shared access-group probe uses
  `$(AppIdentifierPrefix)<ios.bundleIdentifier>` (the team-scoped form
  of the bundle id), which always resolves to a valid access-group
  string for the app itself; cross-app sharing requires a second app
  with the same prefix to be installed and is out of scope for this
  feature's runtime tests but is what the explainer copy describes.
- The default accessibility class is
  `whenUnlockedThisDeviceOnly`, which is the most defensive default for
  user secrets (no iCloud Keychain backup, only readable while the
  device is unlocked).
- The biometry-required toggle binds items with
  `.biometryCurrentSet` (invalidated when the user adds/removes a
  biometric enrollment), not `.biometryAny`; this is the safer default
  and matches the user-facing copy "the value can only be read after a
  successful biometric auth".
- The Items-List enumeration is implemented via a self-managed metadata
  index (a single keychain item with the list of labels + per-item
  metadata) rather than an unbounded
  `SecItemCopyMatching(kSecMatchLimitAll)` scan, to keep the surface
  deterministic and to scope the demo to items this module created.
- Android renders the basic CRUD + biometry path via
  `expo-secure-store` only; the accessibility-class picker is a
  read-only "Keystore default" affordance and the Access Group card is
  hidden — Android equivalents (KeyStore aliases, sharedUserId) are
  out of scope for this feature.
- Web is unsupported; the screen renders the per-module IOSOnlyBanner
  and never invokes the bridge.
- Constitution v1.1.0 is in force and unchanged by this feature.
