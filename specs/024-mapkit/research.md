# Phase 0 Research: MapKit Lab Module

## Scope

Resolve every NEEDS CLARIFICATION (none in spec; spec is approved) and
validate the assumptions baked into spec/plan before task generation.

## 1. Dependency selection — `npx expo install`

**Decision**: install `react-native-maps` and `expo-location` in a
single `npx expo install react-native-maps expo-location` invocation
against the project's pinned Expo SDK 55.

**Rationale**: `npx expo install` consults the SDK 55 manifest (the
"Expo Doctor"-known compatible version table) and writes a
SDK-aligned version string to `package.json`. Both packages are first-
party in the Expo ecosystem and have published SDK 55 entries:

- `react-native-maps` is the de facto Expo-blessed map library for
  React Native; under SDK 55 the resolver picks the `^1.20.x` line
  at time of writing (the actual version is whatever the resolver
  emits — the plan deliberately does not pre-pin a floating range
  so the lockfile remains the single source of truth).
- `expo-location` is an Expo SDK module; under SDK 55 the resolver
  picks the `~19.x.x` line (same caveat).

**Alternatives considered**:

- `react-native-mapbox-gl` — out of scope (paid tier required for
  full MapKit-equivalent feature set; would require an account and
  a token; spec explicitly demonstrates Apple MapKit through
  `react-native-maps`).
- Pinning exact versions in `plan.md` — rejected because that drifts
  from the SDK resolver and creates a stale-version foot-gun on
  every Expo SDK bump.

## 2. MapKit API choices

### 2.1 `MKLocalSearch`

**Decision**: use `MKLocalSearch.Request` with `naturalLanguageQuery`
+ region constraint, awaited via `try await MKLocalSearch(request:
request).start()`.

**Rationale**: simplest one-shot search surface; matches the spec's
"text input + Search button" UX. No completer / suggestion stream is
needed because the spec explicitly demonstrates region-scoped local
search (FR-011), not as-you-type completion.

**Alternatives considered**:

- `MKLocalSearchCompleter` — produces incremental suggestions;
  out of scope (spec only requires submit-driven search).

### 2.2 `MKLookAroundSceneRequest` + `MKLookAroundViewController`

**Decision**: `if #available(iOS 16.0, *)` — request a scene for the
target coordinate; on success present `MKLookAroundViewController`
modally on the key window's topmost presented view controller. On
older iOS, resolve `{ shown: false }`.

**Rationale**: matches Apple's documented LookAround presentation
flow; one-shape JS result.

**Alternatives considered**:

- Returning a typed "unsupported-os" discriminated kind to JS —
  rejected; the JS contract is simpler with a single shape and the
  `iosVersionAtLeast16` derivation already lives in `screen.tsx`.

### 2.3 Default fallback region for Recenter

**Decision**: continental US bounding box centered around (39.5,
-98.35) with `latDelta: 35`, `lngDelta: 50`.

**Rationale**: a single value documented in `landmarks.ts` keeps the
"no location permission" path deterministic and visually obvious
(the user sees the whole CONUS rather than a black map).

**Alternatives considered**:

- World view (latDelta 90, lngDelta 180) — rejected; in CRS
  projection at extreme spans the map shows distortion artifacts.
- Per-locale fallback — rejected; spec is explicit that a single
  documented constant is sufficient.

## 3. Mock strategy

**Decision**: four new global mocks under `test/__mocks__/`:

- `react-native-maps.tsx` — `MapView`, `Marker`, `Polyline` as
  testID-tagged `View`s preserving children; imperative
  `animateToRegion` captured on a recorder.
- `expo-location.ts` — three programmable async functions.
- `native-mapkit-search.ts` — `requireOptionalNativeModule` resolver
  + per-call result/throw injection.
- `native-lookaround.ts` — same shape.

All four are wired in `test/setup.ts` next to the existing
`native-keychain` mock from feature 023.

