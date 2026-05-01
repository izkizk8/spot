# Phase 0 Research — ARKit Basics Module (034)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-G**, plus §8 ("Anchor cap and
AnchorsPanel rendering"). Spec-level decisions were already approved
in `spec.md`; they are not re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent AsyncFunction calls

### Decision

`src/native/arkit.ts` (and the `.android.ts` / `.web.ts` siblings)
expose an internal, module-scoped promise chain inherited verbatim
from features 030 / 031 / 032 / 033:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every async bridge method (`placeAnchorAt`, `clearAnchors`,
`pauseSession`, `resumeSession`, `getSessionInfo`) wraps its native
call through `enqueue(...)`. The synchronous `isAvailable()` is NOT
serialised. The Android and Web variants apply the same chain so
that two rapid taps (which the screen tries to suppress at the UI
layer with a button-disabled state, but is defensive about) reject
in submission order.

### Rationale

- Two rapid `placeAnchorAt()` calls hitting the Swift raycast in
  parallel could return anchors out of order, breaking the
  AnchorsPanel's "newest at top" invariant. Serialising at the JS
  bridge ensures the second call only fires AFTER the first has
  resolved (with anchor or null), giving tests the deterministic
  invariant: "two back-to-back calls produce two native invocations
  in submission order".
- Inheriting the helper verbatim from 030 / 031 / 032 / 033 reduces
  reviewer cognitive load and reuses the same flake-free guarantee
  prior bridge tests demonstrated.
- Errors are preserved for the caller but the chain is detoxified by
  `chain.catch(...)` so a rejected call does not block subsequent
  ones.

### Alternatives considered

- **No serialisation** — rejected; ARKit's raycast is fast enough
  that overlap is rare in human interaction, but tests would be
  flaky without the invariant and demos involving rapid synthetic
  taps would surface it.
- **Serialise at the Swift layer with `DispatchQueue`** — rejected;
  harder to assert in JS tests; adds Swift-side state to clean up;
  also doesn't help the Android / Web branches.
- **Per-method chain** (one per async function) — rejected; the
  cross-method ordering matters too (e.g., `pauseSession()` must
  not race a pending `placeAnchorAt()` mid-raycast).

---

## §2 — R-B: Raycast strategy and RealityKit anchor entity construction

### Decision

The Swift `ARKitView` performs taps via a `UITapGestureRecognizer`
attached to the wrapped `RealityKit.ARView`. The recogniser's
`location(in:)` is forwarded to JS via the `onTap` event of the
ViewDefinition; JS then calls `arkit.placeAnchorAt(x, y)`. The
imperative bridge looks up the active view (R-C) and runs:

```swift
@available(iOS 13.0, *)
func placeAnchor(at point: CGPoint) -> AnchorRecord? {
    let alignment: ARRaycastQuery.TargetAlignment
    switch currentPlaneDetection {
    case .horizontal: alignment = .horizontal
    case .vertical:   alignment = .vertical
    case .both:       alignment = .any
    case .none:       return nil
    }
    let results = arView.raycast(from: point,
                                 allowing: .estimatedPlane,
                                 alignment: alignment)
    guard let hit = results.first else { return nil }

    let anchorEntity = AnchorEntity(world: hit.worldTransform)
    let mesh = MeshResource.generateBox(size: 0.05) // 5 cm cube
    var material = SimpleMaterial()
    if let texture = try? TextureResource.load(named: "cube-texture") {
        material.color = .init(texture: .init(texture))
    } else {
        material.color = .init(tint: .white)
    }
    let cube = ModelEntity(mesh: mesh, materials: [material])
    anchorEntity.addChild(cube)
    arView.scene.addAnchor(anchorEntity)

    let id = UUID().uuidString
    register(anchor: anchorEntity, id: id)
    return AnchorRecord(id: id,
                        x: hit.worldTransform.columns.3.x,
                        y: hit.worldTransform.columns.3.y,
                        z: hit.worldTransform.columns.3.z,
                        createdAt: Date().timeIntervalSince1970 * 1000)
}
```

