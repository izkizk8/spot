# Feature Specification: Sign in with Apple Module

**Feature Branch**: `021-sign-in-with-apple`
**Feature Number**: 021
**Created**: 2026-04-28
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS module showcasing AuthenticationServices `ASAuthorizationAppleIDProvider`
flow via `expo-apple-authentication`.

## Overview

The Sign in with Apple module ("SIWA") is a feature card in the iOS Showcase
registry (`id: 'sign-in-with-apple'`, label `"Sign in with Apple"`,
`platforms: ['ios','android','web']`, `minIOS: '13.0'`). It demonstrates the
**AuthenticationServices** SIWA flow on iOS through `expo-apple-authentication`
(installed via `npx expo install expo-apple-authentication`), persists the
last-known credential record in **Keychain** via `expo-secure-store` (installed
via `npx expo install expo-secure-store`), and exposes `getCredentialStateAsync`
for revocation checking.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array entry.
2. `app.json` `plugins` array — one new entry (`./plugins/with-sign-in-with-apple`).
3. `package.json` / `pnpm-lock.yaml` — two new dependencies (`expo-apple-authentication`,
   `expo-secure-store`) added via `npx expo install`.
4. `plugins/with-sign-in-with-apple/` — new Expo config plugin that idempotently
   adds the `com.apple.developer.applesignin` iOS entitlement (`["Default"]`).

The screen has six sections: a **User card** (current state: signed-out /
signed-in / loading / error, including user identifier, email-if-shared,
given/family-name-if-shared); a **Scopes picker** (checkboxes for `email` and
`fullName`); a **SIWA button** (the Apple-styled
`<AppleAuthentication.AppleAuthenticationButton>` with Variant +
Style + 3-segment Corner pickers); a **Sign Out** button (clears local state
only — Apple does not expose server sign-out); a **Credential State Card**
(button to query `getCredentialStateAsync(userId)` and render the result), and
an **IOSOnlyBanner** for non-iOS platforms.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sign in with Apple and persist the user record (Priority: P1)

A user opens the SIWA card on iOS, picks the desired scopes (`email`,
`fullName`), taps the Apple-styled "Sign in with Apple" button, completes the
system sheet, and sees the User Card update to the signed-in state with their
opaque user identifier and any shared identity fields. The record is persisted
to Keychain (`expo-secure-store`) so it survives app reload.

**Why P1**: Without sign-in there is no module value. Everything else
(credential checks, sign-out, persistence) is downstream of a successful flow.

**Independent Test**: On iOS, tap the SIWA button, complete the sheet, observe
the User Card transitions to `signed-in` with the returned `user` id. Reload
the screen — the User Card re-hydrates from Keychain.

**Acceptance Scenarios**:

1. **Given** the user is signed-out and on the SIWA screen, **When** they tap
   the Apple SIWA button with both `email` and `fullName` selected, **Then**
   `signInAsync({ requestedScopes: [EMAIL, FULL_NAME] })` is invoked, the
   returned credential is rendered in the User Card, and the credential is
   persisted to Keychain at `spot.siwa.user`.
2. **Given** the user is signed-in and reloads the screen, **When** the screen
   mounts, **Then** the previous credential is read back from Keychain and the
   User Card immediately shows the persisted state without invoking `signInAsync`.
3. **Given** the user cancels the system sheet, **When** Apple reports
   `ERR_REQUEST_CANCELED`, **Then** the cancellation is treated as a non-error
   no-op (User Card remains in the prior state), no `console.error` is emitted,
   and the SIWA button returns to interactive.
4. **Given** the user denies the SIWA request or any other unexpected error
   occurs, **When** `signInAsync` rejects, **Then** the User Card transitions
   to the `error` state with the message text, the SIWA button returns to
   interactive, and Keychain is unchanged.

---

### User Story 2 — Check credential state and react to revocation (Priority: P2)

A signed-in user taps the **Check credential state** button on the Credential
State Card. The hook calls `getCredentialStateAsync(userId)` and renders the
returned state (`authorized` / `revoked` / `notFound` / `transferred`). On
mount, the screen also auto-checks the state for the persisted user.

