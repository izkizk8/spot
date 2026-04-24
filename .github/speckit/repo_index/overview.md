# spot

## Introduction

**spot** is a cross-platform mobile and web application built with **Expo SDK 55** and **React Native 0.83**. It targets iOS, Android, and the web from a single TypeScript codebase using file-based routing via `expo-router`. The project is in its early starter-app phase and ships two screens — a **Home** landing page with an animated Expo logo and getting-started hints, and an **Explore** page with collapsible documentation links.

The repository follows an **agent-first development workflow** using **Spec Kit 0.8.1** for Specification-Driven Development (SDD). A ratified **constitution (v1.0.1)** enforces 5 principles: Cross-Platform Parity, Token-Based Theming, Platform File Splitting, StyleSheet Discipline, and Test-First for New Features. **22 Copilot agent commands** drive the full lifecycle from specification through retrospective.

## Project Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript 5.9 (strict mode) |
| **UI Framework** | React 19.2 / React Native 0.83 |
| **App Framework** | Expo SDK 55 (`expo-router` with typed routes) |
| **Animations** | `react-native-reanimated` 4.2 + `react-native-worklets` 0.7 |
| **Navigation** | `@react-navigation/native` 7 / `@react-navigation/bottom-tabs` 7 |
| **Images** | `expo-image` |
| **Package Manager** | pnpm (nodeLinker: hoisted) |
| **Compiler** | React Compiler enabled (`experiments.reactCompiler: true`) |
| **Build Tool** | Expo CLI / Metro bundler |
| **AI Workflow** | Spec Kit 0.8.1 with 6 extensions, 22 Copilot agents |

### Source Layout

```
src/
├── app/                  # Route screens (file-based routing)
│   ├── _layout.tsx       # Root layout — ThemeProvider + tab navigator
│   ├── index.tsx         # Home screen
│   └── explore.tsx       # Explore screen
├── components/           # Shared UI components
│   ├── animated-icon.tsx / .web.tsx   # Animated Expo logo (platform-split)
│   ├── app-tabs.tsx      / .web.tsx   # Tab navigation (platform-split)
│   ├── external-link.tsx              # In-app browser link wrapper
│   ├── hint-row.tsx                   # Key-value hint row
│   ├── themed-text.tsx                # Theme-aware Text wrapper
│   ├── themed-view.tsx                # Theme-aware View wrapper
│   ├── web-badge.tsx                  # Expo version badge (web only)
│   └── ui/
│       └── collapsible.tsx            # Animated collapsible section
├── constants/
│   └── theme.ts          # Design tokens: Colors, Fonts, Spacing, layout constants
├── hooks/
│   ├── use-color-scheme.ts / .web.ts  # Color scheme hook (platform-split)
│   └── use-theme.ts                   # Returns active light/dark color set
├── types/                # Shared TypeScript types (empty)
└── global.css            # Web font-face declarations
```

### Project Governance & Memory

```
.specify/memory/
└── constitution.md       # v1.0.1 — 5 principles + governance rules

specs/
└── 001-fix-speckit-concerns/   # First completed feature (28/28 tasks, 100% adherence)
    ├── spec.md, plan.md, tasks.md, research.md, data-model.md
    ├── quickstart.md, retrospective.md
    └── checklists/requirements.md
```

### Architecture Diagram

