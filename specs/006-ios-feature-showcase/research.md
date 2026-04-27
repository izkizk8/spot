# Phase 0 Research: iOS Feature Showcase

This document records the architectural decisions for the feature, the
rationale for each, and the alternatives considered. All `NEEDS
CLARIFICATION` items from the plan template are resolved here.

## R1. Theme preference persistence

- **Decision**: Use `@react-native-async-storage/async-storage` (added as a
  new dependency via `npx expo install`). Single key:
  `spot.theme.preference`. Value is one of `"system" | "light" | "dark"`.
  Read once at app boot inside a `ThemePreferenceProvider`; written on user
  selection. Persistence failures are caught and swallowed; the in-memory
  selection still applies for the session (FR-024).
- **Rationale**: AsyncStorage is the canonical Expo-supported local KV
  store for non-sensitive data, works uniformly on iOS / Android / web
  (web uses `localStorage` under the hood), and has zero native-link
  ceremony under Expo SDK 55. Theme preference does not need device
  encryption.
- **Alternatives considered**:
  - `expo-secure-store` — over-engineered; only available natively (no web
    parity), and theme preference is non-sensitive.
  - `expo-file-system` — heavier, requires JSON serialisation by hand,
    doesn't simplify anything.
  - In-memory only — fails FR-021 (must persist across restarts).

## R2. Module registry shape

- **Decision**: A typed `ModuleManifest` interface lives in
  `src/modules/types.ts`. Each module under `src/modules/<id>/` exports a
  default manifest from `index.ts`. A barrel `src/modules/registry.ts`
  imports each manifest and exports
  `export const MODULES: readonly ModuleManifest[] = [...]`.
  Order is the source-order of imports (deterministic per FR-007). Each
  manifest carries its own route component reference (`render: () =>
  ReactNode`). The Modules screen renders cards from `MODULES`; the
  detail screen at `app/modules/[id].tsx` looks up the manifest by `id`
  and calls `manifest.render()`.
- **Rationale**: Smallest possible registration surface (FR-008): create
  folder + add one import line. Static imports are tree-shakeable, type-
  checked, and surfaceable in the IDE — no dynamic require, no JSON
  manifest. Route dispatch through one `[id].tsx` keeps the router file
  count from growing per module while still using typed routes.
- **Alternatives considered**:
  - File-system convention discovery (e.g., import from
    `src/modules/*/index.ts` via a build step) — adds a build step; not
    statically typed; opaque to the IDE.
  - One `app/modules/<id>.tsx` per module — requires editing the router
    when adding modules, violating FR-008.
  - Runtime registry with a `register(manifest)` side-effecting call —
    order is non-deterministic and depends on bundler module evaluation.

## R3. Cross-platform Glass primitive

- **Decision**: Single `<Glass>` wrapper in `src/components/glass/`,
  resolved by the bundler via file suffixes:
  - `index.tsx` (iOS / default native): renders
    `expo-glass-effect`'s `<GlassView>` with the user-supplied props
    (intensity, tint, shape).
  - `index.android.tsx`: renders a `View` with `backgroundColor` set to
    an rgba derived from tint+intensity, `elevation` for material lift,
    and a 1 px subtle border for surface delineation.
  - `index.web.tsx`: renders a `View` with an inline style
    `{ backdropFilter: 'blur(<intensity>px)', WebkitBackdropFilter: ... }`
    (CSS feature unavailable in RN's `StyleSheet` typings; documented as
    the sole inline-style exception in this feature, contained to one
    file).
- **Rationale**: Honors Constitution III (file splitting over inline
  branching). Each platform's code stays self-contained and readable.
  `expo-glass-effect` is iOS-only; loading it on Android/web would crash,
  so file splitting is *required*, not stylistic.
- **Alternatives considered**:
  - Inline `Platform.select` inside one component — would require
    `require('expo-glass-effect')` guarded by `Platform.OS === 'ios'`,
    which Metro can still attempt to resolve at build time and which
    the constitution explicitly discourages.
  - A community polyfill — none exists with comparable fidelity to
    Apple's Liquid Glass; the spec already mandates documented fallbacks.

## R4. Liquid Glass Playground controls

