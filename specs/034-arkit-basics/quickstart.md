# Quickstart — ARKit Basics Module (034)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying feature
034 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an iOS
   device. Closes FR-022, FR-023, SC-005, SC-006, SC-007, SC-011, and
   the JS-pure half of SC-008 / SC-009 (the plugin idempotency +
   coexistence assertions in `with-arkit.test.ts`).
2. **On-device verification** — required to close
   US1 / US2 / US3 / US4 / US5 / US6 acceptance scenarios that depend
   on a real `ARSession`. Closes SC-001 through SC-004, the
   on-device half of SC-008 / SC-009, and SC-010.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device iOS steps: macOS host with Xcode 16+, an **iOS 11+
  device with `ARWorldTrackingConfiguration.isSupported === true`**
  (i.e., A9-class chip or newer — iPhone 6s and later, iPad 5th gen
  and later). The iOS Simulator does NOT run ARKit; on-device steps
  require physical hardware. Apple developer signing configured for
  the `com.izkizk8.spot` bundle id (or a fork thereof).
- For Android verification: a configured Android emulator or device
  to confirm the `IOSOnlyBanner` fallback renders without crash.
- For Web verification: a desktop browser (Chrome / Edge / Safari).
  No camera permission prompt is expected on Web.

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install
pnpm format       # FR-023 — must produce no diff after the feature commit
pnpm lint         # FR-023 — no eslint-disable directives anywhere in 034
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # SC-005 — all listed test files pass
pnpm check        # FR-023 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta of
**≥ +14 suites** versus 033's closing baseline (see plan.md §"Test
baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ test/ plugins/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: zero matches.

### 1.3 Confirm registry growth is exactly +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts |
  Select-String -Pattern '^\+\s+arkitLab' -CaseSensitive
```

**Expected**: exactly two `+`-prefixed lines (one import, one array
entry). No other registry changes.

### 1.4 Confirm `app.json` plugin growth is exactly +1

```pwsh
git --no-pager diff main...HEAD -- app.json |
  Select-String -Pattern '\+\s+"\./plugins/with-arkit"' -CaseSensitive
```

**Expected**: exactly one `+`-prefixed line; no other `app.json`
modifications.

### 1.5 Confirm no face-tracking strings introduced

```pwsh
git --no-pager diff main...HEAD -- plugins/with-arkit/ |
  Select-String -Pattern 'FaceID|face-tracking|ARFaceTracking' -SimpleMatch
```

**Expected**: zero matches. (FR-017 stipulation.)

### 1.6 Plugin unit-test gate

```pwsh
pnpm test test/unit/plugins/with-arkit.test.ts
```

**Expected**: all assertions pass — idempotency (P5 / SC-008),
coexistence with `with-vision` (P3 / SC-009), `'arkit'` capability
membership semantics (P4), and no-face-tracking guarantee (P6).

---

## §2 — On-device verification (real iOS hardware required)

### 2.1 Prebuild + Info.plist assertions

```bash
# macOS host
pnpm install
pnpm prebuild --platform ios --clean
plutil -p ios/spot/Info.plist | grep -E 'NSCameraUsageDescription|UIRequiredDeviceCapabilities'
```

**Expected**:

- `NSCameraUsageDescription` is non-empty. With the standard plugin
  ordering (`with-vision` before `with-arkit`), the value will be
  Vision's string `"Used to demonstrate on-device Vision analysis"`
  (SC-009). With `with-vision` removed, the value will be ARKit's
  default `"Used to demonstrate ARKit world tracking and plane
  detection."`.
- `UIRequiredDeviceCapabilities` contains the literal string
  `arkit`, exactly once. (SC-008 — also verifiable by re-running
  `pnpm prebuild --platform ios --clean` and `diff`-ing the two
  generated plists; expect zero changes.)

### 2.2 Build, run, and walk the screen (US1)

```bash
pnpm ios   # or open ios/spot.xcworkspace and Run in Xcode
```

On the device:

1. From the home grid, tap **ARKit Basics**.
2. The screen mounts. The first time, iOS prompts for camera
   permission. Grant it.
3. Within 5 seconds:
   - **CapabilitiesCard** should show `worldTrackingSupported:
     true` and the status pill should read **running**.
   - The AR view should render the live camera feed.
   - The **StatsBar** should show FPS > 0 and tracking state
     `normal`.

**Closes**: SC-001, US1-AS1.

