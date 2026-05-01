# Feature Specification: Local Authentication Module

**Feature Branch**: `022-local-authentication`
**Feature Number**: 022
**Created**: 2026-04-28
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS module showcasing biometric authentication via
`expo-local-authentication` (Face ID / Touch ID on iOS, Fingerprint/Face on
Android, with Web showing a graceful disabled state).

## Overview

The Local Authentication module ("Local Auth") is a feature card in the iOS
Showcase registry (`id: 'local-auth-lab'`, label `"Local Auth"`,
`platforms: ['ios','android','web']`, `minIOS: '8.0'`). It demonstrates the
**LocalAuthentication** framework on iOS and the equivalent
BiometricPrompt-based flow on Android via `expo-local-authentication`
(installed via `npx expo install expo-local-authentication`). It reuses the
**Keychain** (`expo-secure-store`, already added in 021) to demonstrate a
realistic biometric-gated "Secure Note" use case.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array entry.
2. `app.json` `plugins` array — one new entry (`./plugins/with-local-auth`).
3. `package.json` / `pnpm-lock.yaml` — one new dependency
   (`expo-local-authentication`) added via `npx expo install`.
4. `plugins/with-local-auth/` — new Expo config plugin that idempotently
   adds the `NSFaceIDUsageDescription` Info.plist string.

The screen has six sections: a **Capabilities Card**
(`hasHardwareAsync`, `isEnrolledAsync`, `supportedAuthenticationTypesAsync`,
`getEnrolledLevelAsync`); an **Authentication button** that triggers
`authenticateAsync`; an **Options panel** (switches for `disableDeviceFallback`
and text inputs for `promptMessage`, `fallbackLabel`, `cancelLabel`);
a **Result Card** (last attempt: success / error type / warning, with timestamp);
a **Secure Note Card** (text input + biometric-gated save and view, persisted
to Keychain via `expo-secure-store`); and a **History Log** (last 10 attempts).
On Web the screen renders an `IOSOnlyBanner` and disables interactive surfaces.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inspect device biometric capabilities (Priority: P1)

A user opens the Local Auth card. The Capabilities Card immediately shows
whether biometric hardware is present, whether biometrics are enrolled,
which biometric types are supported (Face ID / Touch ID / Iris on Android /
Optic ID), and the device security level.

**Why P1**: Without capabilities, every other interaction is undefined
(no point pressing Authenticate on a device that lacks hardware).

**Independent Test**: Open the screen — within one tick the Capabilities
Card shows three populated rows (hardware, enrolled, types) plus the
security level.

**Acceptance Scenarios**:

1. **Given** the user opens the screen on a device with biometric hardware,
   **When** the Capabilities Card mounts, **Then** `hasHardwareAsync`,
   `isEnrolledAsync`, `supportedAuthenticationTypesAsync`, and
   `getEnrolledLevelAsync` are each called exactly once and the resulting
   values are rendered with human-readable labels.
2. **Given** a device without biometric hardware, **When** the Capabilities
   Card mounts, **Then** the card surfaces "Not available" for hardware
   and "Not enrolled" for enrollment, and the Authenticate button is
   disabled.
3. **Given** the user taps a "Refresh capabilities" affordance, **When**
   the refresh fires, **Then** all four capability calls are re-issued and
   the rendered values update.

---

### User Story 2 — Authenticate with biometrics (Priority: P1)

A user with biometric hardware taps the **Authenticate** button. The system
biometric prompt appears with the configured `promptMessage`,
`fallbackLabel`, `cancelLabel`, and `disableDeviceFallback`. The Result
Card updates with the outcome (success / error type / warning) and a
timestamp; the History Log prepends the new attempt (and trims to 10).

**Why P1**: This is the core showcase: the user must be able to demonstrate
a biometric authentication round-trip.

**Independent Test**: Tap Authenticate; observe the Result Card transitions
from "No result yet" to either "✅ Success" or a labeled error, with a
timestamp; observe the History Log gains one row.

**Acceptance Scenarios**:

