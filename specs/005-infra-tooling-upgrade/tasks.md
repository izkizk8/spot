# Tasks: Infrastructure Tooling Upgrade

**Input**: Design documents from `/specs/005-infra-tooling-upgrade/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Tests are required for this feature. Unit test infrastructure must include executable examples for TypeScript logic, React Native component rendering, alias imports, and required mocks/setup. Lint/format failure behavior must be validated with representative checks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks
- **[Story]**: Which user story this task belongs to, such as US1, US2, US3, or US4
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install tooling dependencies and create shared documentation/test locations.

- [x] T001 Update devDependencies in package.json for oxlint, oxfmt, eslint, eslint-plugin-react-hooks, typescript-eslint, jest, jest-expo, @testing-library/react-native, and any required Jest TypeScript typings
- [x] T002 Refresh pnpm-lock.yaml by running pnpm install after package.json dependency changes
- [x] T003 [P] Create the developer tooling documentation skeleton in docs/tooling.md
- [x] T004 [P] Create the unit test examples documentation skeleton in test/unit/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish root configuration and baseline cleanup required before user story work.

**Critical**: No user story work should begin until this phase is complete.

- [x] T005 Create OXC formatter configuration in .oxfmtrc.json
- [x] T006 Create OXC lint configuration with React, React Hooks, Jest/test, and TypeScript coverage in oxlint.json
- [x] T007 Create Jest Expo configuration with path alias mapping in jest.config.js
- [x] T008 Create shared Jest and React Native test setup in test/setup.ts
- [x] T009 Verify test file inclusion and alias preservation in tsconfig.json without weakening strict mode
- [x] T010 Fix existing oxlint unused-parameter warnings in src/components/themed-view.tsx without changing runtime behavior
- [x] T011 [P] Add a validation evidence table for package scripts and quality checks in docs/tooling.md
- [x] T012 Record selected tooling versions and known planning validation findings in docs/tooling.md

**Checkpoint**: Root configs and shared docs/test setup exist, dependencies are installed, and known lint baseline issues are ready to be resolved.

---

## Phase 3: User Story 1 - Run Build And Project Scripts From One Place (Priority: P1)

**Goal**: Expose common development, verification, and EAS IPA workflows through package scripts while preserving existing Expo start commands.

**Independent Test**: Run `pnpm run`, inspect package.json, and confirm `ios:ipa` wraps the established sideload profile while `check` excludes remote EAS builds.

### Tests And Validation for User Story 1

- [x] T013 [P] [US1] Document the expected package script catalog from contracts/package-scripts.md in docs/tooling.md
- [x] T014 [US1] Add ios:ipa and ios:simulator EAS build scripts to package.json without changing eas.json
- [x] T015 [US1] Add format, format:check, lint:ox, lint aggregation, typecheck, test, test:watch, and check scripts to package.json
- [x] T016 [US1] Ensure the check script in package.json excludes ios:ipa and ios:simulator remote EAS build scripts

### Implementation for User Story 1

- [x] T017 [US1] Preserve existing start, android, ios, and web scripts in package.json while adding the new script catalog
- [x] T018 [US1] Run pnpm run and record the script catalog evidence in docs/tooling.md
- [x] T019 [US1] Inspect the ios:ipa command in package.json and record non-quota validation evidence in specs/005-infra-tooling-upgrade/quickstart.md
- [x] T020 [US1] Add script usage notes, including remote/quota warnings for EAS scripts, to docs/tooling.md

**Checkpoint**: User Story 1 is complete when package scripts are discoverable, documented, and the EAS IPA script wraps the proven sideload workflow without entering the local quality gate.

---

## Phase 4: User Story 2 - Enforce Formatting And Linting With Modern Tooling (Priority: P2)

**Goal**: Make OXC formatting/linting and React Hooks correctness checks part of the local quality workflow.

**Independent Test**: Run format/lint scripts and verify they pass on clean code and fail for representative formatting, lint, or React Hooks violations.

### Tests And Validation for User Story 2

- [x] T021 [P] [US2] Add OXC format validation instructions to specs/005-infra-tooling-upgrade/quickstart.md
- [x] T022 [US2] Add official React Hooks ESLint failure validation instructions to specs/005-infra-tooling-upgrade/quickstart.md
- [x] T023 [US2] Create a temporary React Hooks violation fixture in test/fixtures/lint/react-hooks-violation.tsx for lint failure validation
- [x] T024 [US2] Run lint:hooks against test/fixtures/lint/react-hooks-violation.tsx and record expected official React Hooks ESLint failure evidence in specs/005-infra-tooling-upgrade/quickstart.md
- [x] T025 [US2] Remove the temporary React Hooks violation fixture from test/fixtures/lint/react-hooks-violation.tsx after validation

### Implementation for User Story 2

- [x] T026 [US2] Configure OXC formatter file targets and style choices in .oxfmtrc.json
- [x] T027 [US2] Apply OXC formatting to src, app.json, package.json, and tsconfig.json using .oxfmtrc.json
- [x] T028 [US2] Re-run format:check and record successful formatting evidence in specs/005-infra-tooling-upgrade/quickstart.md
- [x] T029 [US2] Configure oxlint React, React Hooks, TypeScript, Jest/test, and project source coverage in oxlint.json
- [x] T030 [US2] Evaluate OXC, official React Hooks ESLint, and Expo lint coverage, document the complementary-check decision in docs/tooling.md, and wire lint:ox, lint:hooks, lint:expo if retained, and lint aggregation behavior in package.json
- [x] T031 [US2] Run pnpm lint and record OXC lint plus official React Hooks ESLint coverage evidence in specs/005-infra-tooling-upgrade/quickstart.md
- [x] T032 [US2] Document OXC format/lint conventions and official React Hooks ESLint rule coverage in docs/tooling.md

**Checkpoint**: User Story 2 is complete when OXC format/lint scripts pass on clean code, Hooks violations are proven to fail lint, and conventions are documented.

---

## Phase 5: User Story 3 - Run Unit Tests Locally (Priority: P3)

**Goal**: Provide a Jest Expo and React Native Testing Library harness with executable, copyable examples.

**Independent Test**: Run `pnpm test` and confirm examples pass for TypeScript logic, React Native component rendering, alias imports, and mocks/setup.

### Tests For User Story 3

- [x] T033 [P] [US3] Add a TypeScript logic example test that imports project code in test/unit/examples/typescript-logic.test.ts
- [x] T034 [P] [US3] Add a React Native component render example test using project components in test/unit/examples/react-native-component.test.tsx
- [x] T035 [P] [US3] Add an alias import and mocks/setup example test in test/unit/examples/alias-and-mocks.test.tsx

### Implementation for User Story 3

- [x] T036 [US3] Finalize Jest Expo preset, setup file, transform, and moduleNameMapper settings in jest.config.js
- [x] T037 [US3] Finalize React Native, Expo module, platform-specific file, and asset test setup in test/setup.ts
- [x] T038 [US3] Ensure package.json test and test:watch scripts run Jest once and in watch mode respectively
- [x] T039 [US3] Document how to locate, copy, and adapt unit test examples in test/unit/README.md
- [x] T040 [US3] Document the unit testing workflow and required mocks/setup in docs/tooling.md
- [x] T041 [US3] Run pnpm test and fix failures in jest.config.js, test/setup.ts, and test/unit/examples until the baseline suite passes
- [x] T042 [US3] Record unit test validation evidence in specs/005-infra-tooling-upgrade/quickstart.md

**Checkpoint**: User Story 3 is complete when the baseline unit suite passes locally and the executable examples are documented as the canonical starting point for future tests.

---

## Phase 6: User Story 4 - Keep TypeScript And Tooling Compatible With The App Stack (Priority: P4)

**Goal**: Ensure the modern tooling upgrade remains compatible with Expo SDK 55, React Native 0.83, React 19.2, strict TypeScript, and existing app workflows.

**Independent Test**: Run the full local quality gate and confirm app-facing scripts and compatibility decisions remain documented.

### Tests And Validation for User Story 4

- [x] T043 [US4] Run pnpm typecheck and preserve strict TypeScript alias behavior in tsconfig.json
- [x] T044 [US4] Run pnpm check, validate temporary format, lint/Hooks, typecheck, and unit-test failures propagate through the full gate, remove temporary failure changes, and fix baseline failures in package.json, oxlint.json, .oxfmtrc.json, jest.config.js, test/setup.ts, or test/unit/examples as needed
- [x] T045 [US4] Confirm package versions remain compatible with Expo SDK 55 and React Native 0.83 in package.json

### Implementation for User Story 4

- [x] T046 [US4] Document TypeScript, Expo, React Native, React, Jest, OXC, and pnpm compatibility decisions in docs/tooling.md
- [x] T047 [US4] Verify start, android, ios, and web scripts remain available in package.json after all tooling changes
- [x] T048 [US4] Record full quality gate evidence and app script preservation evidence in specs/005-infra-tooling-upgrade/quickstart.md

**Checkpoint**: User Story 4 is complete when modern tooling is compatible with the current app stack and the full local quality gate passes.

---

## Phase 7: Polish And Cross-Cutting Concerns

**Purpose**: Final documentation, agent guidance, and workflow validation across all user stories.

- [x] T049 [P] Update the Build & Run section in .github/copilot-instructions.md with the new package scripts and test commands
- [x] T050 [P] Ensure docs/tooling.md covers every new or renamed script with a one-line purpose and expected use case
- [x] T051 Run the complete quickstart sequence and update specs/005-infra-tooling-upgrade/quickstart.md with final pass/fail evidence
- [x] T052 [P] Update specs/005-infra-tooling-upgrade/research.md if implementation disproves any planning assumption or package compatibility decision
- [x] T053 Maintain specs/005-infra-tooling-upgrade/memory.md and specs/005-infra-tooling-upgrade/memory-synthesis.md while verifying tasks.md requirement coverage and marking completed tasks in specs/005-infra-tooling-upgrade/tasks.md as implementation proceeds

---

## Phase 8: Post-Clarification Official Hooks ESLint Coverage

**Purpose**: Apply the clarified requirement that official React Hooks ESLint rules must be retained even with overlapping OXC Hooks checks.

- [x] T054 [US2] Add eslint, eslint-plugin-react-hooks, and typescript-eslint devDependencies in package.json and pnpm-lock.yaml
- [x] T055 [US2] Create official React Hooks ESLint flat config in eslint.config.js
- [x] T056 [US2] Add lint:hooks and include it in lint and check through package.json
- [x] T057 [US2] Fix official React Hooks ESLint baseline issue in src/hooks/use-color-scheme.web.ts
- [x] T058 [US2] Validate a temporary conditional useState fixture fails pnpm lint:hooks, then remove the fixture
- [x] T059 [US2] Update docs/tooling.md, quickstart.md, research.md, data-model.md, contracts/package-scripts.md, and feature memory for official Hooks ESLint
- [x] T060 [US4] Run final format, lint, typecheck, test, and check validation after official Hooks ESLint is added

---

## Dependencies And Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies; start immediately.
- **Phase 2 Foundational**: Depends on Phase 1; blocks all user stories.
- **Phase 3 User Story 1**: Depends on Phase 2; recommended MVP scope.
- **Phase 4 User Story 2**: Depends on Phase 2 and package script structure from US1 for final script wiring, but OXC config work can begin after Phase 2.
- **Phase 5 User Story 3**: Depends on Phase 2 and package test script structure from US1 for final script wiring, but test example files can begin after Phase 2.
- **Phase 6 User Story 4**: Depends on US1, US2, and US3 because it validates the complete integrated quality gate.
- **Phase 7 Polish**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: MVP. Can be completed after Phase 2 with no dependency on US2, US3, or US4.
- **US2 (P2)**: Can start after Phase 2; final lint scripts depend on the package script catalog from US1.
- **US3 (P3)**: Can start after Phase 2; final test scripts depend on the package script catalog from US1.
- **US4 (P4)**: Integrates and validates the full stack after US1, US2, and US3.

### Requirement Coverage Map

- **US1**: FR-001, FR-002, FR-003, FR-014, FR-015, SC-001, SC-005, SC-006, SC-007.
- **US2**: FR-004, FR-005, FR-006, FR-015, FR-017, SC-002, SC-004, SC-008, T054-T059.
- **US3**: FR-007, FR-008, FR-009, FR-010, FR-011, FR-015, FR-017, SC-003, SC-009, SC-010.
- **US4**: FR-012, FR-013, FR-016, FR-017, SC-002, SC-006.

---

## Parallel Execution Examples

### User Story 1

```text
Task: T013 [US1] Document the expected package script catalog from contracts/package-scripts.md in docs/tooling.md
Task: T014 [US1] Add ios:ipa and ios:simulator EAS build scripts to package.json
```

### User Story 2

```text
Task: T021 [US2] Add OXC format validation instructions to specs/005-infra-tooling-upgrade/quickstart.md
```

### User Story 3

```text
Task: T033 [US3] Add a TypeScript logic example test that imports project code in test/unit/examples/typescript-logic.test.ts
Task: T034 [US3] Add a React Native component render example test using project components in test/unit/examples/react-native-component.test.tsx
Task: T035 [US3] Add an alias import and mocks/setup example test in test/unit/examples/alias-and-mocks.test.tsx
```

### Polish

```text
Task: T049 Update the Build & Run section in .github/copilot-instructions.md with the new package scripts and test commands
Task: T050 Ensure docs/tooling.md covers every new or renamed script with a one-line purpose and expected use case
Task: T052 Update specs/005-infra-tooling-upgrade/research.md if implementation disproves any planning assumption or package compatibility decision
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 so package scripts expose the main developer workflows and EAS IPA entry point.
3. Stop and validate `pnpm run`, package script documentation, and non-quota inspection of `ios:ipa`.

### Incremental Delivery

1. Add US1 package scripts and script documentation.
2. Add US2 OXC format/lint and React Hooks coverage.
3. Add US3 Jest Expo and React Native Testing Library examples.
4. Add US4 compatibility verification and the full local quality gate.
5. Complete polish and run the quickstart end to end.

### Validation Before Completion

Before the feature is complete, verify:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm check`
- non-quota inspection of `pnpm run ios:ipa` in package.json

Do not include remote EAS build scripts in `pnpm check`.
