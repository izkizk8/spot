# Project Plan (Durable Memory)

> Loaded by `memory-loader` before every Spec Kit lifecycle command.
> Consolidated technical context, dependencies, and structure decisions from all archived features.
> Updated by `/speckit.archive.run`.

## Tech Stack (locked-in)

| Layer | Choice | Pinned via | Rationale |
|-------|--------|------------|-----------|
| Runtime | **Expo SDK 55** | `package.json` | App framework |
| Router | `expo-router` (typed routes) | `app.json` `experiments.typedRoutes: true` | File-based routing |
| Language | **TypeScript 5.9 strict** | `tsconfig.json` | Strict mode + React Compiler |
| React | 19.2 + React Compiler enabled | `app.json` `experiments.reactCompiler: true` | Concurrent + auto-memo |
| Native | React Native 0.83.6 | `package.json` peer | Locked by Expo SDK 55 |
| Package mgr | **pnpm** with `nodeLinker: hoisted` | `pnpm-workspace.yaml` | Required for Expo |
| Format | `oxfmt@0.46.0` | `.oxfmtrc.json` | Fast Rust formatter |
| Lint (general) | `oxlint@1.61.0` | `oxlint.json` | Fast Rust linter |
| Lint (Hooks) | `eslint-plugin-react-hooks@7.1.1` + `eslint@10.2.1` + `typescript-eslint@8.59.0` | `eslint.config.js` | React Compiler-era rules OXC lacks |
| Test | `jest@29.7.0` + `jest-expo@55.0.16` + `@testing-library/react-native` | `jest.config.js` | Jest 30 blocked by `jest-expo` peer range |
| Build | `eas-cli` (global) | manual install | Cloud builds |
| Animations | `react-native-reanimated` + `react-native-worklets` | `package.json` | Worklet-based animations |

> See ADR [`0002`](../../docs/_decisions/0002-toolchain.md) for the full rationale.

## Project Structure

```
src/
  app/          file-based routes (expo-router)
    _layout.tsx     root layout, theme provider, tab nav mount
  components/   shared UI
    ThemedText, ThemedView (theme-aware wrappers)
    app-tabs.tsx (NativeTabs - native)
    app-tabs.web.tsx (custom Tabs - web)
    ui/          generic primitives
  constants/
    theme.ts        Colors, Fonts, Spacing, layout constants
  hooks/
    use-theme.ts        active color set
    use-color-scheme.{ts,web.ts}
test/
  setup.ts          shared mocks (run via jest-expo preset)
  unit/examples/    copyable patterns (TS logic, RN render, aliases)
specs/              SDD feature specs (one folder per feature)
docs/               three-class doc system (see docs/README.md)
.specify/           Spec Kit engine + extensions + memory
.github/            agent instructions, prompts, sub-agents
.eas/build/         custom EAS build YAMLs
```

## Path Aliases

| Alias | Maps to | Configured in |
|-------|---------|---------------|
| `@/*` | `./src/*` | `tsconfig.json`, `jest.config.js`, Babel |
| `@/assets/*` | `./assets/*` | same |

## Build Profiles (`eas.json`)

| Profile | Output | Credentials | When to use |
|---------|--------|-------------|-------------|
| `development` | iOS Simulator `.app` (.tar.gz) | None | Sim validation on macOS |
| `sideload` | Unsigned device `.ipa` (custom YAML) | None — uses `.eas/build/unsigned-ios.yml` | Free Windows → iPhone install via Sideloadly. See ADR [`0003`](../../docs/_decisions/0003-unsigned-ipa-custom-build.md). |
| `production` | Signed `.ipa` (App Store) | Paid Apple Developer ($99/yr) | Not used yet |

## Configuration Files (source of truth)

| File | Owns |
|------|------|
| `package.json` | Scripts, runtime deps |
| `tsconfig.json` | TS strict + path aliases |
| `app.json` | Expo config (typed routes, React Compiler, bundle ID) |
| `eas.json` | Build profiles |
| `.eas/build/unsigned-ios.yml` | Custom unsigned-IPA build pipeline |
| `oxlint.json`, `.oxfmtrc.json` | OXC config + ignorePatterns |
| `eslint.config.js` | React Hooks ESLint flat config |
| `jest.config.js` | Jest preset + alias mapping |
| `pnpm-workspace.yaml` | Hoisted linker |
| `.specify/extensions.yml` | Spec Kit hook registrations |

## Architecture Conventions

- **Native vs web split**: `.web.tsx` / `.web.ts` suffix — bundler picks per platform. Avoid inline `Platform.select()` for non-trivial diffs.
- **Tab navigation**: Native (`app-tabs.tsx`, NativeTabs) and web (`app-tabs.web.tsx`, custom `Tabs/TabList/TabTrigger/TabSlot` from `expo-router/ui`) are **two separate implementations**. Adding a tab requires editing both.
- **Theming**: `ThemedText` / `ThemedView` over raw `Text` / `View`. `useTheme()` hook for direct color access. `Spacing` scale (not raw px). `StyleSheet.create()` only — no CSS-in-JS, no utility-class framework (except `src/global.css` for web fonts).
- **Constitution gate**: every plan must pass the 5 principles in `constitution.md` before tasks are generated.

## Quality Gate

```
pnpm check  ≡  format:check + lint + typecheck + test
```

Required green before commit. Remote EAS scripts (`ios:ipa`, `ios:simulator`) excluded — they consume cloud quota.

---

**Last archive merge**: 2026-04-26 — features 001, 002, 004, 005
