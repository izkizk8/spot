# Feature Specification: Infrastructure Tooling Upgrade

**Feature Branch**: `005-infra-tooling-upgrade`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "整理下脚本，把eas ipa写进package.json脚本里 基本基础建设搭建，使用oxc format lint，加入ut testing framework 使用最新技术比如typescript等，进行全面基础设施升级"

## Clarifications

### Session 2026-04-25

- Q: What baseline scope should the unit testing framework prove for this Expo React Native app? → A: TypeScript unit tests plus a lightweight React Native component render test.
- Q: What modern tooling constraints must the infrastructure upgrade include? → A: React Native component testing, OXC lint/format, and React Hooks lint rules.
- Q: What unit test examples must the infrastructure upgrade include? → A: Copyable examples for TypeScript logic, React Native component rendering, aliases, and required test mocks/setup.
- Q: Should React Hooks lint coverage rely only on OXC's React plugin rules? → A: No. Keep OXC as the primary formatter/general linter, but include the official React Hooks ESLint rules as a complementary lint check in the local lint and quality-gate workflow.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Run Build And Project Scripts From One Place (Priority: P1)

As a developer maintaining the app, I want the common development, verification, and iOS IPA build workflows exposed through package scripts so I do not need to remember long commands or search documentation before doing routine work.

**Why this priority**: Script consolidation is the entry point for the whole infrastructure upgrade and directly addresses the request to put the EAS IPA workflow into `package.json`.

**Independent Test**: Can be fully tested by listing the available package scripts, running the non-destructive validation scripts, and confirming the iOS IPA script invokes the established sideload build workflow without requiring a new manual command.

**Acceptance Scenarios**:

1. **Given** a fresh checkout with dependencies installed, **When** a developer inspects package scripts, **Then** they can identify scripts for starting the app, creating the unsigned iOS IPA, formatting, linting, type checking, unit testing, and running the full quality gate.
2. **Given** the existing iOS sideload build profile is configured, **When** a developer runs the package script for the IPA workflow, **Then** the established unsigned sideload build workflow starts without changing the proven EAS profile or custom build workflow.
3. **Given** existing Expo start scripts are already present, **When** the script set is upgraded, **Then** the existing start, Android, iOS, and web entry points remain available with clear names.

---

### User Story 2 - Enforce Formatting And Linting With Modern Tooling (Priority: P2)

As a developer changing TypeScript and React Native files, I want fast format and lint commands backed by OXC plus the official React Hooks ESLint rules so style, common code issues, and hook misuse are caught consistently before review.

**Why this priority**: Fast feedback is the core value of the tooling upgrade after script consolidation, and formatting/linting should become a routine local quality check.

**Independent Test**: Can be fully tested by running format-check and lint scripts on the repository and verifying they report a clean result on unchanged code and fail when an intentional formatting issue, general lint issue, or React Hooks rule violation is introduced.

**Acceptance Scenarios**:

1. **Given** the repository has TypeScript, TSX, JavaScript, and JSX files, **When** a developer runs the format check, **Then** all supported source files are checked deterministically and any required changes are reported.
2. **Given** a supported source file needs formatting, **When** a developer runs the write-format command, **Then** the file is rewritten consistently and a second format check reports no additional changes.
3. **Given** a React or React Native component violates React Hooks rules, **When** the lint command runs, **Then** the official React Hooks ESLint rules report the violation.
4. **Given** OXC also provides React Hooks rule coverage, **When** the quality workflow runs, **Then** the official React Hooks ESLint rules remain included as the source-of-truth Hooks check while OXC remains the primary formatter and general lint engine.

---

### User Story 3 - Run Unit Tests Locally (Priority: P3)

As a developer adding or changing code, I want a TypeScript-capable React Native component testing framework with copyable example tests so new behavior can be tested without inventing project conventions each time.

**Why this priority**: The project constitution requires tests for new application features, and the repository currently has empty test directories with no configured test framework.

**Independent Test**: Can be fully tested by running the unit test script on Windows and confirming the baseline suite passes, resolves project aliases, includes copyable TypeScript and React Native component examples, demonstrates required mocks/setup, and gives a clear failure when a sample assertion is broken.

**Acceptance Scenarios**:

