# spot

A universal **Expo SDK 55** app (iOS / Android / web) built with `expo-router`, TypeScript strict, and the React Compiler. Developed agent-first using Spec Kit's SDD workflow.

## Quick Start

```bash
pnpm install
pnpm start            # Metro dev server
pnpm ios              # iOS simulator
pnpm android          # Android emulator
pnpm web              # Web
```

Quality gate before committing:

```bash
pnpm check            # format:check + lint + docs:check + typecheck + test
```

iOS device sideload (no Apple credentials needed):

```bash
pnpm ios:ipa          # builds unsigned IPA via EAS — see docs/_howto/sideload-iphone.md
```

OTA install + updates via [AltStore](https://altstore.io/) source: see [`docs/_howto/altstore-source.md`](docs/_howto/altstore-source.md).

## Project Layout

```
src/
  app/          file-based routes (expo-router)
  components/   shared UI (Themed*, app-tabs, ...)
  constants/    design tokens (Colors, Spacing, Fonts)
  hooks/        useTheme, useColorScheme
test/unit/      Jest Expo + React Native Testing Library
specs/          SDD feature specs (one folder per feature)
docs/           living documentation (start at docs/README.md)
.specify/       Spec Kit engine + extensions
.github/        agent instructions, prompts, sub-agents
```

## Documentation

Three layers, three audiences — see [`docs/README.md`](docs/README.md) for the full map.

| Need | Go To |
|------|-------|
| First-time orientation | this README |
| Tech stack, architecture, dependencies | [`docs/overview.md`](docs/overview.md) · [`architecture.md`](docs/architecture.md) |
| Build / lint / test toolchain | [`docs/tooling_profile.md`](docs/tooling_profile.md) + ADR [`0002`](docs/_decisions/0002-toolchain.md) |
| Sideloading an iOS build | [`docs/_howto/sideload-iphone.md`](docs/_howto/sideload-iphone.md) |
| Installing via AltStore source (OTA) | [`docs/_howto/altstore-source.md`](docs/_howto/altstore-source.md) |
| Working with the agent layer | [`docs/speckit_profile.md`](docs/speckit_profile.md) + [`sdd-extensions.md`](docs/sdd-extensions.md) + ADR [`0001`](docs/_decisions/0001-agent-first-stack.md) |
| Spec Kit commands, hooks, extensions | [`docs/speckit_profile.md`](docs/speckit_profile.md) · [`sdd-extensions.md`](docs/sdd-extensions.md) |

## Conventions

- Use `ThemedText` / `ThemedView` (not raw `Text` / `View`).
- Use `Spacing` scale from `src/constants/theme.ts` (no raw px).
- Native vs web split via `.web.tsx` suffix — bundler resolves automatically.
- Adding a tab requires editing **both** `src/components/app-tabs.tsx` and `app-tabs.web.tsx`.
- Project principles live in `.specify/memory/constitution.md` (v1.1.0) and gate every plan.

## Agent-First Development

This project is built using a stacked agent workflow. Spec Kit is the traceability core; extensions and plugins strengthen the lifecycle without replacing the spec/plan/tasks record.

| Layer | Tool | Purpose |
|-------|------|---------|
| Lifecycle core | **Spec Kit** (`/speckit.*`) | Spec -> plan -> tasks -> implement -> verify/archive |
| Capability layer | **Spec Kit extensions** | Repo indexing, validation, review, cleanup, orchestration, status |
| Engineering discipline | **Superpowers** (auto-invoked) | TDD, debugging, code review, brainstorming, verification |
| Multi-file planning | `@context-architect` | Map ripple effects before edits |
| Multi-agent orchestration | `@rug` -> `@SWE` + `@QA` | Decompose, delegate, verify |

For a typical feature: `/speckit.specify "..."` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze` → `/speckit.implement`.

Quick status: `/speckit.status` · Health check: `/speckit.doctor.check` · Full reference: [`docs/speckit_profile.md`](docs/speckit_profile.md) + [`sdd-extensions.md`](docs/sdd-extensions.md).

## License

See repository root for license details.
