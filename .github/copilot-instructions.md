# Copilot Instructions

## Build & Run

- **Package manager**: pnpm (with `nodeLinker: hoisted`)
- **Install**: `pnpm install`
- **Start dev server**: `npx expo start`
- **Lint**: `npx expo lint`
- **Platform targets**: `npx expo start --ios`, `--android`, `--web`

No test framework is configured yet. The `test/` and `e2e/` directories exist but are empty.

## Agent-First Tooling

This project uses an agent-first development workflow:

- **Superpowers plugin**: Engineering methodology skills (TDD, debugging, code review) — install with `copilot plugin install obra/superpowers`.
- **Spec Kit** (`.specify/`): Specification-Driven Development. Use `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` slash commands for the SDD workflow.
- **Constitution**: Project principles live in `.specify/memory/constitution.md`. Consult before making architectural decisions.

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
<!-- SPECKIT END -->
