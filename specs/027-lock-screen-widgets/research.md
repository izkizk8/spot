# Phase 0 — Research: Lock Screen Widgets Module

Locks the small set of decisions still needed at plan time, validates
the riskiest assumption (the marker-guarded `WidgetBundle` insertion
into 014-owned source), and captures the alternatives considered. All
15 spec-level open questions were already pre-resolved in
`spec.md` §"Open Questions (resolved)"; this document covers
**plan-level** decisions on top of those.

## 1. WidgetKit accessory families API on iOS 16+ / 17+

**Decision**: Declare a single widget kind `SpotLockScreenWidget` via
`StaticConfiguration` with `.supportedFamilies([.accessoryRectangular,
.accessoryCircular, .accessoryInline])`. Branch SwiftUI rendering on
`@Environment(\.widgetFamily)` inside
`LockScreenAccessoryViews.swift`; do **not** define separate widget
kinds per family.

**Rationale**:
- Apple's WidgetKit documentation models the three accessory families
  as *families of one widget*, not three separate widgets — a single
  gallery entry, three layouts. Splitting into three kinds would
  produce three gallery entries (a worse user surface) and force
  three `reloadTimelines(ofKind:)` calls on every push.
- Spec-resolved decision #1 (FR-LW-005) mandates this shape.
- Existing 014 widget uses `@Environment(\.widgetFamily)` for
  `.systemSmall/.systemMedium/.systemLarge` already, so the
  branching pattern is in-house.

**Alternatives considered**:
- *Three separate widget kinds*: rejected — contradicts FR-LW-005 /
  FR-LW-008 (single gallery entry) and degrades the demo's UX story.
- *`IntentConfiguration` for per-widget user choice*: rejected —
  out of scope per FR-LW-007; user-facing per-widget configuration
  belongs with feature 013.

## 2. iOS 17+ `containerBackground` gating + iOS 16 fallback

**Decision**: Wrap every `.containerBackground(.fill.tertiary, for:
.widget)` call in `if #available(iOS 17, *) { … }` inside the SwiftUI
view bodies. iOS 16.0–16.x fallback applies
`.contentMarginsDisabled()` only and renders with a transparent
background.

```swift
var body: some View {
    let inner = AccessoryRectangularView(entry: entry)
        .contentMarginsDisabled()
    if #available(iOS 17, *) {
        inner.containerBackground(.fill.tertiary, for: .widget)
    } else {
        inner   // transparent on iOS 16.x; system draws nothing behind us
    }
}
```

**Rationale**:
- `.containerBackground(_:for:)` was introduced in iOS 17. Calling it
  on iOS 16 would either fail to compile (if not gated) or, with
  `@available` annotations, produce widgets that disappear on iOS
  16.x due to missing background chrome.
- The iOS 16 path is the documented WidgetKit migration: existing
  iOS 16 widgets render against a transparent background that the
  system supplies; iOS 17 introduced the explicit container.
- Spec-resolved decision #10 (FR-LW-015) mandates this exact gate.

**Alternatives considered**:
- *Set deployment target to iOS 17*: rejected — spec FR-LW-001 fixes
  `minIOS: '16.0'`. iOS 16 is the floor for Lock Screen accessory
  widgets and dropping 16.x users for one cosmetic API is wrong.
- *Apply `.containerBackground` unconditionally with
  `@available(iOS 17, *)` on the View struct*: rejected — would force
  duplicating each accessory layout into two View structs, doubling
  the Swift surface for no benefit.

## 3. App Group sharing with feature 014 + bundle marker insertion

**Decision**: Reuse 014's App Group exactly:
- Same suite name (`group.<bundleId>.showcase`, derived at plugin
  time from `ios.bundleIdentifier` — see 014 research §2).
- Same entitlement on the main app target and the widget extension
  target (014's plugin already wires both; 027's plugin does **not**
  touch entitlements).
