# Quickstart: Camera + Vision Live Frames Module

> **READ THIS FIRST.** This module's analysis pipeline is **iOS-only**. Android renders the live camera preview but no Vision analysis (Vision is iOS-exclusive); web renders a static placeholder. On either non-iOS surface, the "Vision is iOS-only" banner is shown.
>
> **Frame source disclosure** *(repeated from spec.md §Reality Check)*: This module drives Apple Vision via a periodic `expo-camera` `takePictureAsync` snapshot loop at a default cadence of ~250 ms (configurable via the `useFrameAnalyzer` hook). Achievable analysis cadence is roughly **2–6 fps** on a modern iOS device (A14+) depending on the active Vision request. The live preview surface itself remains visually smooth regardless of the analysis cadence — analysis runs off the preview's render path.
>
> If your goal is true 30+ fps frame processing (production scanning use cases), use [`react-native-vision-camera`](https://github.com/mrousavy/react-native-vision-camera) instead. This module is designed as an educational demonstration of Vision via the supported `expo-camera` public API; it intentionally does not adopt experimental or unstable frame-processor surfaces.

---

## 1. Install the dependency

```bash
pnpm install        # installs everything in package.json, including expo-camera
```

After plan/tasks land, the only new runtime dependency this feature adds is `expo-camera`. No operator-supplied artifact is required (this is the critical contrast with feature 016, which requires a downloaded `.mlmodel` file).

---

## 2. JS-pure verification on Windows (the dominant CI path)

This is the primary verification path on Windows + CI; it covers ~100% of the JS surface (vision-types, the analyzer hook with fake timers, every component, every screen variant with mocked native, the bridge contract + non-iOS stubs, the config plugin against fixtures, the manifest):

```bash
pnpm check     # format + lint + typecheck + test (the project's standard quality gate)
```

Expected: green with no warnings about state updates on unmounted components and no unhandled promise rejections (NFR-003 / NFR-006).

To run a focused subset while iterating:

```bash
pnpm test test/unit/modules/camera-vision/
pnpm test test/unit/native/vision-detector.test.ts
pnpm test test/unit/plugins/with-vision/index.test.ts
```

---

## 3. iOS prebuild (macOS or EAS Build only — Windows operators stop after step 2)

```bash
pnpm exec expo prebuild --platform ios --clean
```

Expected outcomes:

| Stage | Pass condition | Failure mode |
|-------|----------------|--------------|
| `expo prebuild` plugin merge | `Info.plist` contains `NSCameraUsageDescription` set to the default ("Used to demonstrate on-device Vision analysis (...)") if not already supplied | None expected — the plugin only adds an Info.plist key |
| Idempotency | A second `expo prebuild --clean` produces the same `Info.plist` (no diff) | None expected (FR-028) |
| Plugin coexistence | 007 / 014 / 015 / 016 plugin outputs are unaffected | Diff against a chain-without-017 — must show only the `NSCameraUsageDescription` addition (FR-029) |

---

## 4. iOS build + on-device verification (macOS or EAS Build)

```bash
eas build --platform ios     # produces a real device-installable .ipa
```

The simulator works for the camera preview surface (Apple ships a static / animated camera feed), but Vision requests against simulator-captured frames may behave differently than on real hardware (especially text recognition). **Use a real iOS 13+ device for full verification.**

### 4a. US-1 (Faces, P1 — the MVP path)

1. Open the spot app on the iOS device and navigate to **Modules → Camera Vision**.
2. **First-launch permission**: The system prompt for camera access appears. Grant it.
3. Confirm the screen renders, in order:
   - **Live camera preview** filling the available area (rear camera by default).
   - **Mode Picker** at the bottom showing four segments — "Faces" / "Text" / "Barcodes" / "Off" — with **"Faces" preselected**.
   - **Camera Controls** above the Mode Picker — flip + flash buttons.
   - **Stats Bar** at the very bottom showing `FPS: 0.0 · — ms · 0 detected` initially.
4. Point the rear camera at a face. Within ~1 second:
   - One or more **bounding-box overlays** appear over each detected face, animated by reanimated.
   - The Stats Bar `detected` count matches the number of overlays.
   - `lastAnalysisMs` reports a positive integer (typically 30–80 ms on A14+ for faces).
   - `FPS` settles to 2–6 over the next ~2 seconds.
5. Move the camera away from the face. Within ~1 second, all overlays disappear and `detected` returns to 0.
6. **Unmount cleanup**: Navigate back to the Modules grid. Connect to **Console.app** and verify no further `[VisionDetector]` log lines appear after the unmount and no "state update on unmounted component" warnings are emitted (SC-009 / NFR-003).

### 4b. US-2 (Text, P2)

1. With the screen still mounted and Mode set to "Faces", tap **Text** in the Mode Picker.
2. Verify the face overlays clear within one analysis cycle (~250 ms).
3. Point the camera at a printed page or signage. Within ~1.5 seconds:
   - Bounding boxes appear over recognized text regions.
   - The Stats Bar `detected` count matches.
   - **Accessibility labels carry the recognized text**: enable VoiceOver (or use the Accessibility Inspector on the Mac) and focus an overlay rectangle — the announcement should be the recognized string (truncated to ~80 chars per FR-007).

### 4c. US-3 (Barcodes, P2)

1. Switch Mode to **Barcodes**.
2. Point the camera at a QR code (any product, a generated test QR, etc.) or a 1D barcode (e.g., a book's ISBN).
3. Verify a bounding-box overlay appears within ~1 second around the symbol.
4. With VoiceOver focused on the overlay, the announcement should be the **decoded payload string** (e.g., the URL embedded in the QR code).

### 4d. US-4 (Camera controls, P2)

1. With Mode set to "Faces" and the rear camera active, tap the **camera-flip** button.
2. Verify:
   - The preview switches to the **front camera** within one frame.
   - The analysis loop continues uninterrupted (face overlays appear against the new feed).
   - The flash-mode button is **hidden or disabled** (front camera typically lacks flash). VoiceOver should announce "Flash not available on this camera" if focused on the disabled button (NFR-004).
3. Tap the camera-flip button again to return to the rear camera.
4. Tap the **flash-mode** button. Verify the icon cycles **Off → Auto → On → Off** with each tap.

### 4e. Edge-case checks

1. **Permission denied path**: In **Settings → Privacy → Camera → spot**, revoke camera access. Return to the app. The screen surfaces an inline "Camera access is required for this module" message and a re-request button. Tap it to re-prompt. Granting access resumes the loop with no further interaction.
2. **Mid-session revocation**: While the loop is running, background the app, revoke camera access in Settings, and foreground the app. The next snapshot fails; the bridge surfaces an error; the screen re-shows the permission affordance. No crash (NFR-006).
3. **Snapshot loop overlap**: Switch to "Text" mode and point at a busy printed page (text recognition is the most expensive request). Watch the Stats Bar — `FPS` should drop to ~2 and stay stable (overlap-skip behavior; ticks that fall during an in-flight cycle are dropped, not queued, R-010).
4. **Rapid mode switching**: Tap the Mode Picker rapidly through Faces → Text → Barcodes → Faces. Verify no stale observations from a discarded mode appear on the canvas.
5. **Mode "Off"**: Set Mode to "Off". Overlays clear within one cycle; FPS / `lastAnalysisMs` retain their last values (FR-018); the camera preview continues to render normally.

### 4f. Console.app sanity (optional)

Connect the device to a Mac and open **Console.app** filtered on the spot app's process. The bridge logs:

```
[VisionDetector] analyze(faces) — Nms — k observations
[VisionDetector] analyze(text) — Nms — k observations
[VisionDetector] analyze(barcodes) — Nms — k observations
```

…where `N` is the wall-clock duration matching the Stats Bar's `lastAnalysisMs`. No `ERROR` lines should appear in steady-state operation.

---

## 5. Expected fallback behavior on Android / Web

Run the app on Android (`pnpm android`) and on web (`pnpm web`):

1. Open **Modules → Camera Vision**.
2. **Verify (Android)**:
   - The **live `expo-camera` preview renders** (Android also supports `expo-camera`).
   - The **Mode Picker is rendered but visually disabled / inert** (taps do nothing).
   - The **"Vision is iOS-only" banner** is shown prominently at the top.
   - **No analysis loop starts**; no `bridge.analyze` calls are issued. Internally, `bridge.isAvailable()` returns `false` synchronously and the screen short-circuits before instantiating `useFrameAnalyzer`.
3. **Verify (Web)**:
   - A **static "Camera not available in this browser" placeholder** replaces the preview (web does not start `getUserMedia`; the placeholder is intentionally informative — see research.md R-008).
   - The Mode Picker is rendered as inert.
   - The "Vision is iOS-only" banner is shown.
4. **Verify on both**: The JS console shows **zero exceptions**. Any defensive direct call to `bridge.analyze()` would reject with `VisionNotSupported`, caught and surfaced as an inline status message — never an unhandled rejection (NFR-006).
5. **Verify**: The screen is keyboard-and-screen-reader navigable end-to-end on both surfaces (NFR-004).

---

## 6. Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `expo prebuild` produces an `Info.plist` *without* `NSCameraUsageDescription` | The 017 plugin is not enabled | Add `"./plugins/with-vision"` to `app.json`'s `plugins` array; rerun `pnpm exec expo prebuild --clean` |
| iOS install asks for camera permission with a blank purpose string | Operator supplied an empty `NSCameraUsageDescription` value in `app.json` | The plugin's `??=` preserves operator values; either remove the empty value or replace it with a meaningful one |
| Stats Bar shows FPS: 0.0 forever, even with face in frame | `useFrameAnalyzer` not started — likely permission not granted, or `mode === 'off'`, or `cameraRef` not yet attached | Check the inline permission affordance; verify Mode Picker is not on "Off"; reload the screen |
| Overlays appear flipped (face boxes appear at the bottom of the screen when faces are at the top) | The Swift bridge is returning Vision's bottom-left coordinates without converting | Bug in `VisionDetector.swift` — verify the `y_top = 1 - (y_bottom + height)` conversion is applied (research.md R-003) |
| Console: `state update on unmounted component` from `useFrameAnalyzer` | In-flight analysis resolved after unmount and called `setState` | Bug in the hook's teardown — verify the unmount-time `inFlight` token is checked before every `setState` call (NFR-003) |
| Mode switch leaves stale text overlays from the previous mode | In-flight analysis result not discarded on mode change | Bug in the hook — verify the cycle's captured `mode` is compared to the current `mode` on resolve (R-010) |
| Module missing from the Modules grid on iOS < 13 | Manifest sets `minIOS: '13.0'`; older iOS is filtered by the 006 registry | Expected; upgrade the device or test on iOS 13+ |
| iOS-only banner appears on a real iOS 13+ device | `bridge.isAvailable()` returned false | Verify the iOS deployment target is ≥ 13.0 and the native module compiled — check Xcode build logs for `VisionDetector` |
| Achieved FPS far below 2 on A14+ | Active mode is "Text" against a very busy page (expensive case) — or the device is older than A14 | Expected for Text on busy scenes; switch to Faces to verify the pipeline is healthy |

---

## 7. Reference

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Contracts: [contracts/](./contracts/)
- Apple Vision framework docs: <https://developer.apple.com/documentation/vision>
- `VNDetectFaceRectanglesRequest`: <https://developer.apple.com/documentation/vision/vndetectfacerectanglesrequest>
- `VNRecognizeTextRequest`: <https://developer.apple.com/documentation/vision/vnrecognizetextrequest>
- `VNDetectBarcodesRequest`: <https://developer.apple.com/documentation/vision/vndetectbarcodesrequest>
- `expo-camera`: <https://docs.expo.dev/versions/latest/sdk/camera/>
- `react-native-vision-camera` (the documented follow-up for true frame-processor pipelines): <https://github.com/mrousavy/react-native-vision-camera>
