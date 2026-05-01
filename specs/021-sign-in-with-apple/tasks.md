---
description: "Dependency-ordered task list for feature 021 — Sign in with Apple Module"
---

# Tasks: Sign in with Apple Module (`sign-in-with-apple`)

**Input**: spec.md + plan.md in `specs/021-sign-in-with-apple/`
**Tests**: REQUIRED. Constitution V mandates JS-pure tests for every new
unit. Use TDD where practical (test before code) and end with `pnpm check` green.

## Phase 1: Setup

- [ ] T001 Verify branch `021-sign-in-with-apple` is clean and based on `020-audio-recording`.
- [ ] T002 `npx expo install expo-apple-authentication` — record resolved version.
- [ ] T003 `npx expo install expo-secure-store` — record resolved version.
- [ ] T004 Create directory skeleton: `src/modules/sign-in-with-apple/`,
      `src/modules/sign-in-with-apple/components/`, `src/modules/sign-in-with-apple/hooks/`,
      `plugins/with-sign-in-with-apple/`,
      `test/unit/modules/sign-in-with-apple/`,
      `test/unit/modules/sign-in-with-apple/components/`,
      `test/unit/modules/sign-in-with-apple/hooks/`,
      `test/unit/plugins/with-sign-in-with-apple/`.

## Phase 2: Mocks (must precede tests)

- [ ] T010 Create `test/__mocks__/expo-apple-authentication.ts` with
      configurable `signInAsync`, `getCredentialStateAsync`, scope/credential/button enums,
      `AppleAuthenticationButton` rendering as a `<View testID="siwa-button">`.
- [ ] T011 Create `test/__mocks__/expo-secure-store.ts` with in-memory
      `getItemAsync` / `setItemAsync` / `deleteItemAsync` and `__setShouldThrow(op)`
      injection for failure-tolerance tests.

## Phase 3: Foundational (siwa-store + manifest)

- [ ] T020 [P] Write `test/unit/modules/sign-in-with-apple/siwa-store.test.ts`.
- [ ] T021 Implement `src/modules/sign-in-with-apple/siwa-store.ts`
      (key `spot.siwa.user`, JSON round-trip, tolerant of SecureStore throws).
- [ ] T022 [P] Write `test/unit/modules/sign-in-with-apple/manifest.test.ts`.
- [ ] T023 Implement `src/modules/sign-in-with-apple/index.tsx` (manifest).
- [ ] T024 Add the manifest to `src/modules/registry.ts` (one import + one array entry).

## Phase 4: Hook (US1 + US2 + US3)

- [ ] T030 Write `test/unit/modules/sign-in-with-apple/hooks/useSiwaSession.test.tsx` covering:
      mount with empty store; mount with stored user → auto-refresh credential state;
      sign-in success persists + state flip; cancel is silent; error sets state='error';
      refresh updates credentialState; sign-out clears Keychain.
- [ ] T031 Implement `src/modules/sign-in-with-apple/hooks/useSiwaSession.ts`.

## Phase 5: Components

- [ ] T040 [P] Write + implement `components/IOSOnlyBanner.tsx` + test.
- [ ] T041 [P] Write + implement `components/UserCard.tsx` + test (four states; conditional fields).
- [ ] T042 [P] Write + implement `components/ScopesPicker.tsx` + test (checkbox semantics).
- [ ] T043 [P] Write + implement `components/CredentialStateCard.tsx` + test
      (four states; refresh button; disabled when no user).
- [ ] T044 [P] Write + implement `components/SiwaButton.tsx` + test
      (variant / style / corner pickers; forwards correct enum constants;
      `Platform.OS !== 'ios'` → renders disabled native-button placeholder).

## Phase 6: Screens

- [ ] T050 Write + implement `screen.tsx` (composes everything via `useSiwaSession`).
- [ ] T051 Write + implement `screen.android.tsx` (banner + disabled UI; no hook).
- [ ] T052 Write + implement `screen.web.tsx` (banner + disabled UI; no hook).
- [ ] T053 Write `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`.

## Phase 7: Config Plugin

- [ ] T060 Write `test/unit/plugins/with-sign-in-with-apple/with-sign-in-with-apple.test.ts`
      (adds entitlement when absent; preserves when present; coexists with each prior plugin).
- [ ] T061 Implement `plugins/with-sign-in-with-apple/index.ts`
      (uses `withEntitlementsPlist`; adds `com.apple.developer.applesignin = ["Default"]`).
- [ ] T062 Implement `plugins/with-sign-in-with-apple/package.json`.
- [ ] T063 Add `./plugins/with-sign-in-with-apple` to `app.json` `plugins` array.

## Phase 8: Polish & Verify

- [ ] T070 `pnpm format`.
- [ ] T071 `pnpm lint`.
- [ ] T072 `pnpm typecheck`.
- [ ] T073 `pnpm test` — verify suite count = 192 and total test count > 1395.
- [ ] T074 `pnpm check` — must be green end-to-end.
- [ ] T075 Final commit(s) with Co-authored-by trailer.
