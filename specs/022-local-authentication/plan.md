# Implementation Plan: Local Authentication Module

**Branch**: `022-local-authentication` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `local-auth-lab` (id `local-auth-lab`, label "Local Auth",
`platforms: ['ios','android','web']`, `minIOS: '8.0'`) as a single-line
addition to `src/modules/registry.ts` and `app.json` `plugins`. The module
exposes the LocalAuthentication framework through `expo-local-authentication`
and reuses Keychain (`expo-secure-store`, already added in 021) for a
realistic biometric-gated Secure Note demo.

Dependencies introduced:

- `expo-local-authentication` — installed via `npx expo install expo-local-authentication`.
- `expo-secure-store` — already added in 021; reused.

A new Expo config plugin under `plugins/with-local-auth/` adds
`NSFaceIDUsageDescription` to Info.plist idempotently and coexists with
every prior plugin (007 / 014 / 015 / 016 / 017 / 018 / 020 / 021).

## Technical Context

- **Language**: TypeScript 5.9 strict.
- **Runtime**: React 19.2 (React Compiler enabled), React Native 0.83,
  Expo SDK 55, expo-router (typed routes).
- **Native bridge**: `expo-local-authentication` (managed, no custom Swift):
  `hasHardwareAsync`, `isEnrolledAsync`, `supportedAuthenticationTypesAsync`,
  `getEnrolledLevelAsync`, `authenticateAsync`, plus `AuthenticationType`
  and `SecurityLevel` enums.
- **Persistence**: `expo-secure-store` (Keychain on iOS,
  EncryptedSharedPreferences on Android, in-memory on Web). Single key:
  `spot.localauth.note`.
- **State shapes**:
  ```ts
  interface Capabilities {
    hasHardware: boolean;
    isEnrolled: boolean;
    types: AuthenticationType[];
    securityLevel: SecurityLevel;
  }

  interface AuthAttempt {
    timestamp: string;            // ISO
    success: boolean;
    error?: LocalAuthenticationError;
    warning?: string;
  }

  interface UseBiometricAuth {
    capabilities: Capabilities | null;
    lastResult: AuthAttempt | null;
    history: AuthAttempt[];       // capped at 10
    authenticate(options?: LocalAuthenticationOptions): Promise<AuthAttempt>;
    refreshCapabilities(): Promise<void>;
  }
  ```
- **Test stack**: jest-expo + RNTL, JS-pure. One new mock under
  `test/__mocks__/expo-local-authentication.ts` exposing configurable
  `hasHardwareAsync`, `isEnrolledAsync`, `supportedAuthenticationTypesAsync`,
  `getEnrolledLevelAsync`, and `authenticateAsync`, plus the enums.
  `expo-secure-store` mock from 021 is reused as-is.
- **No new eslint-disable** directives. All mocks follow the 021 mock
  conventions.

## Architecture

```
src/modules/local-auth-lab/
  index.tsx                      ModuleManifest
  screen.tsx                     iOS screen (composes everything; uses useBiometricAuth)
  screen.android.tsx             Android screen (live module; identical to iOS)
  screen.web.tsx                 Web screen (banner + disabled UI; never instantiates the hook)
  secure-note-store.ts           Keychain CRUD via expo-secure-store; tolerant
  hooks/
    useBiometricAuth.ts          capabilities / authenticate / history / refreshCapabilities
  components/
    CapabilitiesCard.tsx         hardware / enrolled / types / security level + Refresh
    AuthOptionsPanel.tsx         Switch + 3 text inputs
    ResultCard.tsx               Last result with timestamp
    SecureNoteCard.tsx           Save / View / Clear, biometric-gated reveal
    HistoryLog.tsx               Last 10 attempts
    IOSOnlyBanner.tsx            Per-module banner (fresh)

plugins/with-local-auth/
  index.ts                       Adds NSFaceIDUsageDescription via withInfoPlist
  package.json                   { name, version, main, types }

test/unit/modules/local-auth-lab/
  manifest.test.ts
  secure-note-store.test.ts
  hooks/useBiometricAuth.test.tsx
  components/CapabilitiesCard.test.tsx
  components/AuthOptionsPanel.test.tsx
  components/ResultCard.test.tsx
  components/SecureNoteCard.test.tsx
  components/HistoryLog.test.tsx
  components/IOSOnlyBanner.test.tsx
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx

test/unit/plugins/with-local-auth/
  index.test.ts

test/__mocks__/
  expo-local-authentication.ts   (new)
```

