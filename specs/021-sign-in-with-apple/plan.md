# Implementation Plan: Sign in with Apple Module

**Branch**: `021-sign-in-with-apple` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `sign-in-with-apple` (id `sign-in-with-apple`, label "Sign in with Apple",
`platforms: ['ios','android','web']`, `minIOS: '13.0'`) as a single-line
addition to `src/modules/registry.ts` and `app.json` `plugins`. The module
exposes the AuthenticationServices SIWA flow through
`expo-apple-authentication`, persists the last-known user record in **Keychain
(NOT AsyncStorage)** via `expo-secure-store`, and supports the
`getCredentialStateAsync` revocation-check pattern Apple requires (Guideline 4.8).

Dependencies introduced:

- `expo-apple-authentication` — installed via `npx expo install expo-apple-authentication`.
- `expo-secure-store` — installed via `npx expo install expo-secure-store`.

A new Expo config plugin under `plugins/with-sign-in-with-apple/` adds the
`com.apple.developer.applesignin = ["Default"]` entitlement idempotently and
coexists with every prior plugin (007 / 014 / 015 / 016 / 017 / 018 / 020).

## Technical Context

- **Language**: TypeScript 5.9 strict.
- **Runtime**: React 19.2 (React Compiler enabled), React Native 0.83, Expo SDK 55,
  expo-router (typed routes).
- **Native bridge**: `expo-apple-authentication` (managed, no custom Swift); the
  module surfaces `AppleAuthenticationButton`, `signInAsync`,
  `getCredentialStateAsync`, `AppleAuthenticationScope`, `AppleAuthenticationCredentialState`,
  and `AppleAuthenticationButton{Type,Style}`.
- **Persistence**: `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences
  on Android, in-memory on Web). Single key: `spot.siwa.user`.
- **Storage shape**:
  ```ts
  type StoredUser = {
    id: string;             // opaque Apple user identifier
    email?: string;         // only when scope returned it (first login only)
    givenName?: string;
    familyName?: string;
    credentialState?: 'authorized' | 'revoked' | 'notFound' | 'transferred';
  };
  ```
- **State machine**: `signed-out → loading → signed-in | error → signed-out`
  (Sign Out from any non-loading state).
- **Test stack**: jest-expo + RNTL, JS-pure. Two new mocks under
  `test/__mocks__/`:
  - `expo-apple-authentication.ts` — `signInAsync` resolvable / cancelable /
    rejectable; `getCredentialStateAsync` configurable; constants for
    `AppleAuthenticationScope`, `AppleAuthenticationCredentialState`,
    `AppleAuthenticationButtonType`, `AppleAuthenticationButtonStyle`.
  - `expo-secure-store.ts` — in-memory `getItemAsync` / `setItemAsync` /
    `deleteItemAsync` with optional throw-injection for failure-tolerance tests.
- **No new eslint-disable** directives. All mocks follow the AsyncStorage
  global-mock pattern in `test/setup.ts`.

## Architecture

```
src/modules/sign-in-with-apple/
  index.tsx                      ModuleManifest
  screen.tsx                     iOS screen (composes everything; uses useSiwaSession)
  screen.android.tsx             Android screen (banner + disabled UI; never instantiates the hook)
  screen.web.tsx                 Web screen     (banner + disabled UI; never instantiates the hook)
  siwa-store.ts                  Keychain CRUD via expo-secure-store; tolerant
  hooks/
    useSiwaSession.ts            signIn / signOut / refresh / state / user / error
  components/
    SiwaButton.tsx               Apple-styled SIWA button + variant/style/corner pickers
    UserCard.tsx                 4-state card
    ScopesPicker.tsx             Email + FullName checkboxes
    CredentialStateCard.tsx      4-state result + Refresh
    IOSOnlyBanner.tsx            Fresh per-module banner

plugins/with-sign-in-with-apple/
  index.ts                       Adds com.apple.developer.applesignin = ["Default"]
  package.json                   { name, version, main, types }

test/unit/modules/sign-in-with-apple/
  manifest.test.ts
  siwa-store.test.ts
  hooks/useSiwaSession.test.tsx
  components/SiwaButton.test.tsx
  components/UserCard.test.tsx
  components/ScopesPicker.test.tsx
  components/CredentialStateCard.test.tsx
  components/IOSOnlyBanner.test.tsx
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx

