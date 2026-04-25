# Developer Tooling

This project uses pnpm with `nodeLinker: hoisted`, Expo SDK 55, strict TypeScript, OXC
format/lint, official React Hooks ESLint rules, and Jest Expo for local unit tests.

## Package Scripts

| Script               | Purpose                                                                         | Use case                                                    | Included in `pnpm check` |
| -------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------ |
| `pnpm start`         | Start the default Expo dev server.                                              | Daily app development and Expo Go QR workflow.              | No                       |
| `pnpm android`       | Start Expo for Android.                                                         | Android emulator or connected device checks.                | No                       |
| `pnpm ios`           | Start Expo for iOS.                                                             | iOS simulator or Expo Go checks.                            | No                       |
| `pnpm web`           | Start Expo for web.                                                             | Browser validation of router and web variants.              | No                       |
| `pnpm ios:ipa`       | Start the EAS sideload IPA build with the `sideload` profile.                   | Intentional unsigned IPA build; remote and quota-consuming. | No                       |
| `pnpm ios:simulator` | Start the EAS iOS simulator build with the `development` profile.               | Intentional simulator build; remote and quota-consuming.    | No                       |
| `pnpm format`        | Apply OXC formatting from the repo root using checked-in ignore rules.          | Normalize implementation/config/test files before review.    | No                       |
| `pnpm format:check`  | Check OXC formatting without writing files.                                     | CI-style local formatting gate.                             | Yes                      |
| `pnpm lint:ox`       | Run oxlint from the repo root using checked-in ignore rules.                    | Fast local general lint with overlapping Hooks coverage.    | Through `pnpm lint`      |
| `pnpm lint:hooks`    | Run official `eslint-plugin-react-hooks` recommended rules on source and tests. | Source-of-truth React Hooks correctness check.              | Through `pnpm lint`      |
| `pnpm lint`          | Run OXC lint plus official React Hooks ESLint rules.                            | Default lint command for local quality checks.              | Yes                      |
| `pnpm typecheck`     | Run `tsc --noEmit` with strict settings and aliases.                            | Verify TypeScript compatibility.                            | Yes                      |
| `pnpm test`          | Run Jest Expo unit examples once.                                               | Validate logic, component rendering, aliases, and mocks.    | Yes                      |
| `pnpm test:watch`    | Run Jest in watch mode.                                                         | Iterating on tests locally.                                 | No                       |
| `pnpm check`         | Run format check, lint, typecheck, and tests.                                   | Full local quality gate before handoff.                     | Top-level gate           |

Remote EAS scripts are intentionally excluded from `pnpm check` because they start cloud builds and
can consume EAS quota.

## OXC Formatting

`.oxfmtrc.json` pins the formatting style instead of relying on implicit defaults:

- 2 spaces, LF line endings, final newline, semicolons, single quotes, trailing commas, and
  100-column wrapping.
- Ignored generated outputs include `node_modules/`, `.expo/`, `dist/`, `build/`, `coverage/`,
  native folders, `test-results/`, and `pnpm-lock.yaml`.

Use `pnpm format:check` to detect drift and `pnpm format` to write changes. The scripts run OXC
from the repository root and rely on `.oxfmtrc.json` `ignorePatterns` for boundaries, instead of
enumerating individual files in `package.json`. Spec Kit artifacts, Markdown documentation, agent
customization files, assets, generated outputs, and lockfiles are excluded from the everyday format
gate so routine code formatting does not churn SDD records or docs.

## Linting And Hooks Coverage

OXC is the retained primary format and general lint layer. `pnpm lint:ox` runs from the repository
root and relies on `oxlint.json` `ignorePatterns` instead of enumerating file paths in
`package.json`. The config enables TypeScript, React, Jest, import, unicorn, and OXC plugins, with
overlapping errors for `react/rules-of-hooks` and `react/exhaustive-deps`.

`oxlint@1.61.0` covers the classic Hooks checks, but it is not a 1:1 replacement for the official
`eslint-plugin-react-hooks@7.1.1` recommended config. The official config also enables React
Compiler-era checks such as `react-hooks/set-state-in-effect`, `static-components`, `immutability`,
`refs`, `purity`, `use-memo`, and related rules. This is why the focused Hooks ESLint layer is kept
instead of replacing it with OXC-only linting.