1. **Given** biometric hardware + enrollment, **When** the user taps
   Authenticate with `disableDeviceFallback=true`, **Then**
   `authenticateAsync({ promptMessage, fallbackLabel, cancelLabel,
   disableDeviceFallback: true })` is invoked exactly once, and the Result
   Card renders `success=true` with a timestamp.
2. **Given** the user cancels, **When** `authenticateAsync` resolves with
   `{ success: false, error: 'user_cancel' }`, **Then** the Result Card
   renders the cancellation as a non-error informational state, and the
   History Log records `user_cancel`.
3. **Given** the underlying call rejects unexpectedly, **When** the promise
   throws, **Then** the Result Card renders the message and the History Log
   records `unknown`.
4. **Given** more than 10 attempts have been made, **When** the History
   Log re-renders, **Then** only the most recent 10 entries are present.

---

### User Story 3 — Configure prompt copy and fallback policy (Priority: P2)

A user adjusts the Options panel: toggles `disableDeviceFallback`, and
overrides `promptMessage`, `fallbackLabel`, and `cancelLabel`. The next
authenticate call forwards every option as configured.

**Acceptance Scenarios**:

1. **Given** the Options panel, **When** the user types a custom
   `promptMessage` and taps Authenticate, **Then** the bridge call receives
   exactly that string for `promptMessage`.
2. **Given** the `disableDeviceFallback` switch is on, **When** the user
   taps Authenticate, **Then** the option is forwarded as `true`.
3. **Given** the user clears any text input, **When** they tap
   Authenticate, **Then** the corresponding option is forwarded as `''`
   (empty string, not undefined) — letting the platform render its own
   default while still demonstrating the option surface.

---

### User Story 4 — Secure Note demo (Priority: P2)

A user types a note into the Secure Note Card and taps **Save securely**.
The note is persisted to Keychain (`expo-secure-store`, key
`spot.localauth.note`). The note is hidden by default. Tapping **View**
triggers a fresh biometric authentication; on success the note is revealed;
on failure the note remains hidden and the failure surfaces in the Result
Card and History Log.

**Why P2**: Demonstrates a real-world biometric-gated secret pattern, the
exact reason consumers reach for this API.

**Acceptance Scenarios**:

1. **Given** an empty note input, **When** the user types text and taps
   Save, **Then** the value is persisted at `spot.localauth.note` and the
   card surfaces "Note saved" with the date.
2. **Given** a stored note, **When** the user taps View, **Then** the hook
   calls `authenticateAsync`; on success the note is rendered inline; on
   failure the note remains hidden and the failure is surfaced.
3. **Given** the user taps **Clear**, **When** the secure-store delete
   completes, **Then** the note is removed from Keychain and the inline
   reveal collapses.
4. **Given** a SecureStore failure, **When** Save / View / Clear is
   attempted, **Then** the operation tolerates the error (no rethrow),
   surfaces a `console.warn`, and leaves the UI in a consistent state.

---

### User Story 5 — Cross-platform graceful degradation (Priority: P3)

On Web, the screen renders all six sections but the Authenticate and
Secure Note buttons are disabled and an **IOSOnlyBanner** explains the
limitation. Android renders the live module (the underlying API supports
it).

**Acceptance Scenarios**:

1. **Given** the user is on Web, **When** they open the screen, **Then**
   an iOS-only-style banner is rendered, the Authenticate button is
   disabled, and `authenticateAsync` is never called.
2. **Given** the user is on Android, **When** they tap Authenticate,
   **Then** the live `expo-local-authentication` API is invoked and the
   Result Card and History Log update normally.

---

### Edge Cases

- **No hardware**: Capabilities Card surfaces "Not available"; Authenticate
  button is disabled; `authenticateAsync` is never called.
- **Hardware but not enrolled**: Authenticate is still allowed (the OS
  surfaces enrollment guidance); the Result Card records `not_enrolled`.
- **Cancellation** (`user_cancel`) is surfaced as informational, not an
  error, and never produces `console.error`.
