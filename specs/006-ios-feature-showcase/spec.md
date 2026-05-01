# Feature Specification: iOS Feature Showcase

**Feature Branch**: `006-ios-feature-showcase`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Useless-but-delightful showcase app demonstrating modern iOS platform features. Polished cross-platform shell + plugin/module architecture; first module is a Liquid Glass Playground using `expo-glass-effect`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Be wowed on first launch (Priority: P1)

A curious iPhone user opens the app for the first time. The Home tab greets them with a polished, theme-aware hero showcase that feels distinctly iOS — smooth motion, modern typography, and tactile surfaces — communicating immediately that the app exists to delight and demonstrate platform capabilities, not to solve a productivity problem.

**Why this priority**: The app's reason for existing is delight. If the first screen is not impressive, no other capability matters. The core shell must look great even before any module is installed, so this is the foundation everyone else builds on.

**Independent Test**: Launch the app on iOS, Android, and web with zero modules registered. Verify Home tab renders a coherent, theme-aware hero showcase on every platform without errors. Verify Modules tab gracefully shows an empty state. Verify Settings tab is reachable.

**Acceptance Scenarios**:

1. **Given** a fresh launch on iPhone in system theme, **When** the user lands on the Home tab, **Then** they see a polished hero showcase using themed surfaces and the existing `Spacing` scale, with smooth entrance motion.
2. **Given** the module registry is empty, **When** the user opens the Modules tab, **Then** they see a non-broken, friendly empty state instead of an error.
3. **Given** the user is on Android or web, **When** they open the app, **Then** they see a coherent (not broken) variant of the Home tab consistent with the platform's affordances.

---

### User Story 2 - Explore and tweak the Liquid Glass Playground (Priority: P1)

A user taps the Modules tab, sees a "Liquid Glass Playground" card, opens it, and experiments with multiple interactive glass surfaces — adjusting blur intensity, tint, and shape — watching each surface react smoothly in real time. On Android they see a translucent material fallback; on web they see a CSS `backdrop-filter` fallback; the experience is coherent everywhere but most dazzling on iOS.

**Why this priority**: This is the first concrete "wow" capability the app ships with and the proof that the plugin architecture works end-to-end. Without it, the Modules tab is theoretical.

**Independent Test**: From the Modules tab, open the Liquid Glass Playground module. Adjust blur, tint, and shape controls. Confirm at least three glass surfaces visibly respond to each control change. Repeat on Android and web; confirm the documented fallback renders without crashing.

**Acceptance Scenarios**:

1. **Given** the Liquid Glass Playground module is registered, **When** the user opens the Modules tab on iOS, **Then** they see a card showing the module's title, description, and SF Symbol icon, marked as supported on the current platform.
2. **Given** the user opens the Liquid Glass Playground on iOS, **When** they change blur intensity, tint, or shape, **Then** all interactive glass surfaces update live with smooth transitions.
3. **Given** the user opens the Liquid Glass Playground on Android, **When** the screen renders, **Then** glass surfaces fall back to a translucent material treatment without runtime errors.
4. **Given** the user opens the Liquid Glass Playground on web, **When** the screen renders, **Then** glass surfaces fall back to a CSS `backdrop-filter` treatment without runtime errors.

---

### User Story 3 - Switch theme and see everything follow (Priority: P2)

A user opens Settings, picks Light, Dark, or System theme, and every surface in the app — the Home hero, the Modules grid, and any open module screen — updates immediately and consistently. Their choice persists across app restarts.

**Why this priority**: Theme switching is table-stakes for a polished iOS app and exercises the design-token system end-to-end across the shell and modules. It validates that modules correctly consume the shared theme.

**Independent Test**: From Settings, toggle through System / Light / Dark. Verify Home, Modules, and the Liquid Glass Playground all reflect the selected theme without restart. Kill and relaunch the app; verify the previously chosen preference is restored.

**Acceptance Scenarios**:

1. **Given** the user is in Settings, **When** they pick Light, Dark, or System, **Then** every visible surface across Home, Modules, and any open module updates immediately.
2. **Given** the user picked Dark and then quit the app, **When** they relaunch, **Then** the app starts in Dark.
3. **Given** the user picked System, **When** the OS appearance changes, **Then** the app follows the OS appearance without further user action.

---

### User Story 4 - Add a future module by dropping in a folder (Priority: P3)

A developer adds a new "wow" capability (e.g., a future Haptics Playground) by creating a self-contained module folder that exports a manifest conforming to the registry's typed interface, then adding a single import line to register it. Nothing else in the shell changes. The new module appears in the Modules grid with its declared metadata and platform support badges.

**Why this priority**: This is the long-term value proposition of the architecture. It does not need to ship as a finished second module in this spec, but the registry and manifest contract must be designed and demonstrated to support it.