1. **Given** dependencies are installed, **When** a developer runs the unit test script, **Then** a baseline test suite completes successfully with TypeScript support enabled and at least one React Native component render test passing.
2. **Given** a test imports project code through the configured path aliases, **When** the unit test script runs, **Then** the aliases resolve without custom manual setup by the developer.
3. **Given** a developer needs to add a new unit test, **When** they inspect the baseline examples, **Then** they can copy patterns for TypeScript logic, React Native component rendering, alias imports, and project-required mocks/setup.
4. **Given** a test fails, **When** the unit test script exits, **Then** the command reports the failing test clearly and returns a failing exit code suitable for automation.

---

### User Story 4 - Keep TypeScript And Tooling Compatible With The App Stack (Priority: P4)

As a maintainer, I want the infrastructure upgrade to use current stable tooling while staying compatible with the existing Expo, React Native, and TypeScript stack so the upgrade improves developer workflow without destabilizing app builds.

**Why this priority**: The user requested a broad modern tooling upgrade, but compatibility with the app's supported platform stack is the boundary that prevents churn from breaking builds.

**Independent Test**: Can be fully tested by running the full quality gate and confirming app-facing scripts still work after the upgrade, while documentation records any compatibility-bound version choices.

**Acceptance Scenarios**:

1. **Given** the repository already uses strict TypeScript, **When** the infrastructure upgrade is complete, **Then** a type-check script validates the project without relaxing strictness.
2. **Given** a latest stable tool version conflicts with the supported Expo or React Native stack, **When** the tool is selected, **Then** the chosen version prioritizes app compatibility and the reason is documented.
3. **Given** the upgrade changes only infrastructure files, **When** the feature is reviewed, **Then** app runtime behavior and user-facing screens remain unchanged.

### Edge Cases

- The existing unsigned iOS IPA workflow must not regress while adding a package script wrapper around it.
- If OXC does not support every file type or rule needed by the project, the workflow must keep complementary checks for uncovered areas.
- If the selected unit testing framework needs mocks for React Native, Expo modules, assets, or platform-specific files, the repository must include a documented baseline pattern rather than leaving each developer to solve it again.
- Unit test examples should be committed as passing tests, not only described in documentation, so the examples stay executable.
- Even when OXC linting detects React Hooks issues, the lint workflow must include the official React Hooks ESLint rules as complementary source-of-truth coverage for hook correctness.
- If a latest stable tool release is incompatible with the supported Expo SDK, React Native version, or TypeScript strict mode, compatibility with the app stack takes precedence.
- Scripts must work from Windows shells used by the project and avoid assumptions that only hold on macOS or Linux.
- Empty or missing test directories should be handled by adding a minimal baseline suite rather than leaving test commands configured but unproven.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST expose a package script that starts the existing unsigned iOS IPA sideload build workflow through the established EAS sideload profile.
- **FR-002**: The project MUST keep existing development entry point scripts for starting the app on default, Android, iOS, and web targets.
- **FR-003**: The project MUST provide package scripts for format check, format write, lint, type check, unit tests, and a full quality gate that combines the non-build verification commands.
- **FR-004**: The formatting and linting workflow MUST use OXC as the primary format and lint engine for supported source files where OXC provides stable project coverage.
- **FR-005**: The quality workflow MUST retain complementary checks when OXC does not cover required Expo, React Native, TypeScript, React Hooks, or project-specific validation, and MUST include official React Hooks ESLint rule coverage even when OXC has overlapping Hooks checks.
- **FR-006**: The lint workflow MUST enforce React Hooks correctness rules using the official React Hooks ESLint rules, including invalid hook usage and hook dependency issues, for React and React Native source files.
- **FR-007**: The unit testing framework MUST support TypeScript tests, React Native component render tests, project path aliases, clear pass/fail output, and non-zero failure exit codes.
- **FR-008**: The repository MUST include at least one baseline TypeScript unit test and one React Native component render test that prove the configured test framework runs against project code.
- **FR-009**: The React Native component testing setup MUST document any required baseline mocks or adapters for React Native, Expo modules, platform-specific files, and assets used by tests.
- **FR-010**: The repository MUST include executable, copyable unit test examples for TypeScript logic, React Native component rendering, project alias imports, and required mocks/setup.
- **FR-011**: The unit testing documentation MUST explain how to locate examples, add a new unit test, render a React Native component, use project aliases, and apply required mocks/setup.
- **FR-012**: The TypeScript verification workflow MUST preserve strict mode and the existing path aliases.
- **FR-013**: Tool versions selected during implementation MUST be current stable releases that are compatible with the supported Expo, React Native, React, and TypeScript versions.
- **FR-014**: The upgraded scripts MUST be documented in a developer-facing quick reference so a new contributor can identify which command to run for each workflow.
- **FR-015**: The implementation MUST include validation evidence for package scripts, OXC format/lint checks, official React Hooks ESLint checks, type checking, unit tests, and the iOS IPA script entry point.
- **FR-016**: The upgrade MUST avoid user-facing app behavior changes unless explicitly required to make infrastructure checks pass.
- **FR-017**: The full quality gate MUST fail when any included format check, lint check, React Hooks check, type check, or unit test fails, and pass only when all included checks pass.

