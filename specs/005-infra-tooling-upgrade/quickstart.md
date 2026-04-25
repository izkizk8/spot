# Quickstart: Infrastructure Tooling Upgrade

This quickstart verifies the infrastructure upgrade after implementation.

## 1. Install Dependencies

```powershell
pnpm install
```

## 2. Inspect Package Scripts

```powershell
pnpm run
```

Confirm scripts exist for app startup, `ios:ipa`, `format`, `format:check`, `lint:ox`, `lint:hooks`, `lint`, `typecheck`, `test`, and `check`.

## 3. Run Local Quality Gate

```powershell
pnpm check
```

Expected result: format check, OXC lint, official React Hooks ESLint coverage, TypeScript, and unit tests all pass.

## 4. Verify Formatting Commands

```powershell
pnpm format:check
pnpm format
pnpm format:check
```

Expected result: the final format check reports no additional changes.

Implementation evidence: `pnpm format:check` passed after OXC checked 34 implementation/config/test files with no formatting drift. A temporary spacing drift in `test/unit/examples/typescript-logic.test.ts` caused `pnpm check` to stop at `format:check` with exit code 1, then the drift was reverted.

## 5. Verify Lint And React Hooks Coverage

```powershell
pnpm lint
```

Expected result: OXC lint runs from the repository root using `oxlint.json` ignore rules for general React/project coverage, and official React Hooks ESLint rules run as the source-of-truth Hooks check. A representative Hooks violation should fail `pnpm lint:hooks` during implementation validation and then be removed before completion.

Implementation evidence: `pnpm lint:hooks` passed across `src` and `test`. A temporary fixture at `test/fixtures/lint/react-hooks-violation.tsx` caused `pnpm lint:hooks` to fail with official `react-hooks/rules-of-hooks` for conditional `useState`, then the fixture was removed.

## 6. Verify TypeScript

```powershell
pnpm typecheck
```

Expected result: TypeScript strict checking passes with existing `@/*` and `@/assets/*` aliases preserved.

Implementation evidence: `pnpm typecheck` passed. A temporary `test/fixtures/typecheck/type-error.ts` fixture caused `pnpm check` to fail at TypeScript with TS2322, then the fixture was removed.

## 7. Verify Unit Test Examples

```powershell
pnpm test
```

Expected result: executable examples pass for TypeScript logic, React Native component rendering, alias imports, and required mocks/setup.

Implementation evidence: `pnpm test` passed 3 suites and 3 tests covering TypeScript logic, React Native component rendering, and aliases/shared mocks. A temporary failing Jest test caused `pnpm check` to reach the Jest stage and fail the assertion, then the test was removed.

## 8. Verify EAS IPA Script Entry Point

```powershell
pnpm run ios:ipa
```

This starts a remote EAS build and may consume build quota. Run only when intentionally validating the unsigned IPA workflow. The script must use the existing `sideload` profile from `eas.json`.

For non-quota validation, inspect the script in `package.json` and confirm it wraps:

```text
eas build --platform ios --profile sideload --non-interactive
```

Implementation evidence: `pnpm pkg get scripts` confirmed `ios:ipa` wraps `eas build --platform ios --profile sideload --non-interactive`, while `check` runs only `format:check`, `lint`, `typecheck`, and `test`.

## Final Local Validation Evidence

| Command                | Result | Evidence                                                                                                                                     |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm pkg get scripts` | PASS   | Script catalog includes app start, platform targets, EAS entries, OXC format/lint, official Hooks lint, typecheck, Jest, watch, and `check`. |
| `pnpm format:check`    | PASS   | OXC checked 34 implementation/config/test files with no formatting drift.                                                                    |
| `pnpm lint:hooks`      | PASS   | Official React Hooks ESLint rules passed across `src` and `test`.                                                                            |
| `pnpm lint`            | PASS   | OXC lint checked 25 configured files and official React Hooks ESLint rules found 0 warnings/errors.                                           |
| `pnpm typecheck`       | PASS   | Strict TypeScript check completed with aliases preserved.                                                                                    |
| `pnpm test`            | PASS   | 3 Jest Expo suites passed in under 2 minutes on Windows.                                                                                     |
| `pnpm check`           | PASS   | Aggregate gate passed after all temporary failure fixtures were removed.                                                                     |