## Hook Contract — `useBiometricAuth`

```ts
interface UseBiometricAuth {
  capabilities: Capabilities | null;
  lastResult: AuthAttempt | null;
  history: AuthAttempt[];                           // newest first; capped at 10
  authenticate(opts?: LocalAuthenticationOptions): Promise<AuthAttempt>;
  refreshCapabilities(): Promise<void>;
}
```

Lifecycle:

1. **Mount** — auto-call `refreshCapabilities()` once.
2. **authenticate** — wrap `authenticateAsync(opts)` in try/catch:
   - success → `{ success: true, timestamp }`
   - failure result → `{ success: false, error, warning, timestamp }`
   - throw → `{ success: false, error: 'unknown', timestamp }`
   The result is set as `lastResult` and prepended to `history` (cap 10).
   Returned synchronously to callers (Secure Note's View flow consumes it).
3. **refreshCapabilities** — calls all four capability APIs in parallel
   and updates `capabilities`. Tolerant of throws (defaults each value).
4. **Unmount** — guard against post-unmount `setState` via `mountedRef`
   (021 pattern); never emits `act()` warnings.

## Test Strategy

- `useBiometricAuth.test.tsx` — capabilities load on mount; authenticate
  success → `lastResult.success === true`, history length 1; authenticate
  failure → records error; bridge throw → records `'unknown'`; history
  capped at 10.
- `secure-note-store.test.ts` — round-trip; missing returns `null`;
  SecureStore throwing returns `null` / no-op + warn (no rethrow).
- Component tests — render every visible state; assert switches and text
  inputs fire callbacks correctly; SecureNoteCard reveals only after a
  successful authenticate.
- `screen.test.tsx` — mounts the iOS variant; verifies all six sections
  render and the Authenticate flow is wired through the hook.
- `screen.android.test.tsx` — same as iOS (live module on Android).
- `screen.web.test.tsx` — banner present, Authenticate disabled, hook
  never instantiated.
- `manifest.test.ts` — id, kebab-case, platforms, minIOS, single-occurrence
  in registry.
- `with-local-auth.test.ts` (under `plugins/with-local-auth/index.test.ts`)
  — adds `NSFaceIDUsageDescription` when absent; preserves customized
  value when present; idempotent on re-run; coexists with prior plugins
  (with-sign-in-with-apple and with-audio-recording).

## Constitution Compliance (v1.1.0)

- **I. Cross-Platform Parity** — three screen variants; iOS + Android live,
  Web disabled with banner.
- **II. Themed UI** — ThemedText/ThemedView throughout; `Spacing` scale only.
- **III. Platform File Splitting** — `screen.tsx` / `screen.android.tsx` /
  `screen.web.tsx`.
- **IV. Additive Integration** — single new line in registry; single new
  plugin entry in app.json.
- **V. Test-First** — every new module export has a JS-pure test.
- **Validate-Before-Spec (1.1.0)** — N/A (no build/infra change; pure JS
  module + a 1-key Info.plist plugin).

## Risks & Decisions

- **D-01** Reuse `expo-secure-store` from 021 — credentials/notes are
  security-relevant, and the dep is already declared.
- **D-02** Cancellation (`user_cancel`) is informational, not an error
  (no `console.error`), matching iOS HIG and the 021 cancellation policy.
- **D-03** Plugin only writes `NSFaceIDUsageDescription`; deliberately
  leaves entitlements and other Info.plist keys alone.
- **D-04** Android is **live** (the underlying API supports it). Web is
  the only platform with a banner — distinct from 021 where Android also
  showed the banner.
- **D-05** History capped client-side at 10 entries; never persisted.
- **R-01** `expo-local-authentication`'s native bridge is loaded by tests
  via the per-module mock; no real native code is invoked under jest.
