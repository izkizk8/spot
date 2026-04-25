# Implementation Plan: Infrastructure Tooling Upgrade

**Branch**: `005-infra-tooling-upgrade` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-infra-tooling-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Upgrade the Expo React Native project infrastructure around pnpm package scripts, OXC lint/format, React Hooks rule coverage, strict TypeScript checks, and a React Native unit test harness. The implementation will keep the proven EAS unsigned IPA workflow intact and expose it through a package script, while keeping remote EAS builds out of the local `check` quality gate.

## Technical Context

**Language/Version**: TypeScript 5.9.x for project compatibility; npm registry latest is TypeScript 6.0.3, but Expo SDK 55 and the current `expo/tsconfig.base` stack remain the compatibility boundary.  
**Primary Dependencies**: Expo SDK 55, React Native 0.83.6, React 19.2.0, pnpm hoisted linker, EAS CLI, `oxlint`, `oxfmt`, `jest-expo`, Jest, `@testing-library/react-native`.  
**Storage**: N/A. This feature adds repository scripts, config, and executable examples; it does not add app data persistence.  
**Testing**: Jest with `jest-expo` preset and `@testing-library/react-native` for React Native component rendering; baseline executable examples for TypeScript logic, component rendering, path aliases, and mocks/setup.  
**Target Platform**: Developer tooling on Windows first, with commands written to remain usable on macOS/Linux; app targets remain iOS, Android, and Web through Expo.  
**Project Type**: Expo React Native mobile/web app infrastructure upgrade.  
**Performance Goals**: Local `check` should complete in under 2 minutes on a clean checkout after dependencies are installed; baseline unit tests should complete in under 2 minutes on Windows.  
**Constraints**: Keep `pnpm` and `nodeLinker: hoisted`; keep strict TypeScript and path aliases; keep React Compiler enabled; avoid intentional app runtime behavior changes; keep EAS remote builds outside the local quality gate.  
**Scale/Scope**: Single-app repository with current `src/`, `test/`, and `e2e/` directories; this feature adds tooling/config/docs/tests only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Cross-Platform Parity | Tooling must not change app behavior and must keep all existing Expo platform scripts available. | PASS | Package script catalog preserves default, Android, iOS, and web start scripts. |
| II. Token-Based Theming | Any touched app component examples must use existing themed primitives and tokens. | PASS | Baseline component tests should render existing components rather than introduce new UI. |
| III. Platform File Splitting | Non-trivial platform-specific test mocks must be documented instead of hidden in inline platform branches. | PASS | Test harness design includes setup/mocks documentation. |
| IV. StyleSheet Discipline | No new app styles are planned; if fixture components are needed, they must follow `StyleSheet.create()`. | PASS | Infrastructure-only scope avoids new runtime UI. |
| V. Test-First for New Features | New infrastructure must include executable baseline tests and manual verification steps. | PASS | Plan includes Jest/RNTL examples plus quickstart verification commands. |
| Validate-Before-Spec | Infrastructure assumptions must be proven during planning. | PASS | Phase 0 validation ran OXC CLIs, inspected Hooks rule coverage, and queried test package availability. |

No constitution violations require complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-infra-tooling-upgrade/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
package.json             # pnpm script catalog and dev dependency declarations
tsconfig.json            # strict TypeScript and alias verification target
oxlint.json              # OXC lint rule/plugin configuration
.oxfmtrc.json            # OXC formatter configuration
jest.config.js           # Jest + jest-expo test runner config
test/
├── setup.ts             # Jest/RN setup, mocks, test-library setup
└── unit/
    ├── examples/
    │   ├── typescript-logic.test.ts
    │   ├── react-native-component.test.tsx
    │   └── alias-and-mocks.test.tsx
    └── README.md        # Copyable unit test examples and conventions
src/
├── app/
├── components/
├── constants/
└── hooks/
docs/
└── tooling.md           # Developer quick reference for scripts and testing workflow
.github/copilot-instructions.md
```

**Structure Decision**: Keep the single Expo app structure. Add tooling config at the repository root, executable unit-test examples under the existing `test/` directory, and developer-facing script/testing documentation under `docs/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations or additional architecture complexity are planned.

## Phase 0 Research Summary

Completed in [research.md](research.md). Key decisions:

- Use `oxlint` as the primary linter and enable the React plugin for React Hooks rules.
- Use `oxfmt` as the primary formatter, with a checked-in config to avoid implicit defaults.
- Use Jest with `jest-expo` and `@testing-library/react-native` for React Native component testing.
- Keep TypeScript on the Expo-compatible 5.9.x line for this feature, while adding `tsc --noEmit` as `typecheck`.
- Keep EAS IPA script separate from the local `check` gate because it starts a remote build and consumes EAS quota.

## Phase 1 Design Summary

Completed in [data-model.md](data-model.md), [quickstart.md](quickstart.md), and [contracts/package-scripts.md](contracts/package-scripts.md).

Final developer command shape:

- `pnpm format` / `pnpm format:check` for OXC formatting.
- `pnpm lint:ox` for OXC linting with React/Hooks/Jest coverage.
- `pnpm lint:hooks` for official React Hooks ESLint coverage.
- `pnpm lint` for the complete OXC plus official Hooks lint workflow.
- `pnpm typecheck` for strict TypeScript validation.
- `pnpm test` / `pnpm test:watch` for Jest + React Native Testing Library.
- `pnpm check` for local non-build quality gate.
- `pnpm ios:ipa` for the EAS unsigned IPA sideload build entry point.

## Post-Design Constitution Re-Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| Cross-Platform Parity | PASS | Existing platform start scripts are retained; no app runtime feature changes are planned. |
| Token-Based Theming | PASS | Test examples should render existing components or use existing themed primitives. |
| Platform File Splitting | PASS | Platform-specific test mocks/setup will be documented; no inline runtime platform branching is planned. |
| StyleSheet Discipline | PASS | No new production styles are planned. |
| Test-First for New Features | PASS | Baseline executable tests and quickstart verification are required deliverables. |
| Validate-Before-Spec | PASS | Research records actual OXC CLI runs, Hooks rule discovery, package availability, and current formatting/lint findings. |

No open clarification markers remain.
