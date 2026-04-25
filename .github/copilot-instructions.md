# Copilot Instructions

## Build & Run

- **Package manager**: pnpm (with `nodeLinker: hoisted`)
- **Install**: `pnpm install`
- **Start dev server**: `pnpm start`
- **Platform targets**: `pnpm ios`, `pnpm android`, `pnpm web`
- **Format**: `pnpm format` / `pnpm format:check` (OXC formatter)
- **Lint**: `pnpm lint` (OXC lint plus official React Hooks ESLint rules)
- **Typecheck**: `pnpm typecheck`
- **Unit tests**: `pnpm test` / `pnpm test:watch` (Jest Expo + React Native Testing Library)
- **Full local quality gate**: `pnpm check`
- **iOS simulator build**: `pnpm ios:simulator`
- **iOS unsigned IPA (sideload)**: `pnpm ios:ipa` (free, no Apple credentials — uses custom build YAML; remote/quota-consuming)
- **iOS device testing (quick)**: Use Expo Go — `pnpm start`, scan QR on iPhone
- **Sideloading guide**: See [docs/eas-build-guide.md](docs/eas-build-guide.md) for unsigned IPA → Sideloadly → iPhone workflow

The unit test framework is configured under `test/unit/` with executable examples and shared setup in `test/setup.ts`. The `e2e/` directory exists but does not have a configured runner yet.

## Agent-First Tooling

This project uses an agent-first development workflow with three layers:

### Plugins (installed)

| Plugin                                                            | What It Provides                                                                                                                                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec Kit** (`.specify/`)                                        | SDD lifecycle: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`. 22 commands, 6 extensions. See [speckit_profile.md](./speckit/repo_index/speckit_profile.md) for full reference. |
| **Superpowers** (`obra/superpowers`)                              | 14 engineering skills: TDD, systematic debugging, brainstorming, writing plans, code review, verification, parallel agents, subagent-driven dev, git worktrees, skill writing. Auto-invoked when relevant.      |
| **Context Engineering** (`context-engineering@awesome-copilot`)   | `@context-architect` agent for multi-file change planning — identifies relevant files, dependency graphs, ripple effects before edits.                                                                          |
| **RUG Agentic Workflow** (`rug-agentic-workflow@awesome-copilot`) | `@rug` orchestrator agent — decomposes work, delegates to `@SWE` and `@QA` subagents, validates outcomes. Never writes code itself.                                                                             |

### Constitution

Project principles live in `.specify/memory/constitution.md` (v1.0.1). Consult before making architectural decisions. See [speckit_profile.md](./speckit/repo_index/speckit_profile.md) for the 5 principles.

### When to Use Which Agent

| Scenario                     | Agent/Command                                                |
| ---------------------------- | ------------------------------------------------------------ |
| New feature (full lifecycle) | `/speckit.specify` → SDD workflow                            |
| Complex multi-file change    | `@context-architect` first, then implement                   |
| Large task decomposition     | `@rug` to orchestrate `@SWE` + `@QA`                         |
| Bug investigation            | Superpowers: systematic-debugging (auto-invoked)             |
| Code review                  | Superpowers: requesting-code-review / receiving-code-review  |
| Quick fix (single file)      | Direct edit — no ceremony needed                             |
| Repo understanding           | `/speckit.repoindex.overview` or `/speckit.repoindex.module` |
| Project status               | `/speckit.status`                                            |

### Documentation Index

| Document                                                      | What It Contains                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [speckit_profile.md](./speckit/repo_index/speckit_profile.md) | Complete command reference, workflow diagrams, hook config, constitution     |
| [overview.md](./speckit/repo_index/overview.md)               | Project overview, tech stack, getting started, architecture diagram          |
| [architecture.md](./speckit/repo_index/architecture.md)       | Deep architecture analysis, components, dependencies, performance, tech debt |

## Architecture

This is an **Expo SDK 55** app using **expo-router** for file-based routing with **typed routes** enabled. Source code lives under `src/`.

### Source layout

- `src/app/` — Route screens. `_layout.tsx` is the root layout with theme provider and tab navigation.
- `src/components/` — Shared UI components. `ui/` contains generic primitives (e.g., `Collapsible`).
- `src/constants/theme.ts` — Central design tokens: `Colors` (light/dark), `Fonts` (per-platform), `Spacing` scale, and layout constants like `MaxContentWidth` and `BottomTabInset`.
- `src/hooks/` — Custom hooks including `useTheme()` (returns active color set) and `useColorScheme()`.

### Platform-specific files

The project uses the **`.web.tsx` / `.web.ts` suffix convention** for web-specific implementations. The bundler automatically resolves these. Examples:

- `animated-icon.tsx` (native) / `animated-icon.web.tsx` (web)
- `app-tabs.tsx` (native) / `app-tabs.web.tsx` (web)
- `use-color-scheme.ts` (native) / `use-color-scheme.web.ts` (web)

When adding platform-specific behavior, create a `.web.tsx` variant rather than using inline `Platform.select()` for non-trivial differences.

### Tab navigation

Native and web use entirely different tab implementations:

- **Native**: `NativeTabs` from `expo-router/unstable-native-tabs` (in `app-tabs.tsx`)
- **Web**: Custom tab bar built with `Tabs`/`TabList`/`TabTrigger`/`TabSlot` from `expo-router/ui` (in `app-tabs.web.tsx`)

Adding a new tab requires updating **both** files.

## Conventions

### Theming

Use `ThemedText` and `ThemedView` instead of raw `Text` and `View`. These wrappers apply theme colors through their `type` and `themeColor` props, pulling values from `Colors` in `src/constants/theme.ts`.

For direct color access in components, use the `useTheme()` hook which returns the active light/dark color set.

### Spacing & layout

Use the `Spacing` scale from `src/constants/theme.ts` (`Spacing.one` = 4, `Spacing.two` = 8, etc.) instead of raw pixel values.

### Styling

Use React Native `StyleSheet.create()` for all styles. No CSS-in-JS library or utility-class framework is used (except `src/global.css` for web font declarations).

### Path aliases

- `@/*` → `./src/*`
- `@/assets/*` → `./assets/*`

### TypeScript

Strict mode is enabled. The React Compiler is also enabled (`experiments.reactCompiler: true` in `app.json`).

### Animations

Animations use `react-native-reanimated` (Keyframe API, `FadeIn`, etc.) and `react-native-worklets` for worklet scheduling.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/005-infra-tooling-upgrade/plan.md`

<!-- SPECKIT END -->
