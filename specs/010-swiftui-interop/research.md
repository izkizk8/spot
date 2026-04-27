# Phase 0 Research: SwiftUI Interop Showcase

All NEEDS CLARIFICATION items from the spec resolved here. The single
remaining external unknown — exact `@expo/ui/swift-ui` API surface — is
explicitly delegated to the implement-phase agent via the
`Expo-UI-SwiftUI` skill (see Decision 1).

## Decision 1: Library — `@expo/ui/swift-ui`

- **Decision**: Use `@expo/ui/swift-ui` from the `@expo/ui` package as
  the sole source of SwiftUI views (FR-021). Add the dependency with
  `npx expo install @expo/ui` (verified: `@expo/ui` is **not** in
  `package.json` as of this plan).
- **Rationale**: It is the only Expo-supported way to mount real
  SwiftUI views from React Native without writing custom Swift bridging
  code. The spec explicitly excludes hand-written SwiftUI files and
  custom native modules (Out of Scope, FR-021). The project ships an
  `Expo-UI-SwiftUI` skill that documents the exact import paths,
  component names, and prop/callback shapes — this is the authoritative
  reference and supersedes any examples in this plan.
- **Implement-phase requirement**: Before writing any
  `@expo/ui/swift-ui` import, the agent MUST invoke the
  `Expo-UI-SwiftUI` skill via the `skill` tool to:
  1. Confirm the exact import path (`@expo/ui/swift-ui` vs subpath).
  2. Confirm the exported names of Picker, ColorPicker, DatePicker,
     Slider, Stepper, Toggle.
  3. Confirm each control's value prop, change-callback prop name
     (e.g. `onChange` vs `onValueChange` vs `onSelectionChange`), and
     value type (e.g. `Date` instance, hex string, integer).
  4. Confirm sizing / layout behavior (the spec accepts library
     defaults — Out of Scope).
- **Alternatives considered**:
  - Hand-written SwiftUI in a custom Expo Modules package — rejected
    by FR-021.
  - `react-native-segmented-control` / RN-only "iOS-styled" widgets —
    explicitly rejected by the spec's framing ("not React Native
    components styled to look iOS-like").
  - `expo-modules-core` ad-hoc bridging — rejected by FR-021 and by
    the additive-only constraint (SC-006).

## Decision 2: Module location and file layout

- **Decision**: `src/modules/swiftui-interop/` with `index.tsx`
  (manifest), `screen.tsx`, and a `demos/` subdirectory containing
  five `*Demo.tsx` files. Per-platform fallbacks use sibling
  `.android.tsx` / `.web.tsx` files (Metro platform-resolver pattern).
- **Rationale**: Matches `src/modules/sf-symbols-lab/` and
  `src/modules/liquid-glass-playground/` for module shape, and matches
  `src/components/glass/` (`index.tsx` / `index.android.tsx` /
  `index.web.tsx`) for the platform-split pattern that proved
  sufficient to keep `expo-glass-effect` out of non-iOS bundles. By
  copying that exact layout we keep `@expo/ui/swift-ui` out of the
  Android/Web bundles **by construction**.
- **Alternatives considered**:
  - Inline `Platform.OS` ladders inside one `screen.tsx` — rejected
    by Constitution principle III (file splitting required for
    non-trivial differences).
  - `Platform.select()` of two component refs — same reason; also
    risks accidentally importing `@expo/ui/swift-ui` at module
    eval time on non-iOS.

## Decision 3: Manifest fields

- **Decision**: `platforms: ['ios','android','web']`,
  `minIOS: '16.0'`, `id: 'swiftui-interop'`, title `'SwiftUI Interop'`,
  description one-liner, icon `{ ios: <SF Symbol TBD by skill or
  reasonable default e.g. 'swift'>, fallback: '🟦' }`. The card is
  visible on every platform; per-platform UX divergence happens inside
  the screen.
- **Rationale**: Spec FR-001 / FR-002 require the card to be visible
  on all three platforms; the iOS-version gate is enforced by the
  existing registry's `minIOS` check. Setting `platforms` to all three
  ensures the Android/Web fallback screens are reachable — these are
  user-facing acceptance scenarios (Stories 2 and 3), not error
  states.
- **Alternatives considered**:
  - `platforms: ['ios']` only — rejected: would hide the card on
    Android/Web and contradict Stories 2 & 3.
  - Omit `minIOS` and let `@expo/ui/swift-ui` fail at runtime —
    rejected by Edge Case "iOS 15 or earlier" and by the spec's
    explicit gating expectation.

## Decision 4: Test strategy on Windows host (no native runtime)