If the device's `ARWorldTrackingConfiguration.isSupported === false`
(very old iPad, A8-class iPhone), the AR region renders the
"Unsupported on this device" placeholder; CapabilitiesCard shows
`worldTrackingSupported: false`; no session is started. (US1-AS3.)

### 2.3 Plane detection + tap-to-place (US2)

1. Point the camera at a horizontal surface (table, floor) for ~3 s
   with **plane detection** set to **horizontal** (the default).
2. Tap once inside the AR view on the visible plane.

**Expected**: a small textured cube appears at the tap point,
anchored to the plane. The anchor count goes from 0 to 1. The
**AnchorsPanel** gains exactly one row showing the first 8 chars of
the anchor id and `(x, y, z)` coordinates rounded to 2 decimals.

3. Tap **Clear all** below the AR view.

**Expected**: the cube disappears, the AnchorsPanel empties, and the
count returns to 0.

**Closes**: SC-002, SC-003, US2-AS1, US2-AS3.

### 2.4 Reconfigure session at runtime (US3)

1. Place 1 cube on a horizontal plane.
2. Change **Plane detection** to **vertical**.

**Expected**: the existing horizontal-plane cube remains (anchors
preserved across reconfiguration). The status pill stays **running**.
A subsequent tap on a horizontal surface will MISS (no anchor added),
because the active alignment is now vertical.

3. If the device supports it, toggle **People occlusion** on, then
   off. (US3-AS2.) On non-supporting devices, verify the row is
   visibly disabled with an explanatory caption (US3-AS3).
4. Toggle **Light estimation** off and on.

**Closes**: US3-AS1, US3-AS2, US3-AS3.

### 2.5 Pause / resume / reset lifecycle (US4)

1. With at least 1 cube placed, tap **Pause**.

**Expected**: status pill shows **paused**, FPS reads 0 in the
StatsBar within 1 second, the duration counter freezes.

2. Tap **Resume**.

**Expected**: status pill returns to **running**, the duration
counter resumes from where it paused (paused interval excluded).

3. Tap **Reset**.

**Expected**: all anchors are cleared, the AnchorsPanel empties,
and the duration counter restarts from 0.

**Closes**: SC-004, US4-AS1, US4-AS2, US4-AS3.

### 2.6 Tracking-state degradation (US6)

1. Cover the camera lens with your finger for ~2 seconds.

**Expected**: the StatsBar tracking state transitions to
`limited:<reason>` (typically `limited:insufficientFeatures` or
`limited:excessiveMotion`) within 1 second.

2. Uncover the lens.

**Expected**: tracking state returns to `normal` within 2 seconds.

**Closes**: US6-AS1, US6-AS2.

### 2.7 Cross-platform fallback (US5)

On Android (emulator or device):

```bash
pnpm android
```

1. Open the **ARKit Basics** card.

**Expected**: the screen renders all six panel slots in the same
top-to-bottom order, but the AR-view region is replaced by an
`<IOSOnlyBanner />`. The ConfigurationCard switches and the
TapToPlaceControls are visibly disabled with an explanatory caption.
No camera permission prompt is shown. No console errors.

2. Tap any control. Verify nothing crashes; the bridge calls (which
   are guarded at the screen level) do not fire.

On Web:

```bash
pnpm web
```

Same expectations as Android. Verify Chrome's DevTools Network tab
shows no request to a `arkit.*` chunk on the screen mount (web bundle
does not pull `src/native/arkit.ts`).

**Closes**: SC-006, US5-AS1, US5-AS2, US5-AS3.

### 2.8 Unmount safety (SC-011)

1. Open the ARKit Basics screen.
2. Wait until status pill reads **running**.
3. Navigate away (back button).
4. Open Xcode's Console and observe the next 5 seconds of logs.

**Expected**: no `getSessionInfo` log line, no `onAnchorAdded` event,
no FPS update fires after the navigation. The session was paused on
unmount; the polling interval was cleared.

**Closes**: SC-011, FR-016 acceptance.

---

## §3 — First-time-user flow (SC-010)

A naïve operator (no docs in front of them) should complete the
following within 60 seconds:

1. Tap the **ARKit Basics** card.
2. Grant camera permission.
3. Wait for the running status pill.
4. Tap on a flat surface 3 times to place 3 cubes.
5. Tap **Reset**.

**Expected**: total elapsed time ≤ 60 s; AnchorsPanel ends empty;
duration counter restarts from 0.

**Closes**: SC-010.

---

## §4 — Sign-off

Record the device model, iOS version, build SHA, and a screenshot of
the running screen with at least 1 cube placed, in the feature's
`retrospective.md`. The retrospective is the gate for merge.
