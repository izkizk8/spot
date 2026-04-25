# Data Model: Infrastructure Tooling Upgrade

This feature does not introduce application data persistence. The model below describes developer-facing infrastructure entities that must be configured, documented, and verified.

## Package Script Catalog

**Purpose**: Named commands in `package.json` that developers use for startup, local validation, testing, and IPA builds.

**Fields**:

- `name`: Script name, unique within `package.json`.
- `command`: Shell-safe pnpm script command.
- `category`: `start`, `build`, `format`, `lint`, `typecheck`, `test`, or `aggregate`.
- `remote`: Whether the script starts an external service/build.
- `qualityGateMember`: Whether the script is included in `pnpm check`.
- `documentation`: One-line purpose and expected use case.

**Validation Rules**:

- Names must be stable and discoverable.
- Existing `start`, `android`, `ios`, and `web` scripts must remain available.
- Remote EAS build scripts must not be included in local `check`.
- All new or renamed scripts must be documented.

## Quality Check

**Purpose**: A repeatable command that validates one quality dimension and returns a reliable exit code.

**Fields**:

- `name`: Format check, lint, hooks lint, typecheck, test, or full check.
- `command`: Script or executable invoked.
- `inputs`: File patterns or project roots checked.
- `successExit`: Expected success exit code.
- `failureMode`: Representative failure that must fail the command.

**Validation Rules**:

- `format:check` must fail on formatting drift.
- `lint` must fail on meaningful lint or React Hooks issues.
- `typecheck` must fail on TypeScript errors without weakening strict mode.
- `test` must fail on failed assertions or broken RN test setup.
- `check` must fail if any included local check fails.

## React Native Test Harness

**Purpose**: The executable testing setup used for future unit and component tests.

**Fields**:

- `runner`: Jest with `jest-expo` preset.
- `renderer`: `@testing-library/react-native`.
- `setupFile`: Shared Jest setup and mocks.
- `aliasMapping`: Jest mappings for `@/*` and `@/assets/*`.
- `exampleTests`: TypeScript logic, RN component rendering, aliases, and mocks/setup.

**Validation Rules**:

- Baseline tests must run on Windows.
- At least one TypeScript logic test must import project code.
- At least one RN component render test must render project code.
- At least one example must demonstrate alias imports.
- Required mocks/setup must be documented and executable.

## Unit Test Example Catalog

**Purpose**: The committed, copyable examples and companion docs that teach future test authors the project convention.

**Fields**:

- `exampleName`: Human-readable example label.
- `filePath`: Test file location.
- `coveragePattern`: Logic, component render, alias import, or mocks/setup.
- `copyInstructions`: Where documentation explains how to adapt it.
- `validatedBy`: Script that proves the example passes.

**Validation Rules**:

- Examples must be executable tests, not docs-only snippets.
- Examples must stay small enough to run in the local quality gate.
- Documentation must point to the examples and explain how to add a similar test.

## React Hooks Lint Coverage

**Purpose**: Rule coverage that detects invalid hook usage and hook dependency issues.

**Fields**:

- `provider`: Official `eslint-plugin-react-hooks` flat recommended config.
- `parser`: `typescript-eslint` parser for JS, JSX, TS, and TSX source/test files.
- `rules`: `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, and related official recommended rules.
- `oxcOverlap`: OXC React plugin keeps overlapping Hooks checks as part of the primary general lint layer.
- `validationCase`: A representative Hooks violation that must fail lint.

**Validation Rules**:

- Invalid hook usage must be detected.
- Dependency issues must be detected by the official Hooks ESLint check.
- The full local quality gate must include this coverage.

## Tool Compatibility Decision

**Purpose**: A recorded tradeoff between latest tooling and Expo/RN compatibility.

**Fields**:

- `tool`: Tool/package name.
- `selectedVersion`: Version or range planned for implementation.
- `latestObserved`: Latest version observed during research.
- `compatibilityBoundary`: Expo/RN/React/TypeScript constraint.
- `decisionReason`: Why the selected version is acceptable.

**Validation Rules**:

- Major upgrades must be compatible with Expo SDK 55 and RN 0.83.
- Incompatibilities must be documented instead of silently ignored.

## Validation Evidence

**Purpose**: The recorded proof that tooling and scripts actually run.

**Fields**:

- `command`: Command executed.
- `result`: Pass, fail with expected issue, or blocked with reason.
- `evidence`: Short output summary.
- `followUp`: Required task if validation found a problem.

**Validation Rules**:

- Every required script must have evidence before completion.
- Expected failures from intentional test cases must be recorded as successful validation of failure behavior.