For iOS 11.0–12.x where `ARView.raycast(...)` is unavailable, the
fallback uses `ARSCNView.hitTest(point, types: [.estimatedHorizontalPlane])`
mapped through the same alignment logic. The minIOS floor of 11.0 is
preserved by gating the modern raycast at `@available(iOS 13.0, *)`
and using the legacy `hitTest` below that.

### Rationale

- `RealityKit.ARView.raycast` is the supported modern API and is
  faster than the legacy `hitTest`; using `.estimatedPlane` lets the
  raycast hit a plane that ARKit has only loosely classified, which
  is much friendlier to demos in non-ideal lighting.
- `MeshResource.generateBox(size: 0.05)` ships in RealityKit since
  iOS 13.0 with a stable signature; `ModelEntity` ditto.
- The cube texture is bundled in `Resources/` and loaded via
  `TextureResource.load(named:)`; on failure the material falls back
  to solid white so the demo never crashes for a missing asset.
- 5 cm matches typical room-scale demos: large enough to be visible
  on a phone screen at 1 m, small enough not to occlude other UI.

### Alternatives considered

- **`ARSCNView` + SceneKit** — rejected for v1; SceneKit's setup is
  more verbose, and spec §Assumptions explicitly prefers
  `RealityKit.ARView`.
- **Procedural texture (no bundled asset)** — rejected; the visible
  texture is part of the educational signal ("see the anchor's
  rotation in the cube faces"). 64×64 PNG keeps bundle bloat
  trivial.
- **Larger cube (10 cm)** — rejected; obscures small surfaces in
  acceptance scenario US2-AS1.

---

## §3 — R-C: Session lifecycle ownership (view owns, bridge looks up)

### Decision

`ARKitView` owns the `ARSession` and the wrapped `RealityKit.ARView`.
On view mount it calls `session.run(makeConfig(props))` and on
unmount it calls `session.pause()`. A process-wide weak registry
keyed by the view's `reactTag` lets `ARKitBridge` resolve the active
view at every imperative call:

```swift
final class ARKitViewRegistry {
    static let shared = ARKitViewRegistry()
    private var views = [Int: WeakBox<ARKitViewModule>]()
    func register(_ view: ARKitViewModule, tag: Int) { ... }
    func unregister(tag: Int) { ... }
    func active() -> ARKitViewModule? { /* most-recently-mounted */ }
}
```

Each `AsyncFunction` in `ARKitBridge` first calls
`ARKitViewRegistry.shared.active()`. If `nil`, it rejects with
`'no-active-view'`.

### Rationale

- The Expo Modules API explicitly supports a single Module containing
  both `Function` / `AsyncFunction` declarations AND a `View(...)`
  declaration. However, the screen-mounted view is the natural
  owner of session state because it has a deterministic
  mount / unmount lifecycle that matches the AR session's
  start / stop boundary.
- Keeping the bridge stateless (no persistent `ARSession` retained
  on the bridge object) avoids leaks if a module instance survives
  the view's removal and prevents two views from fighting over a
  single shared session.
- The weak registry is a 30-line helper that mirrors the same
  pattern several SDK modules (e.g., `expo-camera`) use internally.

### Alternatives considered

- **Bridge owns the session, view subscribes** — rejected; the view
  cannot mount its `RealityKit.ARView` until the session exists, so
  startup ordering becomes asymmetric.
- **Singleton session** — rejected; second module mount would
  display a stale session frame from the first mount until the
  config is re-applied.
- **Context-based dependency injection** — overkill for one view;
  the registry is two static functions.

---

## §4 — R-D: Polling cadence (500 ms) + unmount safety + error classification

### Decision

`useARKitSession` polls `getSessionInfo()` at **500 ms** via
`setInterval`. The hook guards against post-unmount state mutations
with a `mounted` ref and runs cleanup synchronously inside the
`useEffect` return:

```ts
useEffect(() => {
  let cancelled = false;
  const tick = async () => {
    if (cancelled) return;
    try {
      const info = await arkit.getSessionInfo();
      if (cancelled) return;
      dispatch({ type: 'info/update', info });
    } catch (e) {
      if (cancelled) return;
      dispatch({ type: 'error', error: classify(e) });
    }
  };
  const id = setInterval(tick, 500);
  void tick(); // immediate first read

  return () => {
    cancelled = true;
    clearInterval(id);
    arkit.pauseSession().catch(() => undefined); // best-effort; FR-016
  };
}, []);
```

Errors are classified as:

| Caught error | Outcome | Status pill |
|--------------|---------|-------------|
| `ARKitNotSupported` (Android / Web / unsupported iOS) | `'unsupported'` | `error`; message `'ARKit not supported on this platform'` |
| Any other `Error` whose message starts with `'no-active-view'` | `'no-view'` | unchanged (transient during mount race) |
| Any other `Error` | `'failed'` | `error`; message = `error.message` |

### Rationale

- **500 ms** is the spec-stipulated default and is fast enough for
  the StatsBar to feel "live" without spamming the bridge. ARKit
  tracking-state changes themselves propagate through ARSession
  delegates at frame rate (60 Hz), so the JS poller is purely a
  smoothing window for the StatsBar's display.
- Synchronous `cancelled = true` inside cleanup is the only reliable
  way to drop in-flight callbacks without `AbortController` (the
  bridge's underlying Promise is not abortable). SC-011 mandates
  zero post-unmount calls; this pattern provides it.
- `pauseSession()` on unmount is fire-and-forget: if the bridge is
  in an error state the rejection is intentionally swallowed because
  there is nothing to recover.
- The `'no-view'` transient is observed during a sub-frame window
  between view mount and the next polling tick; treating it as
  non-fatal prevents a flash of "error" status pill on every screen
  enter.

### Alternatives considered

- **100 ms cadence** — rejected; doubles bridge traffic for no
  perceptible UX gain; the 1-second FPS rolling window is the
  smoothing budget.
- **1000 ms cadence** — rejected; the StatsBar would show a visible
  step every second, hurting the "live telemetry" feel.
- **Push-based event stream** (Swift emits a `tick` event) — rejected;
  larger surface area, harder to mock, and forces the screen to
  carry an event subscription throughout its lifetime.

---

## §5 — R-E: FPS measurement via ARSession delegate ring buffer

### Decision

The Swift `ARKitView` adopts `ARSessionDelegate` and implements:

```swift
private var frameTimestamps = RingBuffer<TimeInterval>(capacity: 60)

func session(_ session: ARSession, didUpdate frame: ARFrame) {
    frameTimestamps.append(frame.timestamp)
}
```

On `getSessionInfo()`, the bridge reads the buffer and computes:

```swift
let now = CACurrentMediaTime()
let recent = frameTimestamps.values.filter { now - $0 <= 1.0 }
let fps = recent.count // count of frames in the last 1 second
```

When the session is paused, `didUpdate` stops firing; the buffer
drains naturally as old timestamps fall outside the 1-second window,
and `fps` reaches 0 within at most 1 second. The hook also forces a
synthetic `fps: 0` sample in the reducer when the user-initiated
state change is `paused`, so the StatsBar shows 0 immediately on
pause without waiting for the next polling tick.

### Rationale

- The **count of frames within the last second** is the rolling
  1-second average by definition (the integral of an indicator
  function), and is cheaper than maintaining a moving sum.
- Capacity 60 is the steady-state on a 60 fps device; if the device
  drops below that the buffer simply does not fill, which is the
  desired behaviour.
- ARKit's `frame.timestamp` is monotonic and synchronised with
  `CACurrentMediaTime()`, so the comparison is well-defined.
- Forcing a synthetic 0 on pause is purely a UX nicety; the
  underlying buffer would converge to 0 within 1 s anyway.

### Alternatives considered

- **CADisplayLink-driven counter** — rejected; runs on the main
  thread regardless of AR frame delivery and would report 60 even
  when the AR session is dropping frames.
- **Smoothed exponential moving average** — rejected; harder to
  reason about, and the spec specifically calls for "1-second
  rolling average".
- **Per-call wall-clock delta** — rejected; would make `fps` depend
  on the polling cadence rather than on the camera frame rate.

---

## §6 — R-F: `with-arkit` plugin merge logic + idempotency proof

### Decision

`plugins/with-arkit/index.ts` exports a `ConfigPlugin` that uses
`withInfoPlist`:

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const DEFAULT_CAMERA_USAGE_DESCRIPTION =
  'Used to demonstrate ARKit world tracking and plane detection.';
const ARKIT_CAPABILITY = 'arkit';

const withArkit: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    // (a) NSCameraUsageDescription — preserve any existing value.
    if (!cfg.modResults.NSCameraUsageDescription) {
      cfg.modResults.NSCameraUsageDescription = DEFAULT_CAMERA_USAGE_DESCRIPTION;
    }

    // (b) UIRequiredDeviceCapabilities — append 'arkit' iff absent.
    const caps = cfg.modResults.UIRequiredDeviceCapabilities;
    if (!Array.isArray(caps)) {
      cfg.modResults.UIRequiredDeviceCapabilities = [ARKIT_CAPABILITY];
    } else if (!caps.includes(ARKIT_CAPABILITY)) {
      cfg.modResults.UIRequiredDeviceCapabilities = [...caps, ARKIT_CAPABILITY];
    }

    return cfg;
  });