- **Decision**: Jest tests are JS-only. Three flavors per demo:
  1. **iOS test** (`PickerDemo.test.tsx`): default platform; `jest.mock('@expo/ui/swift-ui')` returns a host-View stand-in that records its `onChange` prop. The test fires the captured callback and asserts the RN echo (text/swatch/bar) updates.
  2. **Android test** (`PickerDemo.android.test.tsx`): explicit-filename import of `./PickerDemo.android` (bypasses Jest's iOS-default platform resolver — the same trick used by `test/unit/components/glass/index.android.test.tsx`); also `jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not be imported on android') })` so any accidental import fails the test loudly.
  3. **Web test** (`PickerDemo.web.test.tsx`): symmetric to Android, importing `./PickerDemo.web` directly with the same throw-on-import mock.
- **Rationale**: The exact pattern is already in
  `test/unit/components/glass/index.android.test.tsx` (line 8:
  `import { Glass } from '@/components/glass/index.android';`). It
  works under the project's existing Jest config without needing a
  multi-environment runner. The throw-on-import mock provides a hard
  guarantee for FR-014 / FR-017 that pure file-tree inspection cannot.
- **Manual verification**: Real SwiftUI rendering and round-trip
  timing (SC-002 <100 ms) cannot be validated under Jest. Steps for
  on-device validation are in `quickstart.md`.
- **Alternatives considered**:
  - `jest-expo` multi-platform projects — overkill; existing pattern
    works and adds no tooling (FR-024).
  - Detox / Maestro e2e — out of scope for this feature.

## Decision 5: RN fallback components

- **Decision**: Use only RN/RN-Web primitives already viable in the
  project (no new native deps unless the implement-phase skill consult
  reveals one is required for parity):
  - **Picker fallback**: a small segmented row of `Pressable` chips
    backed by `ThemedView` (same pattern as
    `liquid-glass-playground/screen.tsx` shape selector). Avoids
    adding `@react-native-picker/picker`.
  - **ColorPicker fallback (Android)**: a fixed swatch grid of
    `Pressable` tiles selecting from a small palette.
  - **ColorPicker fallback (Web)**: a thin wrapper around
    `<input type="color" />` rendered via a host element (RN-Web
    permits this with a small `View as="input"` shim or a direct
    `createElement('input', …)` inside the `.web.tsx`).
  - **DatePicker fallback (Android)**: read-only `ThemedText` showing
    the current value plus +1 day / −1 day `Pressable` chips. Keeps
    the demo deterministic without new deps.
  - **DatePicker fallback (Web)**: `<input type="date" />` host
    element.
  - **Slider fallback**: a row of segmented chips representing
    discrete buckets (0/25/50/75/100). Drives the same RN bar width.
  - **Stepper/Toggle fallback**: `Pressable` − / + chips for the
    stepper, RN `Switch` for the toggle.
- **Rationale**: All available without new deps; matches the existing
  showcase modules' chip/segmented vocabulary; satisfies "interactive
  fallback content" (Stories 2 & 3) without adding native deps that
  could break the additive-only invariant (SC-006).
- **Alternatives considered**:
  - `@react-native-community/slider` for the Android fallback —
    nice-to-have but adds a dep; chip-based fallback satisfies the
    spec ("RN fallback equivalents…") without one. Implementer MAY
    upgrade if approved during implement; recorded here as a
    deliberate downscope.

## Decision 6: Color normalisation

- **Decision**: Normalise the SwiftUI `ColorPicker` value to an
  RN-style string (preferring `rgba(r,g,b,a)`; accepting `#rrggbb`)
  before applying it as a `backgroundColor` style value (Edge Case in
  spec). The implement-phase skill consult must confirm the exact
  emitted format; a small `toRNColor(value)` helper inside
  `ColorPickerDemo.tsx` handles known formats and falls back to a
  safe default if the value is unrecognised.
- **Rationale**: The spec explicitly calls out this edge case;
  isolating the conversion in one helper keeps the rest of the demo
  unaware of the SwiftUI value shape.
- **Alternatives considered**:
  - Trusting the raw value — rejected by the edge case requirement.

## Decision 7: State scope

- **Decision**: All state is local component state (`useState`) inside
  each `*Demo.tsx`. No context, no Zustand store, no AsyncStorage,
  no router params (FR-022 + Out of Scope: persistence).
- **Rationale**: Matches the spec; matches existing modules
  (`liquid-glass-playground/screen.tsx` uses plain `useState` for all
  controls). Keeps each demo independently testable.
- **Alternatives considered**: A shared `useInteropState` reducer —
  rejected: would couple the demos and complicate per-demo unit
  tests.

## Decision 8: Quality gates

- **Decision**: `pnpm check` (defined in `package.json` as
  `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`)
  must pass with zero warnings introduced (SC-007).
- **Rationale**: Single project-wide gate, no new tooling required
  (FR-024).
- **Alternatives considered**: A module-scoped gate — rejected:
  the project already runs `pnpm check` as the canonical gate.

## Open items deferred to implement phase (skill-dependent)

These are intentionally *not* resolved here because the
`Expo-UI-SwiftUI` skill is the authoritative source. The
implement-phase agent resolves them on first contact with the API:

1. Exact import path: `@expo/ui/swift-ui` named export tree.
2. Exact prop names per control (`selection` vs `value`; `onChange`
   vs `onValueChange` vs `onSelectionChange`).
3. Whether `DatePicker` returns a JS `Date` or an ISO string.
4. Whether `ColorPicker` returns a hex string, an `rgba()` string,
   or an object — informs the `toRNColor` helper in Decision 6.
5. Whether `Stepper` / `Toggle` ship as a single combined view or
   two separate views (the spec accepts either).

If any of these resolve in a way that materially contradicts the spec
(e.g. no `onChange` callback exists for some control), back-patch the
spec per the constitution's Spec back-patching workflow before
implementing.

## API surface (resolved at implement time)

**Source**: `Expo-UI-SwiftUI` skill invoked 2026-04-28 during T002.

**Key findings**:
- Components imported from `@expo/ui/swift-ui`
- Modifiers imported from `@expo/ui/swift-ui/modifiers`
- All SwiftUI trees must be wrapped in `Host` component
- Use `RNHostView` to embed RN components inside SwiftUI trees
- Each component's exact API documented at `https://docs.expo.dev/versions/v55.0.0/sdk/ui/swift-ui/{component-name}/index.md`

**Implementation notes**:
- Will fetch per-component docs as needed during implementation
- The skill confirms general structure matches plan assumptions
- No spec back-patching required based on skill output