- **Bridge throws** (rare): caught, logged as `unknown` in the History Log,
  surfaced in the Result Card.
- **SecureStore failure** for the Secure Note: tolerated end-to-end with a
  single `console.warn`; UI remains consistent.

## Functional Requirements

- **FR-001** Module manifest `id === 'local-auth-lab'`, kebab-case, present
  in `MODULES` exactly once.
- **FR-002** Registry entry is a single import line + a single array entry
  (additive, matches features 007–021 pattern).
- **FR-003** `platforms: ['ios','android','web']`, `minIOS: '8.0'`.
- **FR-004** Module title `"Local Auth"`, description, icon
  (`{ ios: 'faceid', fallback: '' }`).
- **FR-005** Screen variants: `screen.tsx`, `screen.android.tsx`,
  `screen.web.tsx`.
- **FR-006** `useBiometricAuth` hook owns: `capabilities`, `lastResult`,
  `history` (last 10), `authenticate(options)`, `refreshCapabilities()`.
- **FR-007** `secure-note-store.ts` exposes `getStoredNote()`,
  `setStoredNote(value)`, `clearStoredNote()` over `expo-secure-store` with
  key `spot.localauth.note`.
- **FR-008** `secure-note-store` is **tolerant**: any SecureStore failure
  resolves to a non-throwing fallback (`null` for read, no-op for
  write/delete) plus a single `console.warn`.
- **FR-009** `CapabilitiesCard` renders four labeled rows (hardware,
  enrolled, types, security level) with a Refresh button.
- **FR-010** `AuthOptionsPanel` exposes `disableDeviceFallback` (switch),
  `promptMessage` (text input), `fallbackLabel` (text input), `cancelLabel`
  (text input).
- **FR-011** `ResultCard` renders the last attempt (success / error /
  warning) with an ISO timestamp, and a "No result yet" placeholder when
  no attempt exists.
- **FR-012** `SecureNoteCard` renders Save / View / Clear actions; the
  saved note is hidden behind a successful biometric authenticate before
  being revealed.
- **FR-013** `HistoryLog` renders the most recent 10 attempts with
  outcome label and ISO timestamp; renders an empty-state placeholder
  when no attempts exist.
- **FR-014** `IOSOnlyBanner` is a fresh component for this module
  (per-module copy mirroring the 021 pattern; scoped to LocalAuth wording).
- **FR-015** Capabilities are auto-loaded on mount.
- **FR-016** Cancellation (`user_cancel`) is treated as informational, not
  an error.
- **FR-017** Config plugin adds `NSFaceIDUsageDescription` to Info.plist
  idempotently and coexists with all prior plugins.
- **FR-018** Plugin only edits `NSFaceIDUsageDescription`; never touches
  other Info.plist keys, entitlements, or capabilities.
- **FR-019** Web variant disables interactive surfaces, never invokes the
  bridge, and renders the IOSOnlyBanner. Android variant renders the live
  module.
- **FR-020** Test coverage: manifest, store, hook, all six components, all
  three screen variants, plugin (idempotency + coexistence with prior
  plugins) — JS-pure, runs under existing `pnpm test`.

## Non-Functional Requirements

- **NFR-001** Constitution v1.1.0 compliant: ThemedText/ThemedView,
  `Spacing` scale, `StyleSheet.create`, no inline color literals where a
  themed token exists.
- **NFR-002** No `eslint-disable` directives for unregistered rules.
- **NFR-003** `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all
  green.
- **NFR-004** Follows existing global mock pattern in `test/setup.ts`; new
  mock for `expo-local-authentication` lives under `test/__mocks__/` and
  follows the 021 convention.

## Success Criteria

- **SC-001** Adding the module is single-line additive in `registry.ts` and
  `app.json` `plugins`.
- **SC-002** `pnpm check` is green with the new tests included.
- **SC-003** Test suite count and total test count grow strictly (delta
  from 021's 203/1456).
- **SC-004** `app.json` plugin entries: 10 → 11 (one new), no edits to
  existing entries.
- **SC-005** Cancellation does not produce any console error or warning.