export default withArkit;
```

The `package.json` next to it declares `name`, `version`, and
`main: 'index.ts'` (mirrors `plugins/with-vision/package.json`).

### Idempotency proof

Let `f` be the body of `withInfoPlist`'s callback. For any input
`cfg`:

1. If `NSCameraUsageDescription` is already set in `f(cfg)`, the
   condition `!cfg.modResults.NSCameraUsageDescription` is false, so
   `f(f(cfg)) = f(cfg)` for that key.
2. If `'arkit'` is in `UIRequiredDeviceCapabilities` after the first
   pass, the membership check `caps.includes(ARKIT_CAPABILITY)`
   short-circuits the append on the second pass; the array value is
   identical.
3. No other keys are touched.

Therefore `f(f(cfg)) === f(cfg)` (deep-equal), satisfying SC-008.

### Coexistence proof with `with-vision`

`plugins/with-vision/index.ts` (verified at planning time) sets
`NSCameraUsageDescription` only when absent. Both orderings produce
the same plist:

- `with-vision` first, `with-arkit` second:
  - `with-vision` sets `NSCameraUsageDescription = 'Used to
    demonstrate on-device Vision analysis'`.
  - `with-arkit` sees the key already present, no-ops, then appends
    `'arkit'` to capabilities.
- `with-arkit` first, `with-vision` second:
  - `with-arkit` sets the camera string to ARKit's default and
    appends `'arkit'`.
  - `with-vision` sees the key already present, no-ops.