**Independent Test**: Author a no-op stub module with a valid manifest. Register it with one import line. Verify it appears in the Modules grid with correct title, description, icon, and platform badges, and that opening it routes to its screen — all without modifying any shell file other than the registration import.

**Acceptance Scenarios**:

1. **Given** the registry interface is published, **When** a developer adds a new module folder and one registration import, **Then** the module appears in the Modules grid with the metadata declared in its manifest.
2. **Given** a module declares it supports only iOS, **When** the user views the Modules grid on Android or web, **Then** the card is visibly marked as unsupported on the current platform and tapping it does not crash.

---

### Edge Cases

- **Empty registry**: Modules tab MUST render a friendly empty state, not a blank screen or error.
- **Unsupported-platform module**: Module declared `ios`-only MUST appear in the grid on Android/web with a visible "iOS only" badge and MUST NOT crash if the user taps it (either the card is non-interactive or it routes to a graceful "not supported on this platform" screen).
- **Minimum iOS version not met**: A module declaring `minIOS` higher than the device's iOS version MUST be visibly marked as unavailable and MUST NOT attempt to load its native dependencies.
- **Module screen crash isolation**: A runtime error inside a module screen MUST NOT take down the shell; the user MUST be able to navigate back to Modules.
- **Theme preference storage failure**: If persisting the theme preference fails, the app MUST still apply the user's selection for the current session and MUST NOT crash.
- **Tab parity drift**: Adding a tab MUST require updating both `app-tabs.tsx` (native NativeTabs) and `app-tabs.web.tsx` (custom web tabs); a missing tab on one platform is a defect.
- **System appearance change while in non-System mode**: When the user has explicitly chosen Light or Dark, OS appearance changes MUST be ignored.

## Requirements *(mandatory)*

### Functional Requirements

#### Core shell

- **FR-001**: The app MUST present three top-level tabs — Home, Modules, Settings — on both native (via the existing `app-tabs.tsx` NativeTabs pattern) and web (via the existing `app-tabs.web.tsx` custom tab pattern).
- **FR-002**: The Home tab MUST render a polished, theme-aware hero showcase that looks coherent and intentional on iOS, Android, and web, even when zero modules are registered.
- **FR-003**: All shell surfaces MUST use `ThemedText` and `ThemedView` rather than raw `Text`/`View`, and MUST source spacing from the `Spacing` scale in `src/constants/theme.ts`.
- **FR-004**: All styles in this feature MUST use `StyleSheet.create()`; no inline style objects defined outside `StyleSheet`, no CSS-in-JS, no utility-class frameworks (web font-face declarations in `src/global.css` remain the sole exception).
- **FR-005**: Non-trivial platform differences MUST use the `.web.tsx` / `.web.ts` file-splitting convention rather than inline `Platform.select`/`Platform.OS` branching.

#### Module registry & manifest

- **FR-006**: The app MUST expose a typed module manifest interface declaring at minimum: `id` (stable string), `title`, `description`, `icon` (SF Symbol name on iOS with a documented fallback identifier for Android/web), `platforms` (subset of `ios | android | web`), optional `minIOS`, and a routing entry that resolves to an `expo-router` screen.
- **FR-007**: A central registry MUST collect all registered modules and expose them to the Modules tab in a deterministic order.
- **FR-008**: Adding a new module MUST require only (a) creating a self-contained module folder and (b) adding a single registration import line; no edits to the Home tab, Settings tab, or unrelated module folders MUST be required.
- **FR-009**: The Modules tab MUST render a grid of cards driven entirely by the registry contents, showing each module's title, description, icon, and a platform-support badge derived from `platforms` and the current platform.
- **FR-010**: Modules unsupported on the current platform MUST be visibly marked (e.g., "iOS only") and MUST NOT crash if the user interacts with their card.
- **FR-011**: Tapping a supported module's card MUST navigate to that module's screen via `expo-router`'s typed-routes mechanism.
- **FR-012**: An empty registry MUST result in a friendly empty state on the Modules tab, not an error.

#### Liquid Glass Playground module (first module)

- **FR-013**: The app MUST ship one registered module, "Liquid Glass Playground", whose manifest declares iOS as primary and Android + web as supported with documented fallbacks.
- **FR-014**: On iOS, the Liquid Glass Playground MUST present at least three distinct interactive glass surfaces using `expo-glass-effect`.
- **FR-015**: The Liquid Glass Playground MUST expose live controls for blur intensity, tint, and shape; changing any control MUST visibly update all interactive glass surfaces in real time.
- **FR-016**: On Android, the Liquid Glass Playground MUST render glass surfaces as a translucent material fallback without runtime errors.
- **FR-017**: On web, the Liquid Glass Playground MUST render glass surfaces using CSS `backdrop-filter` without runtime errors.
- **FR-018**: The Liquid Glass Playground module folder MUST be self-contained — its native-only code MUST NOT be imported by the shell or by other modules.

