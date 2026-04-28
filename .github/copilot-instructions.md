# Copilot Instructions

> **Outline only.** Detail lives in [`docs/`](../docs/README.md). Always link rather than inline.

## Quick Build & Run

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev server | `pnpm start` |
| Platform | `pnpm ios` / `pnpm android` / `pnpm web` |
| Format / Lint / Typecheck | `pnpm format` / `pnpm lint` / `pnpm typecheck` |
| Unit tests | `pnpm test` (Jest Expo + RNTL, configured under `test/unit/`) |
| Local quality gate | `pnpm check` |
| Documentation gate | `pnpm docs:check` |
| iOS unsigned IPA (sideload) | `pnpm ios:ipa` — see [docs/_howto/sideload-iphone.md](../docs/_howto/sideload-iphone.md) |

Toolchain detail: [docs/tooling_profile.md](../docs/tooling_profile.md) + ADR [0002](../docs/_decisions/0002-toolchain.md). `e2e/` is not configured.

## Stack at a Glance

- **Expo SDK 55** + **expo-router** (typed routes) + **React Compiler** + **TypeScript strict**
- Source under `src/`; aliases `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- Native vs web split via `.web.tsx` / `.web.ts` suffix (resolver picks automatically). Avoid inline `Platform.select()` for non-trivial differences.
- Tab nav uses **two separate implementations**: `app-tabs.tsx` (NativeTabs) and `app-tabs.web.tsx` (custom). Adding a tab requires editing **both**.
- Animations: `react-native-reanimated` + `react-native-worklets`.

Architecture deep-dive: [docs/architecture.md](../docs/architecture.md). Project overview: [docs/overview.md](../docs/overview.md).

## Conventions (must follow)

- Use `ThemedText` / `ThemedView` instead of raw `Text` / `View`. Use `useTheme()` for direct color access.
- Use `Spacing` scale from `src/constants/theme.ts` instead of raw pixel values.
- Styles via `StyleSheet.create()` only. No CSS-in-JS, no utility-class framework (except `src/global.css` for web fonts).
- Prefer single quotes in JS/TS/TSX code, including JSX attributes; JSON and other syntaxes with required double quotes keep their native quoting.
- Constitution (`.specify/memory/constitution.md` v1.1.0) gates every plan. Consult before architectural decisions.

## Agent-First Workflow

Spec Kit is the traceability core. Extensions and plugins strengthen phases, but the durable record remains spec/plan/tasks/memory/docs.

| Layer | What | When |
|-------|------|------|
| **Spec Kit core** (`.specify/`) | SDD lifecycle: `specify -> clarify -> plan -> tasks -> analyze -> implement -> verify/archive` | Every non-trivial change |
| **Spec Kit extensions** | 22 enabled extensions with 58 canonical extension commands | Validation, indexing, review, cleanup, orchestration, status |
| **Superpowers** (`obra/superpowers`) | 14 auto-invoked skills (TDD, debugging, code review, brainstorming...) | Engineering discipline inside a lifecycle phase |
| **`@context-architect`** | Multi-file change planning before edits | Complex multi-file work |
| **`@rug` → `@SWE` + `@QA`** | Decompose → delegate → validate orchestration | Large implementations |

### When to Use What

| Scenario | Reach For |
|----------|-----------|
| New feature (full lifecycle) | `/speckit.specify` → SDD workflow |
| Complex multi-file change | `@context-architect` first, then implement |
| Large task decomposition | `@rug` orchestrates `@SWE` + `@QA` |
| Bug investigation | Superpowers: systematic-debugging (auto) |
| Code review | Superpowers: requesting/receiving-code-review (auto) or `/speckit.review.run` |
| Quick fix (single file) | Direct edit — skip ceremony |
| "Where am I?" | `/speckit.status` (quick) or `/speckit.status-report.show` (rich) |
| Repo-wide indexing | `/speckit.repoindex.{overview,architecture,module}` |
| Health diagnostic | `/speckit.doctor.check` |
| Spec/plan/tasks drift | `/speckit.fix-findings.run` |
| Mid-implement commit | `/speckit.checkpoint.commit` |
| Cross-feature view | `/speckit.orchestrator.{status,conflicts}` |

Full extension catalog + decision matrix + hook map: [docs/sdd-extensions.md](../docs/sdd-extensions.md). Workflow diagrams + per-command details: [docs/speckit_profile.md](../docs/speckit_profile.md).

## Documentation System

| Layer | Path | Audience | Purpose |
|-------|------|----------|---------|
| **Instructions** (this file, `agents/*`, `prompts/*`) | `.github/` | Agents | Fast outline + links |
| **Docs** | `docs/` ([index](../docs/README.md)) | Humans + deep-dive agents | Detailed reference, generated indexes, guides |
| **README** | `README.md` | New humans | Orient + run |

Rules:
- Generated docs (repoindex output, etc.) live flat in `docs/`; file indexes live in `docs/_index/`.
- Decisions live in `docs/_decisions/`; external-tool walkthroughs live in `docs/_howto/`.
- `pnpm docs:check` verifies local doc links, generated-doc boundaries, JSON indexes, stale references, and CRLF line endings.
- Keep this file slim. New detail goes into `docs/` with a link added here.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/005-infra-tooling-upgrade/plan.md`

<!-- SPECKIT END -->
