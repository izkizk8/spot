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
| iOS unsigned IPA (sideload) | `pnpm ios:ipa` — see [docs/_howto/sideload-iphone.md](../docs/_howto/sideload-iphone.md) |

Toolchain detail: `package.json` scripts + ADR [0002](../docs/_decisions/0002-toolchain.md) (a generated `tooling_profile.md` is pending). `e2e/` exists but has no runner.

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
- Constitution (`.specify/memory/constitution.md` v1.0.1) gates every plan. Consult before architectural decisions.

## Agent-First Workflow

Three layers stacked on Spec Kit's SDD lifecycle:

| Layer | What | When |
|-------|------|------|
| **Spec Kit** (`.specify/`) | 22 core commands + 17 community extensions driving `specify → plan → tasks → implement` | Every non-trivial change |
| **Superpowers** (`obra/superpowers`) | 14 auto-invoked skills (TDD, debugging, code review, brainstorming...) | Triggered by task match |
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
- Generated docs (repoindex output, etc.) live in `docs/`.
- Hand-written guides live directly under `docs/`.
- Keep this file slim. New detail goes into `docs/` with a link added here.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/005-infra-tooling-upgrade/plan.md`

<!-- SPECKIT END -->