- Disjoint key namespace `spot.widget.lockConfig.*` —
  `spot.widget.lockConfig.showcaseValue`,
  `spot.widget.lockConfig.counter`,
  `spot.widget.lockConfig.tint`. Reads/writes never cross 014's
  `widgetConfig.*` namespace.

The 027 plugin appends the four lock-screen Swift sources to the
existing widget extension target (`LiveActivityDemoWidget`) and
inserts a single `LockScreenAccessoryWidget()` line into the bundle
file `ios-widget/SpotWidgetBundle.swift` between the marker comments
`// MARK: spot-widgets:bundle:additional-widgets:start` /
`// MARK: spot-widgets:bundle:additional-widgets:end`.

**Prerequisite back-patch to 014** (the only edit to a 014-owned
file in implementation). Today 014's
`plugins/with-home-widgets/add-widget-bundle.ts` emits this
`BUNDLE_SOURCE`:

```swift
@main
struct SpotWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityDemoWidget()
        if #available(iOS 14.0, *) {
            ShowcaseWidget()
        }
    }
}
```

T001 extends it to:

```swift
@main
struct SpotWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityDemoWidget()
        if #available(iOS 14.0, *) {
            ShowcaseWidget()
        }
        // MARK: spot-widgets:bundle:additional-widgets:start
        // MARK: spot-widgets:bundle:additional-widgets:end
    }
}
```

027's `insert-bundle-entry.ts` then performs an idempotent
**region replacement** between the two marker lines:

```swift
        // MARK: spot-widgets:bundle:additional-widgets:start
        if #available(iOS 16.0, *) {
            LockScreenAccessoryWidget()
        }
        // MARK: spot-widgets:bundle:additional-widgets:end
```

Region replacement (not append) guarantees idempotency: re-running
the plugin produces byte-identical output regardless of how many times
it ran before.

**Rationale**:
- Region-replacement is the standard idempotent-edit pattern for
  generated source files. Append would risk duplicate
  `LockScreenAccessoryWidget()` lines on second prebuild (R2).
- Markers placed inside the `body` builder closure mean the inserted
  Swift parses correctly without needing to track preceding-comma /
  newline state.
- Failing loudly on missing markers (FR-LW-041) is implemented as:
  `if (!source.includes(START) || !source.includes(END)) throw new
  Error('with-lock-widgets: SpotWidgetBundle.swift is missing the
  required marker comments — extend with-home-widgets/add-widget-
  bundle.ts BUNDLE_SOURCE per specs/027-lock-screen-widgets/research.md
  §3.')`.

**Alternatives considered**:
- *Append a `+= LockScreenAccessoryWidget()` line below the closing
  brace*: rejected — invalid Swift outside the bundle body.
- *Regenerate the entire `SpotWidgetBundle.swift` from 027's plugin*:
  rejected — would require 027 to know about every other widget in
  the bundle (today: `LiveActivityDemoWidget` + `ShowcaseWidget`),
  duplicating ownership and breaking 014 if the bundle ever changes.
- *Have 014 own the lock-screen widget too*: rejected — violates the
  additive-integration rule and conflates two unrelated features in
  a single plugin.

## 4. Plugin marker pattern — `MARK:` comments and region replacement

**Decision**: Use `// MARK: spot-widgets:bundle:<purpose>:start` /
`:end` as the marker convention. Implementation pattern in
`insert-bundle-entry.ts`:

```ts
const START = '// MARK: spot-widgets:bundle:additional-widgets:start';
const END = '// MARK: spot-widgets:bundle:additional-widgets:end';

const REGION = `${START}
        if #available(iOS 16.0, *) {
            LockScreenAccessoryWidget()
        }
        ${END}`;

const startIdx = source.indexOf(START);
const endIdx = source.indexOf(END);
if (startIdx < 0 || endIdx < 0) throw new Error(/* fail-loud */);

const before = source.slice(0, startIdx);
const after = source.slice(endIdx + END.length);
return `${before}${REGION}${after}`;
```