The final string differs by ordering (Vision's vs ARKit's default),
but both are non-empty (SC-009). The capabilities array is identical
either way. The recommended ordering in `app.json` keeps the prior
entries unchanged and appends `'./plugins/with-arkit'` last, which
matches the natural feature-by-feature additive convention.

### Out-of-scope guarantee

The plugin **MUST NOT** add `NSFaceIDUsageDescription`, any
`com.apple.developer.arkit.face-tracking`-related entitlement, or
the `NSPhotoLibraryUsageDescription` key. The test
`with-arkit.test.ts` asserts that after the modifier runs, no key
matching the regex `/face|FaceID/` appears in `cfg.modResults`
(beyond what the input already contained). FR-017 stipulation.

### Rationale

- `withInfoPlist` is the standard `@expo/config-plugins` mod; running
  it produces deterministic JSON-equivalent output suitable for
  `expect.toEqual()` comparisons in tests.
- Preserving an upstream `NSCameraUsageDescription` is the correct
  default for cohabiting plugins: the operator (or the prior plugin)
  has already chosen the customer-facing copy; ARKit is one of
  several camera consumers and should not clobber.
- Membership-check append on `UIRequiredDeviceCapabilities` matches
  Apple's documented convention of array-valued plist keys.

### Alternatives considered

