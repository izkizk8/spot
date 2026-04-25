# Contract: Package Scripts And Quality Gate

The package script catalog is the developer-facing command interface for this feature.

## Required Scripts

| Script          | Contract                                                                            | Included In `check` |
| --------------- | ----------------------------------------------------------------------------------- | ------------------- |
| `start`         | Start Expo default dev server.                                                      | No                  |
| `android`       | Start Expo Android target.                                                          | No                  |
| `ios`           | Start Expo iOS target.                                                              | No                  |
| `web`           | Start Expo web target.                                                              | No                  |
| `ios:ipa`       | Start EAS unsigned IPA build via `sideload` profile. Remote/quota-consuming.        | No                  |
| `ios:simulator` | Start EAS iOS simulator build via `development` profile. Remote/quota-consuming.    | No                  |
| `format`        | Apply OXC formatting to configured files.                                           | No                  |
| `format:check`  | Check OXC formatting without writing files.                                         | Yes                 |
| `lint:ox`       | Run OXC lint from the repo root with React, overlapping Hooks, Jest/test, and project coverage controlled by `oxlint.json`. | Yes, through `lint` |
| `lint:hooks`    | Run official React Hooks ESLint rules across source and test files.                 | Yes, through `lint` |
| `lint`          | Run OXC lint and official React Hooks ESLint rules.                                 | Yes                 |
| `typecheck`     | Run strict TypeScript check without emitting files.                                 | Yes                 |
| `test`          | Run baseline Jest + React Native Testing Library suite once.                        | Yes                 |
| `test:watch`    | Run Jest in watch mode for local development.                                       | No                  |
| `check`         | Run format check, lint, typecheck, and unit tests.                                  | Top-level gate      |

## Exit-Code Contract

- `format:check` returns non-zero when formatting drift exists.
- `lint:hooks` returns non-zero when official React Hooks ESLint rules fail.
- `lint` returns non-zero when OXC or official React Hooks ESLint checks fail.
- `typecheck` returns non-zero when TypeScript strict checking fails.
- `test` returns non-zero when a test fails or required setup is broken.
- `check` returns non-zero if any included local check fails.
- `ios:ipa` returns the EAS CLI exit code and may start a remote build; it must not run as part of `check`.

## Complementary Lint Decision

`lint:expo` was evaluated as a possible complementary lint script. It is not a required retained script for this implementation because the retained ESLint scope is focused on official React Hooks rules, while OXC covers the primary TypeScript, React, Jest/test, import, and project source checks. If a later feature adds Expo/ESLint-specific rules that OXC cannot cover, reintroduce `lint:expo` and include it through `lint`.

## Windows Compatibility Contract

- Scripts must avoid POSIX-only environment variable assignment syntax.
- Scripts should use command chaining that works in npm/pnpm scripts on Windows.
- File globs should be quoted only where supported by the called tool, not by shell-specific assumptions.

## Documentation Contract

Every new or renamed script must have a one-line purpose in developer documentation. Remote/quota-consuming scripts must be marked clearly.