### Key Entities

- **Package Script Catalog**: The named developer commands exposed by the project for app startup, build entry points, formatting, linting, type checking, testing, and aggregate verification.
- **Quality Check**: A repeatable command that validates one aspect of repository health and returns a reliable pass/fail exit code.
- **React Native Test Harness**: The selected testing setup, baseline tests, component render utilities, and conventions that allow future application code to be tested consistently.
- **Unit Test Example Catalog**: The executable sample tests and companion documentation that show how to test TypeScript logic, React Native components, alias imports, and required mocks/setup.
- **React Hooks Lint Coverage**: The official React Hooks ESLint rule coverage that catches invalid hook usage and hook dependency issues in React and React Native source files.
- **Tool Compatibility Decision**: A documented choice where latest stable tooling is balanced against the app's supported Expo, React Native, React, and TypeScript stack.
- **Validation Evidence**: The recorded output or summary proving each required script and workflow was exercised successfully during the feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new contributor can identify the correct package script for starting the app, creating the iOS IPA, formatting, linting, type checking, unit testing, and full verification in under 10 minutes using repository documentation.
- **SC-002**: The full quality gate completes successfully on a clean checkout and returns a failing exit code when any included format, lint, React Hooks, type, or test check is intentionally broken.
- **SC-003**: The baseline unit test suite runs locally on Windows in under 2 minutes and reports at least one passing TypeScript unit test plus one passing React Native component render test against project code.
- **SC-004**: Running format write followed by format check produces no additional formatting changes on supported source files.
- **SC-005**: The iOS IPA package script invokes the same sideload build workflow documented for unsigned IPA creation, with zero changes required to the proven build profile behavior.
- **SC-006**: Existing app startup scripts for default, Android, iOS, and web workflows remain available after the upgrade.
- **SC-007**: Documentation covers 100% of newly added or renamed scripts with a one-line purpose and expected use case.
- **SC-008**: Introducing a representative React Hooks rule violation causes the official React Hooks ESLint rule workflow to fail with a clear diagnostic.
- **SC-009**: The committed unit test examples cover TypeScript logic, React Native component rendering, project alias imports, and required mocks/setup, and all examples pass in the baseline unit test run.
- **SC-010**: A new contributor can use the documented unit test examples to create a similar test in under 10 minutes without asking for additional setup instructions.

## Assumptions

- The existing unsigned iOS IPA workflow from Feature 004 is the source of truth and should be wrapped by scripts, not redesigned in this feature.
- "Latest technology" means latest stable tooling compatible with the current Expo SDK, React Native, React, and TypeScript constraints, not forced major upgrades that break app support.
- OXC should become the primary format/lint engine where it has stable coverage, while complementary checks must cover Expo, React Native, TypeScript, project-specific gaps, and official React Hooks ESLint rule enforcement.
- The unit testing framework should prioritize React Native component testing, TypeScript support, fast local feedback, Windows compatibility, and future React Native testing needs.
- Unit test examples should serve as the canonical starting point for future feature tests and should stay small enough to run in the normal local quality gate.
- No continuous integration service is currently configured, so this feature focuses on local scripts that are suitable for later CI adoption.
- The feature is infrastructure-only and should not intentionally change screens, navigation, styling, or app behavior.