**Rationale**: matches the established 021/022/023 global-mock
convention. Keeps the test suite JS-pure (NFR-007) and gives both
the per-platform bridge tests and the component tests a single
injection point.

**Alternatives considered**:

- Per-test-file inline mocks — rejected; would duplicate setup
  across 14+ files and break the convention.

## 4. Per-platform-file pattern (vs. lazy `Platform.OS`)

**Decision**: every JS bridge file in `src/native/` uses the
`.ios.ts` / `.android.ts` / `.web.ts` triple. The bundler picks the
right file per platform; no `Platform.OS` branch lives inside the
bridge files.

**Rationale**: explicit per spec NFR-008; matches Constitution III
("Non-trivial platform differences MUST use the `.web.tsx` /
`.web.ts` file suffix convention rather than inline
`Platform.select()` or `Platform.OS` branches"). Existing examples
in `src/native/coreml.*`, `screentime.*`, `speech-recognition.*`,
`speech-synthesis.*`, `vision-detector.*`, `widget-center.*`,
`live-activity.*`.

**Alternatives considered**:

- The `keychain.ts` lazy-resolver style (single file with a runtime
  `Platform.OS` switch) — rejected for this feature because spec
  NFR-008 explicitly forbids inline platform mocking in the test
  suite for this module.

## 5. Build Validation (Constitution v1.1.0)

**Validation steps for Phase 0**:

1. `npx expo install react-native-maps expo-location` → observe
   `package.json` and `pnpm-lock.yaml` updated; `pnpm install` exits
   clean.
2. `pnpm typecheck` → `tsc --noEmit` exits 0; the new packages'
   types satisfy `strict: true`.
3. `pnpm lint` → no new violations against `oxlint` and the
   `eslint-plugin-react-hooks` rules used by `pnpm lint:hooks`.

**Justification**: this is the smallest "validate the integration"
loop that makes sense before tasks. The Swift bridges follow the
exact pattern feature 023 already validated end-to-end (custom dev
client autolinking + `MapKit.podspec` + `expo-module.config.json`);
no new build pipeline is introduced. The two new pnpm dependencies
are managed by Expo's SDK resolver, which is the established
integration-validation mechanism for this codebase.

**Risks if skipped**: a major-version drift in `react-native-maps`
between SDK 55 minor releases could change required props on
`MapView`; catching that at install + typecheck time is much cheaper
than catching it during component test authoring.

## 6. Plugin coexistence

**Decision**: the new plugin is appended to `app.json` `plugins`
**before** the inline-configured `expo-sensors` array, so the
configured-array entry remains the trailing element of the array
(matches existing convention).

**Validation in test**: the `with-mapkit/index.test.ts` coexistence
test loads `app.json`, asserts `plugins.length === 15` (3 baseline
Expo plugins + 11 in-tree custom plugins + 1 inline-configured
`expo-sensors`), asserts `'./plugins/with-mapkit'` is in the array
exactly once, and runs the full mod chain (importing every
`./plugins/with-*` default export and folding them over a baseline
`ExpoConfig`) without throwing.

## 7. Out-of-scope confirmations (no research needed)

- Custom tile overlays / `MKTileOverlay` — explicitly out of scope.
- Directions (`MKDirections`) — out of scope.
- Clustering — out of scope; pins render individually.
- Camera pitch + heading — out of scope; only 2D map types via the
  toolbar.
- Custom annotation views — out of scope; default markers only.
- Persistence — in-memory for the lifetime of the screen.
- Background location — only when-in-use permission.
- Bottom-sheet library — fixed pinned panel only.
- Web map rendering — placeholder only.

## 8. Open questions

**None.** All assumptions in spec §Assumptions are either validated
above (§1, §3, §5, §6) or are deferred-to-runtime (the two custom
Swift bridges' iOS-version behavior is gated at the bridge layer
and tested via the mock).