- **`withDangerousMod` + raw plist write** — rejected; bypasses the
  Expo prebuild graph and is not idempotent without extra book-keeping.
- **`withEntitlementsPlist`** — rejected; ARKit is enabled by the
  presence of the framework, not by a separate entitlement.
- **Set the key unconditionally** (overwrite) — rejected; clobbers
  feature 017's tailored copy and violates the
  "preserves an upstream value" stipulation.

---

## §7 — R-G: ViewDefinition prop diffing + Reset semantics

### Decision

The Swift `ARKitView`'s `Prop("planeDetection")` /
`Prop("peopleOcclusion")` / `Prop("lightEstimation")` setters
re-build the `ARWorldTrackingConfiguration` and call
`session.run(config, options: [])`. No `.resetTracking`,
`.removeExistingAnchors`, or other reset flags are passed; existing
anchors survive (FR-006 acceptance scenario US3-AS1).

The imperative `Reset` action is a two-step sequence in JS:

```ts
const reset = async () => {
  await arkit.clearAnchors();
  // setConfig in JS also schedules a session.run with reset flags
  setConfig(currentConfig); // reducer marks "reset pending"
};
```

The hook's reducer translates a "reset pending" flag into a Swift
`session.run(config, options: [.removeExistingAnchors,
.resetTracking])` invocation on the next prop diff. This keeps
"reset" as a distinct semantic from "config change" without adding
an additional `AsyncFunction` to the bridge.

The `worldMapPersistence` switch is a v1 placeholder. The Swift side
declares no prop for it; the JS hook tracks it in state and applies
no native effect. The UI caption documents this.

### Rationale

- ARKit's `session.run(config, options:)` is the supported way to
  reconfigure a running session; passing an empty options array
  preserves anchors. The `[.resetTracking, .removeExistingAnchors]`
  options reset to a clean slate and are Apple's documented "start
  over" idiom.
- Splitting the Reset into JS-side `clearAnchors()` followed by a
  configuration prop diff with a marker is simpler than adding a
  sixth `AsyncFunction` and matches the existing prop-diff path on
  the Swift side.
- The `worldMapPersistence` placeholder costs zero native code and
  keeps the toggle's UI affordance for the educational lesson; a
  follow-up feature can land the actual `ARWorldMap` save/load.

### Alternatives considered

- **Add `AsyncFunction("resetSession")`** — rejected; adds bridge
  surface area; the prop-diff path already exists and is the same
  cost on the Swift side.
- **Tear down and recreate the view** — rejected; a remount cycle
  would flash a black frame and lose the camera feed for hundreds of
  ms.
- **Implement `worldMapPersistence` in v1** — rejected; adds
  filesystem write semantics, an `ARWorldMap` archiving call, and a
  load path on next session start; explicitly out of scope per spec.

---

## §8 — Anchor cap and AnchorsPanel rendering

The soft cap of 100 anchors is enforced at the **AnchorsPanel**
render boundary: the panel slices its incoming `anchors` prop to
the 100 newest entries before mapping them to rows. The hook does
NOT enforce a cap (no array truncation in the reducer); this keeps
the cap UI-only, easy to lift in a follow-up, and visible to tests
(which can pass 200 anchors and assert exactly 100 rendered rows).

A `ScrollView` is used (no `FlatList`) because 100 rows of plain
`<ThemedText>` render well within the 60 fps budget on a mid-tier
iPhone. `FlatList` virtualisation would obscure the educational
intent (the learner expects to see all anchors at once) and is
explicitly out of scope per spec.

A `<ThemedText>` caption ("Up to 100 anchors shown — clear to add
more") appears below the list when `anchors.length >= 100` to
document the cap to the user.
