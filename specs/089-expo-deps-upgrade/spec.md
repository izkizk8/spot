# Feature Specification: Expo SDK 55 dependency alignment

**Feature Branch**: `089-expo-deps-upgrade`
**Created**: 2026-05-02
**Status**: Draft
**Input**: User description: "升级下expo等相关依赖，不然pnpm start有依赖提示"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintainer launches the dev server without warnings (Priority: P1)

When a maintainer runs the local dev server, they should not see Expo's "outdated dependencies" warning. The project should match the version set Expo officially recommends for the installed SDK so the CLI, tooling, and runtime stay in lockstep.

**Why this priority**: Stale package versions are the most common source of confusing native-module errors and mismatched type definitions. Silencing the warning at the source removes a recurring distraction and prevents drift from accumulating into a hard upgrade later.

**Independent Test**: Run `pnpm start` (or `npx expo install --check`) on a clean clone and confirm the CLI does not print the outdated-dependencies warning and lists no packages needing updates.

**Acceptance Scenarios**:

1. **Given** a clean clone on branch `089-expo-deps-upgrade`, **When** the maintainer runs `pnpm install` followed by `npx expo install --check`, **Then** the command exits 0 with "Dependencies are up to date".
2. **Given** the upgraded lockfile, **When** the maintainer runs `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm docs:check`, **Then** all four commands exit 0.

---

### Edge Cases

- What happens if a bumped package introduces a soft API deprecation? The audit (see Assumptions) only includes patch/minor bumps and one version-numbering realignment with no documented breaking changes; we explicitly verify by running typecheck and tests.
- How does the system handle a future EAS build after the bump? The project uses Continuous Native Generation (no `ios/`/`android/` directories), so EAS regenerates native code on each build. No manual prebuild or pod install is required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `package.json` MUST pin each of the following packages at the version recommended for Expo SDK 55: `@expo/ui` `~55.0.13`, `expo` `~55.0.19`, `expo-location` `~55.1.8`, `expo-notifications` `~55.0.22`, `react-native-maps` `1.27.2`.
- **FR-002**: `pnpm-lock.yaml` MUST be regenerated to match the new versions, with deterministic resolution (frozen-lockfile install MUST succeed in CI).
- **FR-003**: No application or test source code MUST be modified beyond what the upgrade tools touch automatically.
- **FR-004**: `npx expo install --check` MUST report no outdated packages after the upgrade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npx expo install --check` exits 0 with no listed outdated packages.
- **SC-002**: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm docs:check` all exit 0 on the feature branch.
- **SC-003**: `pnpm start` no longer prints the "outdated dependencies" warning during boot.

## Assumptions

- The audit produced by `npx expo install --check` (5 packages listed) is the full scope of work; no additional dependencies require alignment.
- `expo-location` jumping from `19.0.8` to `55.1.8` is a version-numbering realignment by Expo (the SDK 55 release of `expo-location` is `55.0.0`, succeeding `19.0.x`). The CHANGELOG records no API breaking changes between `19.0.8` and `55.1.8`.
- `react-native-maps` `1.15.0` → `1.27.2` is a series of patch and minor releases (bug fixes, plus an `appleLogoInsets` prop addition) with no documented breaking changes affecting our usage in `src/modules/mapkit-lab/`.
- The project remains on Expo SDK 55; this is not a major-version upgrade.
- React Compiler stays enabled (`experiments.reactCompiler: true` in `app.json`); no related config changes are needed.