**Rationale**:
- Xcode's source navigator recognises `// MARK:` comments, so
  developers reading the file in Xcode see the region clearly.
- `spot-widgets:bundle:` namespace prefix prevents collision with
  any future generic `MARK:` comments developers might add.
- The replace-region-by-string-slice approach is JS-pure-testable
  with synthetic source strings (no Xcode project mock required).

**Alternatives considered**:
- *AST-based Swift mutation* (e.g. via SwiftSyntax in a sidecar
  binary): rejected — adds a binary dependency outside the Expo
  config-plugin world for a 4-line edit.
- *Single-line marker + line-based insertion*: rejected — easier to
  corrupt if the source is reformatted.

## 5. ConfigPanel reuse vs. copy from 014

**Decision (default)**: re-export 014's `ConfigPanel` directly:

```ts
// src/modules/lock-widgets-lab/components/ConfigPanel.tsx
export { default } from '@/modules/widgets-lab/components/ConfigPanel';
export * from '@/modules/widgets-lab/components/ConfigPanel';
```

The lock-widgets screen passes the lock-config draft state and the
lock-config setter into the panel via the panel's existing props.
The panel itself is generic over `WidgetConfig` and is unaware of
which surface (home / lock) consumes it.

**Decision (fallback)**: if the cross-module import surfaces a
**circular type dependency** between `widget-config.ts` and
`lock-config.ts` during implementation — concretely, if
`widget-config.ts`'s `Tint` import path forces
`lock-config.ts` to import `widget-config.ts` which then imports
`lock-config.ts` for its own type re-export — fall back to a local
copy at `src/modules/lock-widgets-lab/components/ConfigPanel.tsx`,
copied verbatim from `src/modules/widgets-lab/components/ConfigPanel.tsx`
with the import paths rewritten to use `lock-config.ts`'s types.
Document the fallback with a `// FALLBACK: research §5` header
comment so the divergence is traceable.

**Rationale (default)**:
- Spec-resolved decision #8 (FR-LW-026) recommends import.
- `ConfigPanel` is generic over showcase value / counter / tint;
  nothing in 014's panel is intrinsically about the home widget.
- Keeping a single source of truth eliminates drift if the panel
  evolves (e.g. a new tint swatch).

**Rationale (fallback)**:
- A circular type dep is the only realistic blocker. If neither
  module's `Tint` import comes from a shared location (today both
  inline `Tint` in their own `*-config.ts`), the cycle is avoided
  entirely; the cycle becomes possible only if implementation later
  hoists `Tint` into a shared module — see §6.
- Local copy is byte-cheap and preserves user-visible behaviour.

**Tint type reuse strategy**: import `Tint` from
`src/modules/widgets-lab/widget-config.ts` directly into
`lock-config.ts`. This is a **one-way** import (027 → 014); 014 does
not import from 027. No cycle.

**Alternatives considered**:
- *Hoist `Tint` and `TINTS` into `src/native/widget-center.types.ts`*:
  rejected for now — would touch 014 source (forbidden by the
  additive-integration rule). Defer to a future cleanup feature.
- *Copy ConfigPanel by default, import as fallback*: rejected —
  inverts the spec recommendation and creates avoidable drift.

## 6. AsyncStorage shadow store key separation

**Decision**: lock-config shadow store key is the literal string
`spot.widget.lockConfig`. 014's home shadow store key is the
literal string `widgets-lab:config` (already shipped). The two keys
are syntactically distinct enough that no key-prefix collision is
possible; readers always know which surface they're talking to.

```ts
// src/modules/lock-widgets-lab/lock-config.ts
const SHADOW_STORE_KEY = 'spot.widget.lockConfig';
```

**Rationale**:
- Spec-resolved decision #12 (FR-LW-044) fixes the key string.
- AsyncStorage is not namespaced by suite (unlike iOS App Group
  `UserDefaults`), so disjoint literal keys are the only safe
  separation mechanism.