- **Decision**: All controls are local component state inside
  `src/modules/liquid-glass-playground/screen.tsx`:
  - **Blur intensity**: a slider (0–100). Implementation uses
    `@react-native-community/slider` if already present, otherwise a
    minimal custom Pressable-based stepper to avoid adding a dependency.
    Investigation step in Phase 0 confirmed the package is *not*
    currently installed; we therefore ship a minimal in-house segmented
    intensity control (Low / Medium / High → 25 / 60 / 90) to keep the
    dependency surface tight. This still satisfies FR-015 ("changing any
    control MUST visibly update all interactive glass surfaces in real
    time").
  - **Tint**: a horizontal row of color chips (Pressable swatches) from
    `src/modules/liquid-glass-playground/tints.ts`.
  - **Shape**: a 3-segment control (rect / rounded / capsule) using
    Pressables styled via `StyleSheet`.
- **Rationale**: Keeps dependencies minimal, demonstrates the registry
  pattern with no extra library coupling, and satisfies the spec's "live
  controls" requirement.
- **Alternatives considered**: adopting `@react-native-community/slider`
  for true continuous blur. Rejected for this iteration to avoid a new
  native dep just for the demo; can be added in a follow-up spec.

## R5. Tabs (constitution-acknowledged duplication)

- **Decision**: Edit *both* `src/components/app-tabs.tsx` (NativeTabs) and
  `src/components/app-tabs.web.tsx` (custom web tabs) to add **Modules**
  and **Settings** alongside existing **Home** and **Explore**. Add a
  unit test `test/unit/shell/tab-parity.test.ts` that imports both
  modules, extracts the trigger names, and asserts the two arrays are
  equal.
- **Rationale**: The existing dual-tab pattern is intentional (NativeTabs
  uses Apple's UITabBar; custom web tabs render bespoke UI). The
  duplication is a constitutional cross-platform-parity necessity;
  drift between the two files has historically been the failure mode.
  A unit test eliminates this class of bug at lint speed.
- **Alternatives considered**: a higher-order configuration object that
  both files import. Rejected because it would force one file to render
  trigger metadata declaratively in a way that NativeTabs' JSX-children
  API resists, and would add an abstraction the rest of the project
  doesn't need.

## R6. Theme provider design

- **Decision**: New `ThemePreferenceProvider` (Context) wraps the app in
  `src/app/_layout.tsx`. It exposes
  `{ preference: 'system' | 'light' | 'dark', setPreference }` plus the
  derived `effectiveScheme: 'light' | 'dark'`. `useTheme()` is extended
  to consume the provider's `effectiveScheme` instead of always calling
  `useColorScheme()`. Existing call sites of `useTheme()`, `ThemedText`,
  `ThemedView` keep their signatures unchanged.
- **Rationale**: Minimum surface area; no breaking change to existing
  consumers. Honors FR-022 (System mode follows OS) and FR-023
  (explicit Light/Dark ignores OS) by computing `effectiveScheme`
  conditionally on `preference`.
- **Alternatives considered**: a Zustand / Redux store. Rejected as
  unnecessary for one piece of UI state; React Context is sufficient
  and adds no dependencies.

## R7. Routing

- **Decision**: `expo-router` typed routes already enabled. Add:
  - `src/app/modules/index.tsx` → `/modules`
  - `src/app/modules/[id].tsx` → `/modules/[id]` (dynamic)
  - `src/app/settings.tsx` → `/settings`
  Tab triggers reference these via typed hrefs. The dynamic module
  screen calls `useLocalSearchParams<{ id: string }>()`, looks the id
  up in `MODULES`, and either renders `manifest.render()` or, if the
  id is unknown or unsupported on the current platform, renders a
  graceful "not available" view (FR-010, edge case).
- **Rationale**: One dynamic route keeps the file system flat as
  modules grow. Typed routes give compile-time guarantees against bad
  hrefs.
- **Alternatives considered**: a route per module, generated at build
  time. Rejected — defeats FR-008.

## R8. Test plan

- **Decision**: Four Jest unit tests under `test/unit/`:
  1. `modules/registry.test.ts` — `MODULES` is non-empty in production
     order, contains `liquid-glass-playground`, and ids are unique.
  2. `modules/manifest.test.ts` — every registered manifest passes a
     runtime validator (id non-empty, platforms ⊆ {ios, android, web},
     `render` is a function, `minIOS` if present is a valid version).
  3. `modules/platform-filtering.test.tsx` — render the Modules grid
     under iOS / Android / web mocks and assert the unsupported badge
     and non-crashing tap behavior.
  4. `theme/preference.test.tsx` — exercise the preference reducer
     (`system` → `light` → `dark` transitions), assert the
     AsyncStorage write is invoked, and assert that read-failure /
     write-failure does not throw (FR-024).
  5. `shell/tab-parity.test.ts` — imports both `app-tabs.tsx` and
     `app-tabs.web.tsx`, extracts trigger names, asserts equality.
- **Rationale**: Aligns one-to-one with the spec's measurable behaviors
  the constitution requires tests for (FR-027). All five fit the
  existing `test/unit/**` jest pattern.
- **Alternatives considered**: a full RNTL render of the live shell.
  Rejected as scope creep; the listed unit tests cover the contractual
  behaviors without requiring full-stack render plumbing.

## R9. Performance

- **Decision**: Reanimated 4 + Worklets is already the project's
  animation primitive. The Liquid Glass Playground will animate
  blur/tint/shape changes via `withTiming` shared values where the
  platform supports continuous values, and via plain state for the
  segmented controls. Home hero entrance uses Reanimated `Keyframe`
  per the constitution.
- **Rationale**: Keeps animation work on the UI thread. SC-001/2/3 are
  trivially satisfied for a 3-tab shell with one demo screen.

## R10. Out of scope (recorded for traceability)

- Live Activities, Dynamic Island, push notifications, Widget Extension —
  deferred to future specs.
- Additional modules beyond Liquid Glass Playground — the *registry*
  must support them but no second module ships in this spec.
- Internationalization beyond default English.
- Any backend, networking, accounts, or remote storage.
