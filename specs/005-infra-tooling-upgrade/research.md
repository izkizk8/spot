# Research: Infrastructure Tooling Upgrade

**Feature**: `005-infra-tooling-upgrade`  
**Date**: 2026-04-25

## Decision: Use OXC tooling as the primary lint/format layer

**Decision**: Add `oxlint` and `oxfmt` as the primary local lint/format tooling.

**Rationale**: The user explicitly requested OXC lint/format. Registry and CLI proof-of-concept validation succeeded:

- `pnpm view oxlint version` returned `1.61.0`.
- `pnpm view oxfmt version` returned `0.46.0`.
- `pnpm dlx oxlint@1.61.0 --version` returned `Version: 1.61.0`.
- `pnpm dlx oxfmt@0.46.0 --version` returned `Version: 0.46.0`.
- `pnpm dlx oxfmt@0.46.0 --help` confirmed `--check`, `--write`, config support, ignore support, and glob/path support.

**Alternatives considered**:

- Keep only `expo lint`: rejected because it does not satisfy the OXC requirement and does not provide formatting.
- Prettier + ESLint only: rejected as the primary path because the feature explicitly requests OXC.
- Biome: rejected because it was not requested and would add another formatter/linter family.

## Decision: Use official React Hooks ESLint rules as the Hooks source of truth

**Decision**: Retain OXC as the primary format/general lint layer, and add a focused ESLint flat config with the official `eslint-plugin-react-hooks` recommended rules as complementary Hooks coverage.

**Rationale**: Proof-of-concept validation found overlapping Hooks rules in oxlint:

- `pnpm dlx oxlint@1.61.0 --react-plugin --rules | Select-String "hook|rules-of-hooks|exhaustive-deps"` listed `rules-of-hooks` and `exhaustive-deps` under the React plugin.
- `pnpm dlx oxlint@1.61.0 --react-plugin src --format unix` ran successfully against the current source tree and reported two real warnings in `src/components/themed-view.tsx` for unused parameters.

The clarified requirement is stricter than overlapping OXC rule names: official React Hooks ESLint rules must run locally. Registry and peer validation selected:

- `eslint@10.2.1`
- `eslint-plugin-react-hooks@7.1.1`
- `typescript-eslint@8.59.0`, whose peer range supports ESLint 10 and TypeScript 5.9.x.

The focused ESLint config avoids migrating the whole project away from OXC while preserving the official Hooks rule source.

**Alternatives considered**:

- ESLint + `eslint-plugin-react-hooks` as the only lint path: rejected because the feature explicitly requires OXC lint/format and OXC remains faster for general local linting.
- OXC Hooks rules only: rejected after clarification because the user explicitly expects official React Hooks ESLint rules.
- Ignore Hooks rules until app code changes: rejected because the spec explicitly requires React Hooks lint rule coverage.

## Decision: Introduce oxfmt config before applying formatting

**Decision**: Add an `.oxfmtrc.json` config before running write-format across the repository.

**Rationale**: During planning, a targeted `oxfmt --check` run succeeded but reported initial formatting drift and noted that no config was found. A checked-in config prevents implicit default drift and makes future formatting deterministic.

**Alternatives considered**:

- Run `oxfmt --write` with defaults immediately: rejected because formatting all existing files without a config creates noisy churn and unclear style ownership.
- Defer formatting entirely: rejected because the feature requires format-check and format-write commands.

## Decision: Use Jest + jest-expo + React Native Testing Library for unit and component tests

**Decision**: Configure Jest with the `jest-expo` preset and `@testing-library/react-native` for React Native component render tests.

**Rationale**: This stack fits Expo/React Native projects and supports TypeScript tests, RN component rendering, Expo-friendly transforms, setup files, and path aliases. Registry validation found compatible current packages:

- `@testing-library/react-native@13.3.3`
- `jest-expo@55.0.16`
- `jest@30.3.0`

An attempted `pnpm dlx jest@30.3.0 --version` did not complete because the configured npm mirror hit `ECONNRESET` while downloading tarballs, so executable Jest validation must be repeated after dependencies are installed in the implementation phase.

**Implementation update**: Initial implementation with `jest@30.3.0` installed successfully but failed baseline `jest-expo` runtime execution with `ReferenceError: You are trying to import a file outside of the scope of the test code`. `jest-expo@55.0.16` also pulled `jest-watch-typeahead` with a Jest `^27 || ^28 || ^29` peer range. The implementation therefore selected `jest@29.7.0` and `@types/jest@29.5.14`, which match the peer boundary and are the compatibility target for final validation.

**Alternatives considered**:

- Vitest: good for pure TypeScript units, but weaker for Expo/RN component render compatibility without more custom setup.
- Node's built-in test runner: insufficient for React Native component rendering and Expo transforms.
- Full E2E framework first: out of scope; the request is for unit testing and component examples.

## Decision: Keep TypeScript on the Expo-compatible line and add explicit typecheck script

**Decision**: Keep the project on TypeScript `~5.9.2` for implementation unless Expo tooling validation proves a newer version is compatible, and add `tsc --noEmit` as the typecheck command.

**Rationale**: The repository currently extends `expo/tsconfig.base`, has strict mode enabled, and uses TypeScript `~5.9.2`. Registry lookup shows TypeScript `6.0.3` exists, but the constitution requires compatibility with Expo SDK 55 and React Native 0.83. The plan prioritizes compatibility over forced major upgrades.

**Alternatives considered**:

- Upgrade immediately to TypeScript 6.0.3: deferred because compatibility with Expo SDK 55 and generated route types must be validated first.
- Skip typecheck because Expo compiles TypeScript: rejected because the spec requires strict TypeScript verification.

## Decision: Keep EAS IPA outside the local quality gate

**Decision**: Add a package script for the established EAS sideload profile, but keep it out of `pnpm check`.

**Rationale**: The proven unsigned IPA workflow is remote, quota-consuming, and already validated by Feature 004. Local quality gates should remain fast and deterministic. The IPA script should wrap `eas build --platform ios --profile sideload --non-interactive` and documentation should clearly mark it as remote/quota-consuming.

**Alternatives considered**:

- Include `ios:ipa` in `pnpm check`: rejected because it would start an EAS cloud build and consume build quota.
- Redesign the EAS workflow: rejected because Feature 004 already proved the custom YAML sideload profile works.

## Planning Validation Findings Resolved During Implementation

- The initial `oxlint --react-plugin src --format unix` warnings in `src/components/themed-view.tsx` were resolved without hiding meaningful warnings.
- The initial default `oxfmt --check` formatting drift was addressed by adding `.oxfmtrc.json`, running root-based formatting, and validating `pnpm format:check`.
- Jest executable validation was repeated after dependency installation; `jest@29.7.0` was retained as the `jest-expo@55.0.16` compatibility target.
- No spec back-patch was required: these findings refined implementation tasks but did not contradict the clarified requirements.