#### Settings & theme

- **FR-019**: The Settings tab MUST present a theme switcher with three options: System, Light, Dark.
- **FR-020**: Selecting a theme MUST immediately update every visible surface across Home, Modules, and any open module screen.
- **FR-021**: The selected theme preference MUST persist across app restarts using local on-device storage.
- **FR-022**: When System is selected, the app MUST follow the OS appearance and react to OS appearance changes without further user action.
- **FR-023**: When Light or Dark is explicitly selected, the app MUST ignore subsequent OS appearance changes for the lifetime of that selection.
- **FR-024**: If persisting the theme preference fails, the app MUST still apply the user's selection for the current session and MUST NOT crash.

#### Cross-platform parity

- **FR-025**: Every screen introduced by this feature MUST render without runtime errors on iOS, Android, and web.
- **FR-026**: Adding or removing a tab MUST be reflected in both `app-tabs.tsx` and `app-tabs.web.tsx`; a tab present in only one of the two is a defect.

#### Quality gates

- **FR-027**: The feature MUST include automated tests (jest-expo + React Native Testing Library) covering the acceptance scenarios for the Modules grid (including unsupported-platform marking) and the theme switcher (including persistence).
- **FR-028**: `pnpm check` (format, lint, typecheck, jest) MUST pass cleanly with this feature merged.

### Key Entities *(include if feature involves data)*

- **Module Manifest**: The typed contract every module exports. Attributes: stable `id`, human `title`, short `description`, `icon` (SF Symbol name with cross-platform fallback identifier), `platforms` (set drawn from `ios | android | web`), optional `minIOS` version, and a routing entry pointing at the module's `expo-router` screen.
- **Module Registry**: The in-memory, deterministic collection of registered Module Manifests. Sole authority consumed by the Modules tab. New modules join by importing themselves into the registry's bootstrap.
- **Theme Preference**: A persisted user choice with one of three values (`system`, `light`, `dark`). Read at app start, written when the user changes the Settings switcher, and observed by every themed surface.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a fresh install on iPhone, a user reaches the Home tab and sees the polished hero showcase in under 3 seconds from tap-to-launch.
- **SC-002**: From the Modules tab, a user can open the Liquid Glass Playground and observe at least three glass surfaces reacting live to blur, tint, and shape controls within one continuous session of under 30 seconds.
- **SC-003**: Changing the theme in Settings updates every visible surface (Home, Modules, any open module) within 500 ms and with no visible flicker or partial-update artifacts.
- **SC-004**: The selected theme preference is restored on 100% of app relaunches under normal conditions.
- **SC-005**: All four user stories (Home wow, Liquid Glass Playground, theme switching, registry extensibility) are demonstrable on iOS; user stories 1, 3, and the platform-fallback paths of user story 2 are demonstrable on Android and web without runtime errors.
- **SC-006**: A new stub module can be added by a developer in under 10 minutes by creating one folder and adding one registration import, with no edits to the Home tab, Settings tab, or other module folders.
- **SC-007**: `pnpm check` (format, lint, typecheck, jest) passes cleanly on the merged feature branch.
- **SC-008**: No module screen runtime error can take down the shell; the user can always navigate back to the Modules tab.

## Assumptions

- The user-supplied description is authoritative and sufficient; no follow-up clarifications were requested per the user's instruction to proceed autonomously.
- "Polished hero showcase" content (copy, imagery, motion) will be designed during implementation; this spec does not prescribe specific visuals beyond the requirement that it be theme-aware, motion-rich, and consistent with the existing `Spacing` and `ThemedText`/`ThemedView` system.
- `expo-glass-effect` is already a project dependency and will be used as-is on iOS; concrete fallback implementations on Android (translucent material surface) and web (CSS `backdrop-filter`) will be finalised in the plan phase.
- The persistence mechanism for theme preference (AsyncStorage vs `expo-secure-store`) will be selected during the plan phase; the spec only requires that persistence work and degrade gracefully on failure.
- Out of scope and deferred to future specs: Live Activities, Dynamic Island, push notifications, accounts, networking, persistence beyond the local theme preference, internationalization beyond default English, any backend, and any modules beyond the Liquid Glass Playground.
- The constitution at `.specify/memory/constitution.md` (v1.1.0) governs this feature; cross-platform parity, token-based theming, platform file splitting, StyleSheet discipline, and test-first are all assumed binding.
- Path aliases `@/*` → `./src/*` and `@/assets/*` → `./assets/*` are stable and will be used by all new code.
- Existing `app-tabs.tsx` (native NativeTabs) and `app-tabs.web.tsx` (custom web tabs) are the canonical tab implementations; both will be edited together when adding the Modules and Settings tabs.
