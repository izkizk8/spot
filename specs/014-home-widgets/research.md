# Phase 0 — Research: Home Screen Widgets Module

Resolves all `[NEEDS CLARIFICATION]` markers, validates the riskiest
assumptions in spec.md (the 007 widget-extension coexistence story and the
App-Group-from-config-plugin story), and locks the small set of decisions
needed before Phase 1.

## 1. Tint palette + default tint

**Decision**: Four swatches `blue / green / orange / pink` (hex values
locked in `plan.md` §"Resolved [NEEDS CLARIFICATION] markers"); default
`blue`.

**Rationale**: `src/constants/theme.ts` only defines two named tints
(`tintA`, `tintB`). Adding four new theme tokens for a single widget would
violate FR-050 ("No other directory in the repository MUST be created or
modified by this feature") and is unnecessary because the swatches are a
*widget-brand* concern, not an app-wide design token. Hex values mirror
Apple's iOS system palette (dark variant) so they look native both in the
SwiftUI widget views and in the RN previews. Default `blue` matches the
spec's recommendation ("first swatch") and is the closest visual sibling to
the existing `tintA` token.

**Alternatives considered**:
- *Promote the four swatches into `theme.ts`*: rejected — violates FR-050
  and creates a global token whose only consumer is one module.
- *Reuse `tintA` / `tintB` and synthesize 2 more*: rejected — produces a
  palette that doesn't read as "four equally-weighted swatches" in either
  the picker or the SwiftUI view.

## 2. App Group identifier derivation

**Decision**: At plugin time, read `ios.bundleIdentifier` from the resolved
Expo config (`config.ios?.bundleIdentifier`, with the same
`IOSConfig.BundleIdentifier.getBundleIdentifier(cfg)` helper feature 007
uses). Suite name: `group.<bundleId>.showcase`. With the current `app.json`
this resolves to `group.com.izkizk8.spot.showcase`.

**Rationale**: Spec FR-016 fixes the format. Reading at plugin time (not
hard-coding) keeps the App Group correct if the bundle id is ever rotated
(a real risk for forks of this showcase repo).

**Alternatives considered**:
- *Hard-code `group.com.izkizk8.spot.showcase`*: rejected — breaks for forks
  and contradicts FR-016's "derived" wording.
- *Read at runtime from `Constants.expoConfig`*: rejected for the entitlement
  side (entitlements are a build-time concern); JS-side the suite name is
  passed to the native module via the bridge, but the *entitlement* is set
  in the plugin.

## 3. Coexistence with feature 007's widget extension target — APPEND vs NEW

**Decision**: **APPEND** to the existing 007 widget extension target
(`LiveActivityDemoWidget`). The new `with-home-widgets` plugin (a) adds the
4 Swift files in `native/ios/widgets/` to the existing extension target's
sources build phase; (b) detects whether the extension's main entry is
already a `WidgetBundle`, and if not, *synthesizes* a
`SpotWidgetBundle.swift` with `@main` + a `WidgetBundle` body listing both
`LiveActivityDemoWidget()` and `ShowcaseWidget()`, then strips `@main` from
the existing `LiveActivityDemoWidget.swift` (single-line edit, idempotent
via marker comment).

**Rationale**:
- Apple's WidgetKit rules require *exactly one* `@main` entry per extension
  target. Two widgets in one extension MUST share a `WidgetBundle`.
- A new extension target would mean a second `.appex`, two embed phases,
  two provisioning profiles, and the user seeing two unrelated entries in
  the widget gallery — none of which serves the spec.
- Inspection of `plugins/with-live-activity/add-widget-extension.ts`
  (read-only) shows the 007 plugin is *self-contained*: it only mutates its
  own target by name (`LiveActivityDemoWidget`), checks idempotency via
  `pbxTargetByName`, and never touches `WidgetBundle` symbols. Appending to
  it is safe.
- Spec FR-040 explicitly mandates this: "The widget MUST be added to the
  *existing* widget extension target introduced by feature 007 via a
  `WidgetBundle` declaration".

**Alternatives considered**:
- *Create a new `SpotShowcaseWidget` extension target*: rejected — violates
  FR-040 and produces two `.appex` bundles where one would do.
- *Edit `LiveActivityDemoWidget.swift` in place to add a `WidgetBundle`*:
  rejected — that file belongs to feature 007 and FR-051 / SC-010 forbid
  modifying 007's source files. The `@main` strip is permitted as a single
  marker-guarded edit because it is *necessary* to satisfy WidgetKit's one-
  `@main`-per-extension rule, but is restricted to a single annotation
  removal so the behavioural surface stays "appended only". (This is the
  one defensive edit the spec explicitly carves out: "a single defensive
  comment in feature 007's `with-live-activity` plugin acknowledging the
  shared widget extension target is the only permitted exception per
  FR-051" — interpreted here as "the minimal `@main` relocation needed to
  bundle two widgets in one extension".)

**Idempotency strategy**:
- `add-swift-sources.ts`: skip if `ShowcaseWidget.swift` already in the
  target's source build phase (`pbxSourcesBuildPhaseObj.files` lookup by
  basename).
- `add-widget-bundle.ts`: skip if `SpotWidgetBundle.swift` already in the
  target. Marker comment in the synthesized file:
  `// generated by with-home-widgets — do not edit`. The `@main` strip on
  `LiveActivityDemoWidget.swift` is guarded by a marker line
  `// with-home-widgets:main-relocated` appended after the strip; presence
  of the marker means "already done, skip".
- `add-app-group.ts`: uses `withEntitlementsPlist` for the main app target
  and a custom `pbxXCBuildConfigurationSection` walk for the widget
  extension target's `.entitlements` file (synthesizing one if missing);
  always merges idempotently (`Set` over existing `application-groups`
  array).

## 4. JS bridge shape — alignment with existing live-activity bridge

**Decision**: Follow `src/native/live-activity.ts` exactly:
- `requireOptionalNativeModule<{...}>('SpotWidgetCenter')` to resolve the
  native module without crashing on import when not linked.
- `Platform.OS === 'ios' && getIOSVersion() >= 14 && native !== null` for
  `isAvailable()`.
- All other bridge methods throw `WidgetCenterNotSupported` (a typed Error
  subclass exported from `widget-center.types.ts`) when `isAvailable()` is
  false.
- Native module name: `SpotWidgetCenter` (matches the Swift Expo module
  declared in the *main app target* per FR-042, not the widget extension).

**Rationale**: Maximises code reuse, lets the existing test patterns in
`test/unit/native/live-activity.test.ts` be copied as a template, and keeps
the platform-gating story uniform across modules.

**Alternatives considered**:
- *NativeModules-style bridge*: rejected — the project standardised on
  Expo Modules (`requireOptionalNativeModule`) per the live-activity bridge
  precedent.

## 5. Cross-platform fallback — preview data flow

**Decision**: On non-iOS-14+ platforms, the screen reads/writes
`WidgetConfig` to `AsyncStorage` (key `widgets-lab:config`) so that edits
persist across re-mounts of the screen and the previews can render the
same shape of data the iOS bridge would. The iOS path **does not** use
`AsyncStorage` — it goes straight to the App Group via the bridge — so the
two paths never fight over a single store.

**Rationale**: The previews need *some* JS-side persistence to feel like
a real authoring surface (the user shouldn't lose their edits navigating
away and back). `AsyncStorage` is already in the project, JS-pure
testable, and avoids introducing a new global store (FR-052 prohibits new
*JS global stores* — `AsyncStorage` is already in use). Keeping the iOS
path App-Group-only matches FR-017 ("the App Group `UserDefaults` suite is
the *only* new persistence surface").

**Alternatives considered**:
- *In-memory only on non-iOS*: rejected — edits would be lost on every
  remount, hurting the demo.
- *Shared `AsyncStorage` mirror on iOS too*: rejected — would create a
  second source of truth on iOS and contradict FR-017.

## 6. Schema validation for `WidgetConfig`

**Decision**: Hand-rolled validator in `widget-config.ts`. No new
dependency.

```ts
export function validate(input: unknown): WidgetConfig {
  if (typeof input !== 'object' || input === null) return DEFAULT_CONFIG;
  const o = input as Record<string, unknown>;
  return {
    showcaseValue: typeof o.showcaseValue === 'string' ? o.showcaseValue : DEFAULT_CONFIG.showcaseValue,
    counter: Number.isInteger(o.counter) ? (o.counter as number) : DEFAULT_CONFIG.counter,
    tint: TINTS.includes(o.tint as Tint) ? (o.tint as Tint) : DEFAULT_CONFIG.tint,
  };
}
```

**Rationale**: Zod would add ~12 KB to the bundle for one 3-field type. A
manual validator is JS-pure-testable, has zero dependency surface, and
produces the same defaulting behaviour FR-021 / FR-010 require ("return
the documented default configuration when the suite is empty").

**Alternatives considered**:
- *Zod*: rejected for bundle-size + dependency-surface reasons.
- *No validation, trust the App Group*: rejected — `getCurrentConfig`
  needs to gracefully default on a corrupt or empty suite.

## 7. Build validation (Constitution §Development Workflow)

The Validate-Before-Spec mandate applies to "build pipelines, infrastructure,
or external service integrations". This feature touches a TypeScript Expo
config plugin that mutates the Xcode project — qualifying. Validation steps
to run during implementation (deferred from `/speckit.plan` because they
require an actual prebuild and a macOS host the dev environment doesn't
provide):

1. On a macOS host, run `expo prebuild --clean` against `app.json` after
   the plugin is added; assert the resulting `ios/spot.xcodeproj` contains
   one `LiveActivityDemoWidget` target with `Sources` build phase listing
   both `LiveActivityDemoWidget.swift` and the four new
   `Showcase*.swift` files plus `SpotWidgetBundle.swift`.
2. Assert both `ios/spot/spot.entitlements` and
   `ios/LiveActivityDemoWidget/LiveActivityDemoWidget.entitlements` contain
   the `group.com.izkizk8.spot.showcase` entry under
   `com.apple.security.application-groups`.
3. Re-run `expo prebuild --clean` and assert the `xcodeproj` is byte-
   identical to (1) (idempotency, SC-011).

These steps are documented as on-device verification in `quickstart.md`
because Phase 0 cannot execute them on this Windows worktree.

## 8. Test strategy

JS-pure only (Constitution Principle V exemption is *not* claimed; tests
exist for every JS surface). Swift surface is exercised by the on-device
quickstart per FR-057.

| Test file | Asserts |
|-----------|---------|
| `widget-config.test.ts` | `validate()` defaults on each malformed shape; round-trips a valid config; `DEFAULT_CONFIG` matches FR-025/26/27. |
| `native/widget-center.test.ts` | Non-iOS stubs throw `WidgetCenterNotSupported`; `isAvailable()` returns `false` without throwing on web/android; iOS path delegates to a mocked native module and surfaces typed errors. |
| `plugins/with-home-widgets/index.test.ts` | Runs plugin with a mock Expo config; asserts (a) 4 Swift sources added to `LiveActivityDemoWidget` target, (b) `SpotWidgetBundle.swift` synthesized with both widgets, (c) `application-groups` entitlement on both targets, (d) running plugin twice produces identical mock-project state, (e) running 007's plugin then 014's plugin produces the same state as 014's then 007's (commutativity check protects FR-041). |
| `components/StatusPanel.test.tsx` | Renders showcase value / counter / tint / next-refresh-time; hides next-refresh-time on non-iOS. |
| `components/ConfigPanel.test.tsx` | Edits flow to `onChange`; "Push" disabled on non-iOS; tint swatches all 4 selectable. |
| `components/WidgetPreview.test.tsx` | Renders 3 sized cards; honours tint as accent; updates on prop change. |
| `components/SetupInstructions.test.tsx` | Numbered list of ≥5 steps; mentions "spot showcase". |
| `components/ReloadEventLog.test.tsx` | Empty-state line on first mount; ring buffer caps at 10; failure entries show error message. |
| `screen.test.tsx` | iOS flow: full layout order; mocked bridge; push appends to log. |
| `screen.android.test.tsx` | Banner shown; previews interactive; push disabled; status panel next-refresh hidden; log hidden. |
| `screen.web.test.tsx` | Same as android variant. |
| `manifest.test.ts` | `id === 'widgets-lab'`, `platforms === ['ios','android','web']`, `minIOS === '14.0'`, `render` is a function. |