```mermaid
flowchart TB
    subgraph Entry["Entry Point"]
        ExpoRouter["expo-router/entry<br/>(package.json main)"]
    end

    subgraph Layout["Root Layout (_layout.tsx)"]
        ThemeProvider["ThemeProvider<br/>(light / dark)"]
        SplashOverlay["AnimatedSplashOverlay"]
        AppTabs["AppTabs"]
    end

    subgraph Screens["Route Screens"]
        Home["index.tsx<br/>Home Screen"]
        Explore["explore.tsx<br/>Explore Screen"]
    end

    subgraph SharedComponents["Shared Components"]
        ThemedText["ThemedText"]
        ThemedView["ThemedView"]
        HintRow["HintRow"]
        ExternalLink["ExternalLink"]
        Collapsible["Collapsible"]
        WebBadge["WebBadge"]
    end

    subgraph DesignSystem["Design System"]
        ThemeTokens["theme.ts<br/>Colors · Fonts · Spacing"]
        UseTheme["useTheme()"]
        UseColorScheme["useColorScheme()"]
    end

    ExpoRouter --> ThemeProvider
    ThemeProvider --> SplashOverlay
    ThemeProvider --> AppTabs
    AppTabs --> Home
    AppTabs --> Explore

    Home --> ThemedText & ThemedView & HintRow & WebBadge
    Explore --> ThemedText & ThemedView & Collapsible & ExternalLink & WebBadge

    ThemedText --> UseTheme
    ThemedView --> UseTheme
    UseTheme --> UseColorScheme
    UseTheme --> ThemeTokens
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **`_layout.tsx`** | Root layout wrapping the app in `ThemeProvider` and rendering `AnimatedSplashOverlay` + `AppTabs`. |
| **`AppTabs`** | Platform-split tab navigator. Native uses `NativeTabs` from `expo-router/unstable-native-tabs`; web uses a custom tab bar from `expo-router/ui`. |
| **`AnimatedSplashOverlay`** | Full-screen splash that scales down and fades out via `react-native-reanimated` Keyframe animations. |
| **`ThemedText` / `ThemedView`** | Theme-aware wrappers that apply colors from the `Colors` token set via `useTheme()`. |
| **`useTheme()`** | Hook returning the active `Colors.light` or `Colors.dark` object. |
| **`Collapsible`** | Animated expand/collapse section using `FadeIn` from reanimated. |

### Platform-Specific Strategy

The project uses the **`.web.tsx` / `.web.ts` suffix convention** — Metro/webpack automatically resolve the web variant:

| File Pair | Native | Web |
|-----------|--------|-----|
| `animated-icon` | Reanimated Keyframe + expo-image | CSS module animation |
| `app-tabs` | `NativeTabs` (expo-router) | Custom `Tabs`/`TabList` (expo-router/ui) |
| `use-color-scheme` | RN `useColorScheme` re-export | Hydration-safe wrapper |

### Theming & Design Tokens

Defined in `src/constants/theme.ts`:

- **Colors**: Light/dark palettes with `text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`
- **Fonts**: Per-platform font families (`sans`, `serif`, `rounded`, `mono`)
- **Spacing scale**: `half` (2) → `one` (4) → `two` (8) → `three` (16) → `four` (24) → `five` (32) → `six` (64)
- **Layout constants**: `MaxContentWidth` (800px), `BottomTabInset` (iOS: 50, Android: 80)

## AI Development Workflow

This project uses **Spec Kit** for AI-driven Specification-Driven Development. The full lifecycle:

```
/speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement → /speckit.retrospective.analyze
```

**22 Copilot agent commands** organized in 6 categories:

| Category | Commands | Purpose |
|----------|----------|---------|
| Core SDD | 9 | specify, clarify, plan, tasks, implement, analyze, checklist, constitution, taskstoissues |
| Git Workflow | 5 | initialize, feature branch, validate, remote, auto-commit |
| Memory | 1 | memory-loader (auto-loads context before every command) |
| Repo Index | 3 | overview, architecture, module |
| Post-Implementation | 2 | retrospective, archive |
| Status | 2 | status, status.show |

**Constitution v1.0.1** enforces: Cross-Platform Parity, Token-Based Theming, Platform File Splitting, StyleSheet Discipline, Test-First for New Features (with docs-only exemption).

See [speckit_profile.md](speckit_profile.md) for the complete command reference and workflow details.

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 18+ (LTS recommended) |
| **pnpm** | 8+ |
| **Expo CLI** | Bundled via `npx expo` |
| **iOS Simulator** | Xcode 15+ (macOS only) |
| **Android Emulator** | Android Studio / SDK 34+ |

### Configuration

- **`app.json`** — Expo configuration: app name, slug, icons, splash screen, plugins, experiments
- **`tsconfig.json`** — TypeScript strict mode, path aliases (`@/*` → `./src/*`, `@/assets/*` → `./assets/*`)
- **`pnpm-workspace.yaml`** — `nodeLinker: hoisted` for Expo/RN compatibility
- **`.specify/memory/constitution.md`** — Project principles (v1.0.1)

No `.env` files or secrets are required for local development.

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url> spot && cd spot

# 2. Install dependencies
pnpm install

# 3. Start the development server
npx expo start
```

### Running the Application

| Command | Description |
|---------|-------------|
| `pnpm start` / `npx expo start` | Start Expo dev server (all platforms) |
| `npx expo start --ios` | Launch on iOS Simulator |
| `npx expo start --android` | Launch on Android Emulator |
| `npx expo start --web` | Launch in browser |
| `npx expo lint` | Run linter |
| `npm run reset-project` | Move starter code to `app-example/` and create blank `app/` |

### AI Workflow Quick Start

```bash
# Start a new feature
/speckit.specify "add user authentication"

# Refine the spec
/speckit.clarify

# Generate implementation plan
/speckit.plan

# Generate task list
/speckit.tasks

# Check consistency
/speckit.analyze

# Execute implementation
/speckit.implement

# Post-implementation review
/speckit.retrospective.analyze

# Check project status anytime
/speckit.status
```

### Deployment

No deployment pipeline is configured yet. The app supports:
- **Web**: Static output (`web.output: "static"` in app.json)
- **iOS/Android**: Via Expo EAS Build (not yet configured)

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router — File-Based Routing](https://docs.expo.dev/router/introduction/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Spec Kit Workflow Reference](speckit_profile.md)
- [Architecture Deep Dive](architecture.md)

---

**Generated**: April 25, 2026 (refreshed) | **Spec Kit Extension**: repoindex v1.0.0