test/unit/plugins/with-sign-in-with-apple/
  with-sign-in-with-apple.test.ts

test/__mocks__/
  expo-apple-authentication.ts
  expo-secure-store.ts
```

## Hook Contract — `useSiwaSession`

```ts
type SiwaState = 'signed-out' | 'signed-in' | 'loading' | 'error';

interface UseSiwaSession {
  state: SiwaState;
  user: StoredUser | null;
  error: string | null;
  credentialState: CredentialState | null;  // last result of getCredentialStateAsync
  signIn(scopes: { email: boolean; fullName: boolean }): Promise<void>;
  signOut(): Promise<void>;
  refreshCredentialState(): Promise<void>;
}
```

Lifecycle:

1. **Mount** — read Keychain. If a user exists → `state='signed-in'`,
   then auto-call `refreshCredentialState()` once.
2. **signIn** — `state='loading'`; call `signInAsync({ requestedScopes })`;
   on success → persist + `state='signed-in'`; on cancel → revert to prior
   `state` (no error); on other error → `state='error'`.
3. **signOut** — clear Keychain (tolerant), `state='signed-out'`,
   `credentialState=null`, `error=null`.
4. **refreshCredentialState** — no-op if no user; otherwise call
   `getCredentialStateAsync(user.id)`; persist the result back into the
   Keychain record so it survives reload.
5. **Unmount** — guard against post-unmount `setState` via `mountedRef`
   (audio-lab pattern); never emits `act()` warnings.

## Test Strategy

- `useSiwaSession.test.tsx` — sign-in success persists & flips state; cancel
  is silent; error sets `state='error'`; refresh updates `credentialState`;
  sign-out clears Keychain and resets state.
- `siwa-store.test.ts` — round-trip; missing returns `null`; SecureStore
  throwing returns `null` / no-op + warn (no rethrow).
- Component tests — render every visible state; assert the right Apple
  enum constant is forwarded for variant/style/corner.
- `screen.test.tsx` — mocks the hook; verifies all six sections render and
  the User Card flips on sign-in.
- `screen.android.test.tsx` / `screen.web.test.tsx` — banner present, SIWA
  button disabled, hook never instantiated.
- `manifest.test.ts` — id, kebab-case, platforms, minIOS, single-occurrence
  in registry.
- `with-sign-in-with-apple.test.ts` — adds the entitlement when absent;
  preserves it when already present; coexists when run alongside every
  other plugin in turn (order-invariant).

## Constitution Compliance (v1.1.0)

- **I. Cross-Platform Parity** — three screen variants; SIWA disabled on
  non-iOS but UI structure preserved.
- **II. Themed UI** — ThemedText/ThemedView throughout; `Spacing` scale only.
- **III. Platform File Splitting** — `screen.tsx` / `screen.android.tsx` /
  `screen.web.tsx`.
- **IV. Additive Integration** — single new line in registry; single new
  plugin entry in app.json.
- **V. Test-First** — every new module exports has a JS-pure test.
- **Validate-Before-Spec (1.1.0)** — N/A (no build/infra change; pure JS
  module + a 1-key entitlement plugin).

## Risks & Decisions

- **D-01** Keychain (`expo-secure-store`) over AsyncStorage — credentials are
  security-relevant (user message: "store the last-known user ... in
  **Keychain (NOT AsyncStorage)**").
- **D-02** Email/name fields stored only when first returned by Apple; on
  subsequent sign-ins Apple omits them — store remains authoritative.
- **D-03** `credentialState='revoked'` does NOT auto-clear the local record
  (so the demo can show the badge). Sign Out is the only clearing action.
- **D-04** Cancellation is silent (Apple guideline pattern).
- **D-05** Plugin only writes the `com.apple.developer.applesignin`
  entitlement; deliberately leaves Capabilities and Info.plist alone.
- **R-01** `expo-apple-authentication`'s `AppleAuthenticationButton` requires
  iOS at runtime — wrapped in a `Platform.OS === 'ios'` guard inside
  `SiwaButton` so the JS import remains tree-shakable across all three
  screens (the component file itself is loaded by tests but the native
  child is only mounted on iOS).