- Different *casing/punctuation conventions* between 014's
  `widgets-lab:config` and 027's `spot.widget.lockConfig` are
  intentional — they were chosen to mirror each surface's App Group
  key namespace (014's UserDefaults keys: `widgetConfig.*`; 027's:
  `spot.widget.lockConfig.*`) so debugging from either side is
  symmetrical.

**Bridge symbol path (FR-LW-022 — plan-level decision R-B)**:
introduce **dedicated symbols** `setLockConfig(c)` /
`getLockConfig()` in addition to 014's existing
`setConfig(c)` / `getCurrentConfig()`.

| Path | Pros | Cons | Decision |
|------|------|------|----------|
| Add `keyNamespace` argument to existing `setConfig` / `getCurrentConfig` | Smaller bridge surface | Forces every 014 call site to pass a string; risk of callers passing the wrong namespace | rejected |
| Add dedicated `setLockConfig` / `getLockConfig` | Stable, typed symbol per surface; trivially mockable; matches Swift symbol pair on the native side | Slightly larger bridge surface | **chosen (R-B)** |

The Swift main-app `SpotWidgetCenter` Expo module gains symmetric
`setLockConfig(c)` / `getLockConfig()` async functions that read/write
the `spot.widget.lockConfig.*` keys in the same App Group suite 014
uses. The widget extension's `LockScreenAccessoryProvider` reads the
same keys directly from `UserDefaults(suiteName:)` — no bridge
involved on the extension side, mirroring 014.

**Alternatives considered**:
- *Same key with a different suite*: rejected — would require a new
  App Group, contradicting FR-LW-017.
- *Single bridge method with a runtime "kind" string*: rejected —
  loses the type-narrowing the dedicated pair provides.

## 7. Bridge extension — `reloadTimelinesByKind`

**Decision**: extend `src/native/widget-center.ts` (and the
`.android.ts` / `.web.ts` siblings) additively with:

```ts
// added to WidgetCenterBridge interface
reloadTimelinesByKind(kind: string): Promise<void>;
```

iOS implementation delegates to a new Swift function on
`SpotWidgetCenter` that calls
`WidgetCenter.shared.reloadTimelines(ofKind: kind)`. Android / Web
throw `WidgetCenterNotSupportedError` exactly like the existing
`reloadAllTimelines`. Existing exports — `isAvailable`,
`getCurrentConfig`, `setConfig`, `reloadAllTimelines` — are
untouched (FR-LW-020).

**Rationale**:
- Per-kind reload is the minimum-blast-radius API and lets 027 not
  refresh 014's home widget when only the lock-screen is being
  exercised.
- Adding a sibling to `reloadAllTimelines` matches the
  WidgetKit shape on the native side (`reloadAllTimelines` and
  `reloadTimelines(ofKind:)` are both `WidgetCenter.shared`
  methods).

**Alternatives considered**:
- *Make `reloadAllTimelines` accept an optional kind*: rejected —
  changes 014's existing call shape and risks behavioural drift.
- *Expose `reloadTimelines(ofKinds: [String])`*: rejected —
  premature; no current caller needs multi-kind reload.

## 8. Build validation (Constitution §Development Workflow)

