# Feature Memory: Infrastructure Tooling Upgrade

## Active Context

- Feature: `005-infra-tooling-upgrade`.
- Goal: upgrade local developer infrastructure for package scripts, OXC format/lint, official React Hooks ESLint coverage, Jest Expo + React Native Testing Library unit examples, strict TypeScript checks, and documentation.
- Active branch: `005-infra-tooling-upgrade`.

## Analysis Findings To Preserve

- Feature memory is constitutionally required during active feature work.
- `pnpm check` must prove both the clean pass path and temporary failure propagation for format, lint/Hooks, typecheck, and unit tests.
- OXC should be primary for format/general lint, but official React Hooks ESLint rules must be retained as complementary source-of-truth Hooks coverage.
- Tasks that edit the same quickstart file should not both be marked parallel.

## Implementation Notes

- Keep EAS remote build scripts out of `pnpm check` to avoid consuming cloud build quota during local validation.
- Keep TypeScript on the Expo-compatible 5.9.x line unless implementation validation proves a newer version is compatible.
- Jest 29.7.0 is the validated compatibility target for `jest-expo@55.0.16`; Jest 30 was not retained after runtime/peer validation.
- Full Expo lint was evaluated but not retained; the retained ESLint scope is focused on official React Hooks rules.
- `pnpm check` clean pass and temporary failure propagation were validated for format drift, official React Hooks lint, TypeScript errors, and Jest failures.
