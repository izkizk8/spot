# Architecture

Last reviewed: 2026-04-25

## System Overview
Expo SDK 55 app using expo-router for file-based routing with typed routes. Source code lives under src/. Three-layer presentation architecture: Navigation (expo-router + platform-split tab bars), Component (themed UI primitives), Token (Colors, Fonts, Spacing from theme.ts). No data layer, API layer, or state management beyond React component state.

## Major Components
- src/app/ — Route screens (_layout.tsx, index.tsx, explore.tsx). _layout.tsx wraps app in ThemeProvider + AnimatedSplashOverlay + AppTabs.
- src/components/ — Shared UI: ThemedText (8 type variants), ThemedView (token-based backgrounds), AnimatedIcon/AnimatedSplashOverlay (reanimated Keyframe), HintRow, ExternalLink, Collapsible, WebBadge. ui/ contains generic primitives.
- src/components/app-tabs.tsx / app-tabs.web.tsx — Platform-split tab navigation. Native: NativeTabs (expo-router/unstable-native-tabs). Web: custom Tabs/TabList/TabTrigger/TabSlot.
- src/constants/theme.ts — Design tokens: Colors (light/dark), Fonts (per-platform), Spacing scale (2–64), BottomTabInset, MaxContentWidth.
- src/hooks/ — useTheme() returns active Colors[scheme]; useColorScheme() with .web.ts hydration guard.

## Boundaries
- src/app/ (routes) depends on src/components/ and src/hooks/ — never the reverse
- src/components/ depends on src/constants/theme.ts and src/hooks/ — never on src/app/
- src/constants/ and src/hooks/ are leaf modules — no cross-dependencies
- Platform-specific behavior is isolated via .web.tsx file suffix convention
- .specify/ (Spec Kit) and .github/ (agents/prompts) are workflow tooling — not runtime code

## Integrations
- Expo SDK services: expo-image, expo-symbols, expo-device, expo-web-browser, expo-splash-screen, expo-font, expo-constants
- react-native-reanimated 4.x + react-native-worklets 0.7 for UI-thread animations
- @react-navigation/native 7 for ThemeProvider and navigation state
- Spec Kit 0.8.1.dev0 with 7 extensions (git, memory-loader, memory-md, repoindex, archive, retrospective, status)

## Risks / Complexity Hotspots
- expo-router/unstable-native-tabs is an unstable API — may break on Expo SDK upgrades
- 5+ unused dependencies (expo-glass-effect, expo-font, expo-constants, expo-status-bar, expo-linking) — declared but not imported
- No test framework configured — test/ and test-results/ directories are empty
- No error boundaries — a crash in any component unmounts the entire app
- No ESLint config committed — linting available via npx expo lint but not enforced

## Keep Here
- stable system boundaries
- ownership lines between modules or services
- integration constraints that affect many features

## Never Store Here
- step-by-step implementation plans
- one-off feature details
- stale diagrams without current boundaries

Update the review date when boundaries, ownership, or integrations materially change.
