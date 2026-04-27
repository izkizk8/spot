# Quickstart: CoreML Playground Module

> **READ THIS FIRST.** This module ships everything except the model file. The `MobileNetV2.mlmodel` is **operator-supplied** (downloaded from Apple's developer model gallery) and is **gitignored**. The 016 config plugin will fail your iOS prebuild with an actionable error if the file is missing — that is the documented expected workflow.

---

## 1. Download the MobileNetV2 model from Apple

1. Open Apple's developer model gallery in a browser:
   <https://developer.apple.com/machine-learning/models/>
2. Locate the **MobileNetV2** card (an image-classification model trained on ImageNet, 1000 classes).
3. Click the model card, accept Apple's licensing terms if prompted, and download `MobileNetV2.mlmodel`. The file is roughly **17 MB**.

> The model is distributed by Apple under their model-gallery terms; the spot repository does **not** redistribute it. Each operator pulls a fresh copy from Apple.

---

## 2. Drop the model into the expected location

Place the downloaded file at exactly this path inside your local checkout:

```text
native/ios/coreml/models/MobileNetV2.mlmodel
```

Create the `native/ios/coreml/models/` directory if it does not already exist (it is gitignored, so a fresh clone will not contain it).

The 016 config plugin verifies this path during `expo prebuild`; an absent file produces a build error that names the expected path and points back to this quickstart.

---

## 3. How the `.mlmodel` becomes a `.mlmodelc` at build time

You do **not** need to compile the model yourself. The Xcode iOS build pipeline runs the `coremlc` compiler automatically as part of the **"Compile Sources"** build phase whenever a `.mlmodel` is declared as a Build File / Bundle Resource:

1. The 016 plugin (`plugins/with-coreml/`) declares the `.mlmodel` as a resource on the iOS app target during prebuild.
2. When `xcodebuild` (invoked locally or by EAS Build) processes the iOS project, it automatically:
   - Runs `coremlc compile MobileNetV2.mlmodel <output>` to produce `MobileNetV2.mlmodelc` (a directory containing the compiled neural-network weights and metadata).
   - Generates a Swift class for type-safe model access (we do not use this; the bridge loads the `.mlmodelc` via `MLModel(contentsOf:)` for forward compatibility with multiple models).
   - Copies `MobileNetV2.mlmodelc` into the app bundle at `<App>.app/MobileNetV2.mlmodelc`.
3. At runtime, `CoreMLBridge.swift` locates the compiled model via:
   ```swift
   guard let url = Bundle.main.url(forResource: "MobileNetV2", withExtension: "mlmodelc") else { ... }
   let model = try MLModel(contentsOf: url, configuration: cfg)
   ```

**Key takeaway**: you commit / drop the source `.mlmodel`, and Xcode handles the compile-and-bundle step transparently.

---

## 4. Confirm the model file is gitignored

The repository's `.gitignore` includes:

```text
# CoreML model artifacts (operator-supplied; not redistributed)
native/ios/coreml/models/*.mlmodel
native/ios/coreml/models/*.mlpackage
native/ios/coreml/models/*.mlmodelc
```

Verify with:

```bash
git check-ignore -v native/ios/coreml/models/MobileNetV2.mlmodel
```

You should see output indicating the path is matched by the `.gitignore` rule, e.g.:

```text
.gitignore:NN:native/ios/coreml/models/*.mlmodel    native/ios/coreml/models/MobileNetV2.mlmodel
```

A subsequent `git status` after dropping the file MUST NOT list the model under "Untracked files". If it does, the `.gitignore` entry is missing or wrong — fix that first; do not commit the model.

---

## 5. EAS Build verification

With the model in place:

```bash
pnpm install
pnpm exec expo prebuild --clean    # plugin verifies model presence here
eas build --platform ios            # produces a real device-installable .ipa
```

Expected outcomes:

| Stage | Pass condition | Failure message you would see |
|-------|----------------|-------------------------------|
| `expo prebuild` | Plugin logs `[with-coreml] Verified MobileNetV2.mlmodel at native/ios/coreml/models/` | `[with-coreml] ERROR: model file not found at native/ios/coreml/models/MobileNetV2.mlmodel — download from https://developer.apple.com/machine-learning/models/` (with non-zero exit code) |
| Xcode "Compile Sources" | `coremlc` produces `MobileNetV2.mlmodelc` in the build products | A `coremlc` error about an unsupported model version (very rare with Apple's gallery model) |
| App bundle | `MobileNetV2.mlmodelc` appears at the bundle root | (verifiable post-build by inspecting the `.app` payload) |
| EAS Build artifact | `.ipa` produced and downloadable | (none — if prebuild + Xcode succeeded, the `.ipa` is shipped) |

**If you do not have the model in place**, the build fails at the **prebuild** step within ~5 seconds of `expo prebuild` starting (SC-008). You will not waste an EAS Build minute on a doomed iOS compile.

---

## 6. On-device test plan

After installing the build on a real iOS 13+ device (the simulator works for CPU/GPU paths but the Neural Engine is unavailable in the simulator):

### 6a. Bundled sample → top-5 predictions + perf metrics (US-1, P1)

1. Open the spot app and navigate to **Modules → CoreML Lab**.
2. Confirm the screen renders, in order:
   - **Image Source Picker** ("Pick from Photo Library" / "Pick a sample image" buttons).
   - **Sample Image Grid** with 3–4 thumbnail PNGs.
   - **Selected-image preview** (initially empty).
   - **"Run Inference" button** (initially **disabled**).
   - **Predictions Chart** (initially empty placeholder).
   - **Performance Metrics** row (initially `— ms · —`).
   - **Model Picker** segmented control showing **MobileNetV2** selected.
3. Tap a bundled sample (e.g., the labrador). The thumbnail highlights; the inference button enables.
4. Tap **Run Inference**. Within ~100 ms on A14+ (or ~500 ms on simulator / older devices):
   - The Predictions Chart animates 5 bars from 0 → confidence over ~300 ms.
   - Each bar is labelled with a class name and a percentage (e.g., `Labrador retriever — 87.4%`).
   - Bars are sorted descending by confidence.
   - The Performance Metrics row updates to e.g. `73 ms · CPU+NeuralEngine` on A12+ hardware.
5. Tap a different sample, then **Run Inference** again. The chart resets to empty and re-animates with the new top-5.

### 6b. Photo Library path (US-2, P2)

1. Tap **Pick from Photo Library**. The system permission prompt appears (first launch only). Grant access.
2. Pick any photo. The picker dismisses; the chosen photo replaces the sample as the selected image (shown as a preview thumbnail).
3. Tap **Run Inference**. Top-5 predictions render identically to the bundled-sample path.
4. *(Optional negative test)* Revoke Photo Library access in **Settings → Privacy → Photos → spot**, return to the app, tap **Pick from Photo Library** again. The screen surfaces a non-crashing inline status: `Photo Library access denied — pick a sample image instead`. The bundled samples remain functional.

### 6c. Re-entry guard

1. Pick a sample, tap **Run Inference**, and immediately rapid-tap the button several more times.
2. Verify only **one** inference completes (the button enters a non-interactive "running" state for the duration; subsequent taps are no-ops). FR-022.

### 6d. Console.app sanity (optional)

For deep verification, connect the device to a Mac, open **Console.app**, and filter on the spot app's process. The bridge logs `[CoreMLBridge] loadModel(MobileNetV2) — computeUnits=...` and `[CoreMLBridge] classify — Nms` on each call.

---

## 7. Expected fallback behaviour on Android / Web

Run the app on Android (`pnpm android`) and on web (`pnpm web`):

1. Open **Modules → CoreML Lab**.
2. **Verify**:
   - A prominent banner reads **"CoreML is iOS-only"** at the top of the screen.
   - The Image Source Picker, Sample Image Grid, Predictions Chart shell, Performance Metrics shell, and Model Picker **all render** for educational continuity (FR-011).
   - Tapping a sample image **does** select it visually (the thumbnail highlights).
   - The **"Run Inference" button is disabled**, with an accessible label / tooltip "CoreML is iOS-only" (NFR-004).
3. **Verify** that the JS console shows **zero exceptions**. Internally:
   - `bridge.isAvailable()` returns `false` synchronously.
   - The screen never invokes `bridge.loadModel()` or `bridge.classify()` because of the `isAvailable` short-circuit.
   - Any defensive direct call to `bridge.classify()` would reject with `CoreMLNotSupported`, caught and surfaced as an inline status message — never an unhandled rejection.
4. **Verify** the screen is keyboard-and-screen-reader navigable end-to-end.

This is the **dominant verification path on Windows + CI** — the entire JS-pure surface (reducer, components, bridge contract with mocked native, plugin against fixtures) runs green under `pnpm check` with no native dependencies.

---

## 8. Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `expo prebuild` fails with `[with-coreml] ERROR: model file not found` | Model not downloaded / placed in wrong path | Download from <https://developer.apple.com/machine-learning/models/> and drop at `native/ios/coreml/models/MobileNetV2.mlmodel` |
| Prebuild succeeds but Xcode build fails in `coremlc` | Corrupt or partial download | Re-download the model; verify the file is ~17 MB |
| Inference button stays disabled even after picking a sample | Model failed to load (check Console.app) | Confirm `MobileNetV2.mlmodelc` is present in the installed app bundle (`.app` payload inspection) |
| Performance Metrics shows `CPU` only on a modern device | Device is older than A12 (no Neural Engine) | Expected — ANE availability is hardware-gated; CPU/GPU still produce correct results |
| iOS-only banner appears on a real iOS 13+ device | `bridge.isAvailable()` returned false | Verify the iOS deployment target is ≥ 13.0 and the native module compiled — check Xcode build logs |
| Module missing from the Modules grid on iOS < 13 | Manifest sets `minIOS: '13.0'`; older iOS is filtered by the 006 registry | Expected; upgrade the device or test on iOS 13+ |
| Chart is empty after a "successful" run | Model loaded but classification returned an empty result | Check Console.app for `[CoreMLBridge] classify` errors; very rare with MobileNetV2 + standard images |

---

## 9. Reference

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Contracts: [contracts/](./contracts/)
- Apple developer model gallery: <https://developer.apple.com/machine-learning/models/>
- Apple CoreML framework docs: <https://developer.apple.com/documentation/coreml>
- Apple Vision framework docs: <https://developer.apple.com/documentation/vision>
- `expo-image-picker`: <https://docs.expo.dev/versions/latest/sdk/imagepicker/>
