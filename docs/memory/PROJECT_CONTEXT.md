# Project Context

Last reviewed: 2026-04-25

## Product / Service
spot is a cross-platform mobile and web application built with Expo SDK 55 and React Native. It targets iOS, Android, and the web from a single TypeScript codebase using file-based routing via expo-router. The project is in its early starter-app phase with two screens (Home and Explore) and uses an agent-first development workflow with Spec Kit for Specification-Driven Development.

## Key Constraints
- Expo SDK 55 with React Native 0.83 and React 19.2 — all features must work within this stack
- Three-platform target: iOS, Android, and Web — every feature must work on all three
- TypeScript 5.9 in strict mode with React Compiler enabled
- pnpm with nodeLinker: hoisted — required for Expo/RN compatibility
- No test framework configured yet — test infrastructure is a prerequisite for future features
- expo-router/unstable-native-tabs is an unstable API — may break on SDK upgrades
- Constitution v1.0.0 ratified: Cross-Platform Parity, Token-Based Theming, Platform File Splitting, StyleSheet Discipline, Test-First for New Features

## Important Domains
- Cross-platform UI rendering (iOS, Android, Web)
- Design system / theming (light/dark mode, spacing tokens)
- File-based routing and navigation
- Animation (react-native-reanimated, worklets)

## Current Priorities
- Set up foundational project infrastructure (testing, linting, CI/CD)
- Populate Spec Kit memory and governance layers
- Begin feature development using the SDD workflow

## Keep Here
- durable product constraints
- domain language and invariants
- project-wide priorities that shape feature tradeoffs

## Never Store Here
- feature-specific acceptance criteria
- task lists
- transient implementation notes
- changelog entries

Update the review date when constraints or priorities materially change.