**Why P2**: This demonstrates the real-world revocation handling pattern Apple
requires (App Store Review Guideline 4.8) and only matters once a user is
already signed in.

**Independent Test**: With a persisted user, mount the screen and observe the
Credential State Card auto-populates with the result of
`getCredentialStateAsync(persistedUser.id)`. Tap **Refresh** and observe the
state re-fetches.

**Acceptance Scenarios**:

1. **Given** a persisted user, **When** the screen mounts, **Then**
   `getCredentialStateAsync(user.id)` is called exactly once and the
   Credential State Card renders the returned state with a human-readable label.
2. **Given** a signed-in user, **When** they tap **Refresh**, **Then** the
   credential state is re-queried and the card updates.
3. **Given** the persisted user has been revoked on the device, **When**
   `getCredentialStateAsync` returns `revoked`, **Then** the Credential State
   Card renders the revoked label with a destructive accent and the User Card
   surfaces a "credential revoked" hint (the local user record is **not**
   automatically cleared — clearing is the user's explicit Sign-Out action).
4. **Given** no persisted user exists, **When** the screen mounts, **Then** the
   Credential State Card renders an inert disabled state ("Sign in to check
   credential state") and `getCredentialStateAsync` is **not** invoked.

---

### User Story 3 — Sign out clears local state (Priority: P3)

A signed-in user taps **Sign Out**. The local credential record is cleared from
Keychain, the User Card returns to the signed-out state, the Credential State
Card returns to its disabled/inert state, and a non-blocking informational
copy explains that Apple does not expose a server-side sign-out (the user must
revoke the app from Settings → Apple ID → Sign in with Apple).

**Why P3**: Necessary to round-trip the demo. Trivial once persistence (US1) lands.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they tap **Sign Out**, **Then** the
   Keychain entry at `spot.siwa.user` is deleted, the in-memory state returns
   to `signed-out`, and the User Card and Credential State Card reflect that.
2. **Given** the Keychain delete fails (corrupt store / hardware error),
   **When** the user taps Sign Out, **Then** the in-memory state still returns
   to `signed-out`, a `console.warn` is emitted, and no exception escapes.

---

### User Story 4 — Configure SIWA button appearance (Priority: P3)

A user adjusts the Variant (Default / Continue / Sign Up), Style (Black /
White / White Outline), and Corner segment (Square / Round / Pill) controls.
The SIWA button re-renders immediately to reflect the chosen appearance.

**Acceptance Scenarios**:

1. **Given** the SIWA controls, **When** the user picks `Continue` + `White
   Outline` + `Pill`, **Then** the SIWA button renders with `buttonType=CONTINUE`,
   `buttonStyle=WHITE_OUTLINE`, and `cornerRadius` ≈ height/2.
2. **Given** any combination of controls, **When** the user signs in, **Then**
   the configured `requestedScopes` are passed to `signInAsync` regardless of
   the appearance pickers.

---

### User Story 5 — Cross-platform graceful degradation (Priority: P3)

On Android and Web, the screen renders the same six sections but the SIWA
button is disabled and an **IOSOnlyBanner** explains the limitation. Educational
intent: users see the UI shape on every platform.

**Acceptance Scenarios**:

1. **Given** the user is on Android or Web, **When** they open the screen,
   **Then** an iOS-only banner is rendered, the SIWA button is disabled, and
   no `expo-apple-authentication` API is called.
2. **Given** Android/Web, **When** the user taps Sign Out, **Then** Sign Out
   still clears any persisted Keychain entry and emits no error.

---

### Edge Cases

- **Cancellation** (`ERR_REQUEST_CANCELED`) is silent — never surfaces as an
  error to the User Card.
- **Keychain read failure** on mount returns `null` and renders the signed-out
  state (US1 acceptance #2 still works once the user signs in fresh).
- **Keychain write failure** on sign-in: the in-memory state still updates so
  the user sees the result of the flow, a `console.warn` is emitted, and the
  next mount falls back to signed-out (the failure is tolerated, not blocking).
- **Stale persisted user** whose `credentialState === 'revoked'`: kept until
  the user explicitly signs out (so the demo can show the revoked badge).
- **Module unavailable** (iOS < 13 or simulator without iCloud): the User Card
  surfaces a single non-fatal "Sign in with Apple is not available on this
  device" message and disables the button.

## Functional Requirements

- **FR-001** Module manifest `id === 'sign-in-with-apple'`, kebab-case, present
  in `MODULES` exactly once.
- **FR-002** Registry entry is a single import line + a single array entry
  (additive, matches features 007–020 pattern).
- **FR-003** `platforms: ['ios','android','web']`, `minIOS: '13.0'`.
- **FR-004** Module description, title, icon (`{ ios: 'apple.logo', fallback: '' }`).
- **FR-005** Screen variants: `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`.
- **FR-006** `useSiwaSession` hook owns: `signIn(scopes)`, `signOut()`,
  `refreshCredentialState()`, `user`, `state` (`signed-out` | `signed-in` |
  `loading` | `error`), `error`, `credentialState`.
- **FR-007** `siwa-store.ts` exposes `getStoredUser()`, `setStoredUser(u)`,
  `clearStoredUser()` over `expo-secure-store` with key `spot.siwa.user`.
- **FR-008** `siwa-store` is **tolerant**: any SecureStore failure resolves to
  a non-throwing fallback (`null` for read, no-op for write/delete) plus a
  single `console.warn`.
- **FR-009** `SiwaButton` wraps `<AppleAuthentication.AppleAuthenticationButton>`
  with Variant (DEFAULT / CONTINUE / SIGN_UP), Style (BLACK / WHITE /
  WHITE_OUTLINE), and Corner (Square=0 / Round=8 / Pill=height/2) pickers.
- **FR-010** `UserCard` renders four states: `signed-out`, `signed-in`,
  `loading`, `error`; surfaces `user.email`, `user.fullName.givenName`,
  `user.fullName.familyName` only when present.
- **FR-011** `ScopesPicker` is a checkbox group for `email` and `fullName`;
  defaults to both selected.
- **FR-012** `CredentialStateCard` renders the four states (`authorized` /
  `revoked` / `notFound` / `transferred`) with a Refresh button.
- **FR-013** `IOSOnlyBanner` is a fresh component for this module
  (the existing 018 banner is per-module copy and doesn't mention SIWA).
- **FR-014** Auto-refresh of credential state on mount when a persisted user
  exists; never invoked otherwise.
- **FR-015** Sign Out always succeeds from the user's perspective (graceful
  fall-back when SecureStore delete fails).
- **FR-016** Cancellation (`ERR_REQUEST_CANCELED`) is non-error.
- **FR-017** Config plugin adds `com.apple.developer.applesignin` =
  `["Default"]` idempotently and coexists with all prior plugins.
- **FR-018** Plugin only edits the `applesignin` entitlement; never touches
  Info.plist, capabilities outside SIWA, or App Groups.
- **FR-019** Android/Web variant disables the SIWA button, never invokes the
  bridge, and renders the IOSOnlyBanner.
- **FR-020** Test coverage: manifest, store, hook, all five components, all
  three screen variants, plugin (idempotency + coexistence with each prior
  plugin) — JS-pure, runs under existing `pnpm test`.

## Non-Functional Requirements

- **NFR-001** Constitution v1.1.0 compliant: ThemedText/ThemedView,
  `Spacing` scale, `StyleSheet.create`, no inline color literals.
- **NFR-002** No `eslint-disable` directives for unregistered rules
  (`@typescript-eslint/no-require-imports` is NOT in the project config).
- **NFR-003** `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all
  green.
- **NFR-004** Follows existing global mock pattern in `test/setup.ts`; new
  mocks for `expo-apple-authentication` and `expo-secure-store` live under
  `test/__mocks__/` and follow the `expo-audio` mock conventions.

## Success Criteria

- **SC-001** Adding the module is single-line additive in `registry.ts` and
  `app.json` `plugins`.
- **SC-002** `pnpm check` is green with the new tests included.
- **SC-003** Test suite count and total test count grow strictly (delta
  from 020's 191/1395).
- **SC-004** `app.json` plugin entries: 9 → 10 (one new), no edits to existing
  entries.
- **SC-005** Cancellation does not produce any console error or warning.