Official React Hooks ESLint rules are retained as the source-of-truth Hooks check. `eslint.config.js`
uses `typescript-eslint` parsing for JS, JSX, TS, and TSX files under `src/` and `test/`, applies
`eslint-plugin-react-hooks` `flat.recommended`, and treats `react-hooks/exhaustive-deps` as an
error. `pnpm lint` runs both `pnpm lint:ox` and `pnpm lint:hooks`.

Expo lint was evaluated as a complementary check with `npx expo lint --no-cache -- --max-warnings 0`.
In this repository it prompts to install/configure ESLint and then exits with
`CommandError: ESLint is not configured for this project` when declined. The retained complementary
ESLint scope is intentionally focused on official React Hooks rules rather than adopting the full
Expo lint workflow.

## Unit Testing

Jest uses the `jest-expo` preset, `@testing-library/react-native`, and shared setup from
`test/setup.ts`. Alias mapping in `jest.config.js` mirrors `tsconfig.json`:

- `@/*` maps to `src/*`.
- `@/assets/*` maps to `assets/*`.

Executable examples live in `test/unit/examples/` and are documented in `test/unit/README.md`.
Add shared Expo or React Native mocks to `test/setup.ts` when they are reusable across tests.

## Compatibility Decisions

| Tool         | Decision                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Expo         | Keep SDK 55 and existing app scripts unchanged.                                                                                |
| React Native | Keep 0.83.6 and use Jest Expo instead of custom transforms.                                                                    |
| React        | Keep 19.2.0 and configure oxlint React settings for React 19.                                                                  |
| TypeScript   | Keep `~5.9.2`, preserve strict mode, and add `tsc --noEmit`.                                                                   |
| Jest         | Use Jest 29.7.0 because `jest-expo@55.0.16` depends on a Jest 27-29 peer range and Jest 30 failed baseline runtime validation. |
| OXC          | Use `oxfmt@0.46.0` and `oxlint@1.61.0` as the primary format/lint layer.                                                       |
| ESLint Hooks | Use `eslint@10.2.1`, `eslint-plugin-react-hooks@7.1.1`, and `typescript-eslint@8.59.0` for official React Hooks rule coverage. |
| pnpm         | Keep hoisted linker from `pnpm-workspace.yaml`.                                                                                |

## Validation Evidence

| Command                   | Result        | Evidence                                                                                           |
| ------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm install`            | PASS          | Lockfile refreshed after OXC, official Hooks ESLint, TypeScript, and Jest tooling changes.         |
| `pnpm run`                | PASS          | Listed custom app, EAS, OXC, official Hooks lint, typecheck, Jest watch, and aggregate scripts.    |
| `pnpm pkg get scripts`    | PASS          | Confirmed `start`, platform scripts, EAS scripts, lint layers, typecheck, Jest, and `check`.       |
| `pnpm format:check`       | PASS          | OXC checked 34 implementation/config/test files with no formatting drift.                          |
| `pnpm lint:hooks`         | PASS          | Official React Hooks ESLint rules passed across `src` and `test`.                                  |
| `pnpm lint`               | PASS          | OXC lint checked 25 configured files and official React Hooks ESLint rules found 0 warnings/errors. |
| `pnpm typecheck`          | PASS          | `tsc --noEmit` completed with strict mode and aliases preserved.                                   |
| `pnpm test`               | PASS          | 3 Jest Expo example suites passed: TypeScript logic, RN component rendering, aliases/mocks.        |
| `pnpm check`              | PASS          | Aggregate gate passed format, lint, typecheck, and tests after temporary validations were removed. |
| Temporary format drift    | EXPECTED FAIL | `pnpm check` stopped at `format:check` with 1 unformatted file.                                    |
| Temporary Hooks violation | EXPECTED FAIL | `pnpm lint:hooks` failed with `react-hooks/rules-of-hooks` for conditional `useState`.             |
| Temporary type error      | EXPECTED FAIL | `pnpm check` stopped at `typecheck` with TS2322.                                                   |
| Temporary failing test    | EXPECTED FAIL | `pnpm check` reached Jest and failed the temporary assertion.                                      |
