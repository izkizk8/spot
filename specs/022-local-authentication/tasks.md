---
description: "Dependency-ordered task list for feature 022 — Local Authentication Module"
---

# Tasks: Local Authentication Module (`local-auth-lab`)

**Input**: spec.md + plan.md in `specs/022-local-authentication/`
**Tests**: REQUIRED. Constitution V mandates JS-pure tests for every new
unit. End with `pnpm check` green.

## Phase 1: Setup

- [ ] T001 Verify branch `022-local-authentication` is clean and based on `021-sign-in-with-apple`.
- [ ] T002 `npx expo install expo-local-authentication` — record resolved version.
- [ ] T003 Create directory skeleton: `src/modules/local-auth-lab/`,
      `src/modules/local-auth-lab/components/`,
      `src/modules/local-auth-lab/hooks/`,
      `plugins/with-local-auth/`,
      `test/unit/modules/local-auth-lab/`,
      `test/unit/modules/local-auth-lab/components/`,
      `test/unit/modules/local-auth-lab/hooks/`,
      `test/unit/plugins/with-local-auth/`.

## Phase 2: Mocks

- [ ] T010 Create `test/__mocks__/expo-local-authentication.ts` with
      configurable `hasHardwareAsync`, `isEnrolledAsync`,
      `supportedAuthenticationTypesAsync`, `getEnrolledLevelAsync`,
      `authenticateAsync`, plus `AuthenticationType` / `SecurityLevel` enums.

## Phase 3: Foundational (secure-note-store + manifest)

- [ ] T020 Write `test/unit/modules/local-auth-lab/secure-note-store.test.ts`.
- [ ] T021 Implement `src/modules/local-auth-lab/secure-note-store.ts`
      (key `spot.localauth.note`, tolerant of SecureStore throws).
- [ ] T022 Write `test/unit/modules/local-auth-lab/manifest.test.ts`.
- [ ] T023 Implement `src/modules/local-auth-lab/index.tsx` (manifest).
- [ ] T024 Add the manifest to `src/modules/registry.ts` (one import + one entry).

## Phase 4: Hook

- [ ] T030 Write `test/unit/modules/local-auth-lab/hooks/useBiometricAuth.test.tsx`
      covering: capabilities load on mount; authenticate success populates
      result + history; authenticate failure (cancel / error); bridge throw
      records `unknown`; history capped at 10.
- [ ] T031 Implement `src/modules/local-auth-lab/hooks/useBiometricAuth.ts`.

## Phase 5: Components

- [ ] T040 [P] Write + implement `components/IOSOnlyBanner.tsx` + test.
- [ ] T041 [P] Write + implement `components/CapabilitiesCard.tsx` + test.
- [ ] T042 [P] Write + implement `components/AuthOptionsPanel.tsx` + test.
- [ ] T043 [P] Write + implement `components/ResultCard.tsx` + test.
- [ ] T044 [P] Write + implement `components/HistoryLog.tsx` + test.
- [ ] T045 [P] Write + implement `components/SecureNoteCard.tsx` + test.

## Phase 6: Screens

- [ ] T050 Write + implement `screen.tsx` (composes everything via `useBiometricAuth`).
- [ ] T051 Write + implement `screen.android.tsx` (live; identical to iOS).
- [ ] T052 Write + implement `screen.web.tsx` (banner + disabled UI; no hook).
- [ ] T053 Write `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`.

## Phase 7: Config Plugin

- [ ] T060 Write `test/unit/plugins/with-local-auth/index.test.ts`.
- [ ] T061 Implement `plugins/with-local-auth/index.ts`
      (uses `withInfoPlist`; adds `NSFaceIDUsageDescription`).
- [ ] T062 Implement `plugins/with-local-auth/package.json`.
- [ ] T063 Add `./plugins/with-local-auth` to `app.json` `plugins` array.

## Phase 8: Polish & Verify

- [ ] T070 `pnpm format`.
- [ ] T071 `pnpm lint`.
- [ ] T072 `pnpm typecheck`.
- [ ] T073 `pnpm test` — verify suite count = 215 (203 + 12) and total > 1456.
- [ ] T074 `pnpm check` — must be green end-to-end.
- [ ] T075 Final commit(s) with Co-authored-by trailer.
