# Project Specification (Durable Memory)

> Loaded by `memory-loader` before every Spec Kit lifecycle command.
> This file consolidates User Stories, Functional Requirements, and Key Entities from all archived features.
> Updated by `/speckit.archive.run`. Do not edit by hand for feature content — add new features through the SDD lifecycle and archive them.

## Product

**spot** — a universal **Expo SDK 55** app (iOS / Android / web) using `expo-router`, TypeScript strict, and React Compiler. Built agent-first using Spec Kit's SDD workflow.

## Constraints (project-wide)

- **Platforms**: iOS, Android, web — must remain compatible with all three
- **Toolchain**: pnpm hoisted, OXC format/lint, ESLint Hooks, Jest Expo (see ADR [`0002`](../../docs/_decisions/0002-toolchain.md))
- **Agent stack**: Spec Kit + Superpowers + Context Engineering + RUG (see ADR [`0001`](../../docs/_decisions/0001-agent-first-stack.md))
- **Doc system**: Three-class structure enforced by `doc-system.md` + PR template
- **Constitution**: 5 principles in `constitution.md` (v1.0.1) — gates every plan

---

## Consolidated Functional Requirements

### Documentation & Project Memory
*(from 001-fix-speckit-concerns)*

- **FR-001**: Durable project memory (`.specify/memory/*.md`) MUST contain real project content — no template placeholders.
- **FR-002**: Architecture documentation MUST be derived from actual codebase analysis (not invented).
- **FR-003**: All memory files are auto-loaded before every Spec Kit lifecycle command via `memory-loader`.

### SDD Workflow Discipline
*(from 001-fix-speckit-concerns, 002-remove-memory-md)*

- **FR-004**: Spec Kit `after_*` hooks for `specify | clarify | plan | tasks | implement | constitution | checklist | analyze` MUST auto-commit changes. `after_taskstoissues` stays disabled.
- **FR-005**: All `before_*` hooks MUST stay disabled to avoid committing unrelated work-in-progress.
- **FR-006**: Generated repo-index documents MUST accurately reflect current extension count, command count, and constitution status.
- **FR-007**: Only one tooling layer for project memory: `memory-loader` reading `.specify/memory/`. The `docs/memory/` layer and the `memory-md` extension are removed.

### EAS Build & iOS Sideload
*(from 004-eas-build-ipa)*

- **FR-008**: `eas.json` MUST define at least two profiles: `development` (simulator) and `sideload` (unsigned device IPA).
- **FR-009**: `app.json` MUST set `ios.bundleIdentifier` to `com.izkizk8.spot`.
- **FR-010**: The `sideload` profile MUST use a custom build YAML (`.eas/build/unsigned-ios.yml`) with `withoutCredentials: true` + `config: "unsigned-ios.yml"`. `withoutCredentials: true` alone is insufficient — the standard EAS pipeline always runs `IosCredentialsManager.prepare`. See ADR [`0003`](../../docs/_decisions/0003-unsigned-ipa-custom-build.md).
- **FR-011**: The unsigned IPA workflow MUST work from Windows with a free Apple ID (no $99/yr Developer Program). 7-day re-sign expected. See [how-to](../../docs/_howto/sideload-iphone.md).
- **FR-012**: `eas-cli` is a required global dependency.

### Toolchain & Quality Gates
*(from 005-infra-tooling-upgrade)*

- **FR-013**: `package.json` MUST expose scripts for: `start | android | ios | web | ios:ipa | ios:simulator | format | format:check | lint | lint:ox | lint:hooks | typecheck | test | test:watch | check`.
- **FR-014**: `pnpm check` aggregates `format:check + lint + typecheck + test`. It is the local quality gate before commit. Remote EAS scripts are excluded (cost/quota).
- **FR-015**: OXC (`oxfmt`, `oxlint`) is the primary formatter + general linter. Configured via `.oxfmtrc.json` and `oxlint.json`.
- **FR-016**: Official **`eslint-plugin-react-hooks`** MUST be retained as the source-of-truth React Hooks check (covers React Compiler-era rules OXC doesn't yet have: `set-state-in-effect`, `static-components`, `immutability`, `refs`, `purity`, `use-memo`).
- **FR-017**: TypeScript stays strict. `tsc --noEmit` is part of the gate.
- **FR-018**: Jest 29 + `jest-expo` preset + `@testing-library/react-native`. Jest 30 blocked by `jest-expo` peer range.
- **FR-019**: Test framework MUST include copyable examples for: TypeScript logic, RN component rendering, alias imports, mocks/setup. Examples live under `test/unit/examples/`.
- **FR-020**: Path aliases `@/*` → `./src/*` and `@/assets/*` → `./assets/*` MUST resolve in both `tsconfig.json` and `jest.config.js`.

### Agent Workflow
*(from 003-integrate-plugins, transitively)*

- **FR-021**: Each Spec Kit extension command MUST have a corresponding agent file (`.github/agents/`) and prompt file (`.github/prompts/`). No orphan aliases — alias entries live in `extension.yml` only.
- **FR-022**: Agent files MUST be canonical (`speckit.{module}.{command}.agent.md`); hyphenated alias variants MUST NOT exist as separate files.

---

## Key Entities

| Entity | Defined in | Purpose |
|--------|-----------|---------|
| **Constitution** | `.specify/memory/constitution.md` | 5 non-negotiable principles; gates `/speckit.plan` |
| **Feature spec** | `specs/NNN-feature-name/spec.md` | What & why for one feature |
| **Plan / tasks** | `specs/NNN-feature-name/{plan,tasks}.md` | How (tech choices, dependency-ordered work) |
| **Generated profile** | `docs/*.md` (flat) | Codebase-derived module reference; written by `/speckit.repoindex.*` |
| **ADR** | `docs/_decisions/NNNN-*.md` | Human judgement / tradeoff record |
| **How-to** | `docs/_howto/*.md` | External-tool walkthroughs |

---

## Edge Cases & Conventions

- Native vs web split via `.web.tsx` / `.web.ts` suffix — bundler resolves automatically. Avoid inline `Platform.select()` for non-trivial differences.
- Tab navigation: native uses `app-tabs.tsx` (NativeTabs), web uses `app-tabs.web.tsx` (custom). **Adding a tab requires editing both.**
- Theming: use `ThemedText` / `ThemedView` (not raw `Text` / `View`); use `Spacing` scale (not raw px); style via `StyleSheet.create()` only.
- Free Apple ID limits: 7-day cert, max 3 sideloaded apps, no push/iCloud/Sign-in capabilities.

---

**Last archive merge**: 2026-04-26 — features 001, 002, 004, 005