The Validate-Before-Spec mandate applies to "build pipelines,
infrastructure, or external service integrations". 027 touches a TS
Expo config plugin that mutates Xcode project state and edits a
014-owned generated source file — qualifying. Validation steps to
run during implementation (deferred from `/speckit.plan` because they
require a macOS host the dev environment doesn't provide):

1. On a macOS host, after T001 lands, run
   `pnpm exec expo prebuild --clean` against `app.json` with **only**
   014's plugin enabled. Assert `ios-widget/SpotWidgetBundle.swift`
   contains the two marker comments.
2. Add 027's plugin to `app.json`; run
   `pnpm exec expo prebuild --clean` again. Assert:
   - `LiveActivityDemoWidget` target's `Sources` build phase lists
     the four `LockScreenAccessory*.swift` files.
   - `ios-widget/SpotWidgetBundle.swift` between the markers
     contains exactly the
     `if #available(iOS 16.0, *) { LockScreenAccessoryWidget() }`
     block.
   - No new extension target named `SpotLockScreenWidget` exists.
3. Re-run `pnpm exec expo prebuild --clean` and assert the
   `ios/spot.xcodeproj` is byte-identical to step 2 (idempotency,
   NFR-LW-004).
4. Reorder the `app.json` plugins array (027 before 014); re-run.
   Assert state matches step 2 (commutativity, FR-LW-040).

Documented as on-device verification in `quickstart.md` §7.

## 9. Test strategy

JS-pure only (Constitution V exemption is **not** claimed for the JS
surface; tests exist for every JS surface). Swift is exercised
on-device per FR-LW-052 / `quickstart.md`.

| Test file | Asserts |
|-----------|---------|
| `lock-config.test.ts` | `validate()` defaults on each malformed shape; `DEFAULT_LOCK_CONFIG` equals `{ showcaseValue: 'Hello, Lock!', counter: 0, tint: <014-default> }`; `loadShadowLockConfig()` round-trips a valid config; `saveShadowLockConfig()` swallows AsyncStorage errors silently. |
| `manifest.test.ts` | `id === 'lock-widgets-lab'`, `label === 'Lock Screen Widgets'`, `platforms === ['ios','android','web']`, `minIOS === '16.0'`, `render` is a function. |
| `widget-center-by-kind.test.ts` | On `Platform.OS === 'web'/'android'`, `reloadTimelinesByKind('SpotLockScreenWidget')` rejects with `WidgetCenterNotSupportedError`; `setLockConfig(c)` / `getLockConfig()` likewise. On `Platform.OS === 'ios'` + native module mocked, the call delegates with the right kind string and resolves. |
| `components/StatusPanel.test.tsx` | Renders showcase value / counter / tint / next-refresh-time line on iOS 16+; hides next-refresh on Android/Web/iOS<16; refreshes on push. |
| `components/ConfigPanel.test.tsx` | Re-export integration: importing the module yields 014's `ConfigPanel` reference; tint swatches render; push-button enabled state reflects iOS 16+ availability. (Fallback variant: same assertions on the local copy.) |
| `components/AccessoryPreview.test.tsx` | Renders 3 cards labelled Rectangular / Circular / Inline; honours tint as accent; updates on prop change. |
| `components/SetupInstructions.test.tsx` | Numbered list ≥ 5 steps; mentions "spot" and "Customize". |
| `components/ReloadEventLog.test.tsx` | Empty-state line on first mount; ring buffer caps at 10; failure entries show error message; oldest evicted on overflow. |
| `screen.test.tsx` | iOS 16+ flow: layout order matches FR-LW-024; mocked bridge; push prepends to log; rapid push order preserved. |
| `screen.android.test.tsx` | Banner shown; previews interactive; push disabled; status panel next-refresh hidden; setup card hidden; log hidden. |
| `screen.web.test.tsx` | Same as android variant. |
| `plugins/with-lock-widgets/add-swift-sources.test.ts` | 4 Swift files added to `LiveActivityDemoWidget` target on first run; idempotent on second; does not touch 014's existing files. |
| `plugins/with-lock-widgets/insert-bundle-entry.test.ts` | (a) inserts the `LockScreenAccessoryWidget()` block between markers; (b) idempotent on second run (byte-identical output); (c) fails loudly with descriptive error when markers are absent; (d) does not modify content outside the marker region. |
| `plugins/with-lock-widgets/index.test.ts` | Full pipeline: running 014's plugin then 027's plugin produces the same Xcode + filesystem state as 027's then 014's (commutativity); 014's ShowcaseWidget bundle entry remains intact; entitlements unchanged on both targets. |
