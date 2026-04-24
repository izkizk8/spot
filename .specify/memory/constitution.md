<!--
Sync Impact Report
  Version change: 1.0.0 → 1.0.1 (PATCH: clarification)
  Modified principles:
    - V. Test-First for New Features: added Exemption clause
      for documentation/configuration-only features
  Added sections: none
  Removed sections: none
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed
    - .specify/templates/spec-template.md ✅ no update needed
    - .specify/templates/tasks-template.md ✅ no update needed
  Evidence: retrospective.md from 001-fix-speckit-concerns
    identified justified exception pattern for docs-only features
  Follow-up TODOs: none
-->

# spot Constitution

## Core Principles

### I. Cross-Platform Parity

Every feature MUST work on iOS, Android, and Web.
Functionality MUST be tested or verified on all three
platforms before a feature is considered complete.
Platform-specific behavior is permitted when it improves
UX on that platform, but the core user journey MUST be
equivalent across all targets.

**Rationale**: spot targets three platforms from one
codebase. A feature that works only on one platform
creates a fragmented product and compounds maintenance
debt as screens multiply.

### II. Token-Based Theming

All color, spacing, and typography values MUST come from
the centralized design token system in
`src/constants/theme.ts`. Components MUST use
`ThemedText` and `ThemedView` instead of raw `Text` and
`View` for any themed surface. Direct color access MUST
use the `useTheme()` hook, never hardcoded hex values.

**Rationale**: Centralizing tokens ensures light/dark
mode consistency, makes future design system changes
atomic, and prevents scattered magic values that resist
refactoring.

### III. Platform File Splitting

Non-trivial platform differences MUST use the
`.web.tsx` / `.web.ts` file suffix convention rather
than inline `Platform.select()` or `Platform.OS`
branches. The bundler resolves the correct variant
automatically. Inline `Platform.select()` is acceptable
only for single-value differences (e.g., a padding
number).

**Rationale**: File splitting keeps each platform's code
self-contained, testable, and readable. Inline branching
becomes unreadable when logic diverges beyond a single
expression.

### IV. StyleSheet Discipline

All styles MUST use `StyleSheet.create()`. No CSS-in-JS
libraries, no inline style objects defined outside
StyleSheet, and no utility-class frameworks. The only
exception is `src/global.css` for web font-face
declarations. Spacing values MUST use the `Spacing`
scale from `src/constants/theme.ts`.

**Rationale**: `StyleSheet.create()` is optimized by
React Native for static style resolution. Mixing
styling approaches creates inconsistency and makes it
harder to reason about the style cascade.

### V. Test-First for New Features

Every new feature MUST include tests that cover its
acceptance scenarios before it is considered complete.
Tests MUST be written alongside or before implementation.
Existing untested code does not need retroactive
coverage unless it is being modified.

**Exemption**: Features that modify only documentation,
configuration, or workflow files (no application code)
are exempt from test-first. These features MUST instead
include manual verification steps (e.g., grep checks,
file counts) documented in quickstart.md or as
verification tasks in tasks.md.

**Rationale**: The project currently has no test
framework configured. This principle ensures that as
testing infrastructure is set up, all new work follows
test-first discipline from day one rather than
accumulating untested features. The exemption for
non-code features avoids blocking documentation and
config work on a test framework that doesn't exist yet.

## Technology Constraints

- **Runtime**: Expo SDK 55, React Native 0.83,
  React 19.2, TypeScript 5.9 (strict mode)
- **Router**: `expo-router` with typed routes enabled
- **Animations**: `react-native-reanimated` Keyframe
  API + `react-native-worklets`; no Animated API
- **Images**: `expo-image`; no built-in `Image`
  component for new code
- **Package manager**: pnpm with `nodeLinker: hoisted`
- **Compiler**: React Compiler enabled
  (`experiments.reactCompiler: true`)
- **Path aliases**: `@/*` → `./src/*`,
  `@/assets/*` → `./assets/*`

## Development Workflow

- Features follow the Spec Kit SDD lifecycle:
  specify → plan → tasks → implement
- The constitution MUST be consulted during the plan
  phase (Constitution Check in `plan-template.md`)
- Durable lessons are captured in `docs/memory/` only
  when evidenced, reusable, and non-obvious
- Feature memory (`specs/<feature>/memory.md` +
  `memory-synthesis.md`) MUST be maintained during
  active feature work and archived or discarded after
  merge

## Governance

This constitution supersedes conflicting conventions
found elsewhere in the repository. Amendments MUST be
documented with a version bump, rationale, and migration
plan for any affected in-progress work.

Version bumps follow semantic versioning:
- **MAJOR**: Principle removed or redefined incompatibly
- **MINOR**: New principle added or existing one
  materially expanded
- **PATCH**: Clarification, wording fix, or
  non-semantic refinement

All feature plans MUST pass the Constitution Check
gate before proceeding to task generation.

**Version**: 1.0.1 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25
