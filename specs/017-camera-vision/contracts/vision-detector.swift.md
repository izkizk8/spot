# Phase 1 contract — Native Swift surface for feature 017 (Camera + Vision)

This document is the AUTHORITATIVE Swift surface contract for the native module to be implemented at:

- `native/ios/vision/VisionDetector.swift`
- `native/ios/vision/Vision.podspec`

The contract pairs with [`vision-bridge.contract.ts`](./vision-bridge.contract.ts), which is the JS-side surface. Together they define the boundary between the React Native layer and Apple's Vision framework.

The Swift module mirrors the precedent set by feature 016's `native/ios/coreml/CoreMLBridge.swift` and feature 015's `native/ios/screentime/ScreenTimeBridge.swift` (both via `expo-modules-core`'s `Module` DSL).

---

## 1. Podspec

`native/ios/vision/Vision.podspec` declares the Swift module to CocoaPods / `expo-modules-core` autolinking. Required attributes:

```ruby
Pod::Spec.new do |s|
  s.name             = 'Vision'             # matches the requireOptionalNativeModule name on the JS side
  s.version          = '1.0.0'
  s.summary          = 'spot 017 — Camera + Vision Live Frames bridge'
  s.platforms        = { :ios => '13.0' }   # matches manifest.minIOS
  s.source_files     = '*.swift'
  s.dependency 'ExpoModulesCore'
  s.frameworks       = 'Vision', 'CoreImage'  # CoreImage is needed for CGImage from base64
  s.swift_version    = '5.9'
end
```

The framework declarations on `s.frameworks` are how Vision is linked into the iOS app target — the config plugin does **not** mutate the Xcode project to add these (research.md R-005). `CoreImage` is a transitive dependency for the `CIImage` → `CGImage` path used when decoding base64 payloads.

---

## 2. Module surface

### Module registration

```swift
import ExpoModulesCore
import Vision
import CoreImage
import UIKit

public class VisionDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Vision")

    AsyncFunction("analyze") { (mode: String, payload: [String: String]) -> [String: Any] in
      // Implementation below.
    }
  }
}
```

`isAvailable()` on the JS side is implemented by checking `requireOptionalNativeModule('Vision') !== null` plus `Platform.OS === 'ios'`; no Swift method is required for it.

### Method: `analyze(mode:payload:)`

**Signature** (as exposed to JS via `expo-modules-core`):

```ts
// JS-side type
analyze(mode: 'faces' | 'text' | 'barcodes', payload: { base64?: string; uri?: string })
  : Promise<{
      observations: Observation[];
      analysisMs: number;
      imageWidth: number;
      imageHeight: number;
    }>
```

**Swift-side handler** (pseudocode — the implementation file fleshes this out with full error handling):

```swift
AsyncFunction("analyze") { (mode: String, payload: [String: String]) -> [String: Any] in
  // 1. Validate payload (InvalidInput contract).
  let base64 = payload["base64"]
  let uri    = payload["uri"]
  switch (base64, uri) {
    case (nil, nil):                     throw InvalidInputError("payload requires base64 or uri")
    case (.some, .some):                 throw InvalidInputError("payload accepts only one of base64 or uri")
    default: break
  }

  // 2. Decode the image to a CGImage.
  let cgImage: CGImage
  let imageWidth: Int
  let imageHeight: Int
  if let b64 = base64 {
    guard let data = Data(base64Encoded: b64),
          let uiImage = UIImage(data: data),
          let cg = uiImage.cgImage else {
      throw InvalidInputError("base64 payload could not be decoded")
    }
    cgImage = cg
  } else {
    guard let url = URL(string: uri!),
          let provider = CGDataProvider(url: url as CFURL),
          // ... PNG / JPEG decode through ImageIO ...
          let cg = decodedImage else {
      throw InvalidInputError("uri payload could not be loaded")
    }
    cgImage = cg
  }
  imageWidth  = cgImage.width
  imageHeight = cgImage.height

  // 3. Build the request for the requested mode.
  let request: VNRequest
  switch mode {
    case "faces":    request = VNDetectFaceRectanglesRequest()
    case "text":
      let r = VNRecognizeTextRequest()
      r.recognitionLevel = .fast        // research.md R-002
      request = r
    case "barcodes": request = VNDetectBarcodesRequest()
    default:         throw InvalidInputError("unknown mode: \(mode)")
  }

  // 4. Perform the request, measuring wall-clock duration.
  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
  let start = CFAbsoluteTimeGetCurrent()
  do {
    try handler.perform([request])
  } catch {
    throw VisionAnalysisFailedError("\(error)")
  }
  let analysisMs = Int(((CFAbsoluteTimeGetCurrent() - start) * 1000.0).rounded())

  // 5. Convert observations to the JS-side shape, flipping Y to top-left origin.
  let observations: [[String: Any]] = (request.results ?? []).compactMap { result in
    guard let bbox = (result as? VNDetectedObjectObservation)?.boundingBox else { return nil }
    let yTop = 1.0 - (bbox.origin.y + bbox.height)             // research.md R-003
    let normalized: [String: Any] = [
      "x":      bbox.origin.x,
      "y":      yTop,
      "width":  bbox.width,
      "height": bbox.height,
    ]
    switch result {
      case let face as VNFaceObservation:
        return ["kind": "face", "boundingBox": normalized]
      case let txt as VNRecognizedTextObservation:
        let text = txt.topCandidates(1).first?.string ?? ""
        return ["kind": "text", "boundingBox": normalized, "text": text]
      case let bar as VNBarcodeObservation:
        var entry: [String: Any] = [
          "kind":        "barcode",
          "boundingBox": normalized,
          "payload":     bar.payloadStringValue ?? "",
        ]
        // Strip the 'VNBarcodeSymbology' prefix (e.g., "VNBarcodeSymbologyQR" → "QR").
        let raw = bar.symbology.rawValue
        if raw.hasPrefix("VNBarcodeSymbology") {
          entry["symbology"] = String(raw.dropFirst("VNBarcodeSymbology".count))
        }
        return entry
      default: return nil
    }
  }

  // 6. Log + return.
  NSLog("[VisionDetector] analyze(\(mode)) — \(analysisMs)ms — \(observations.count) observations")
  return [
    "observations": observations,
    "analysisMs":   analysisMs,
    "imageWidth":   imageWidth,
    "imageHeight":  imageHeight,
  ]
}
```

---

## 3. Error envelope

Every error path MUST surface as one of three typed `expo-modules-core` rejections. No Swift error may escape the `AsyncFunction` handler as an uncaught exception (NFR-006).

### `InvalidInputError`

Thrown when the JS payload contract is violated:
- Both `base64` and `uri` present.
- Neither `base64` nor `uri` present.
- `base64` cannot be decoded as image data.
- `uri` does not resolve to a readable image.
- `mode` is not one of the three accepted values (defensive — JS-side types prevent this).

JS rejection name: `InvalidInput`. JS Error subclass: `InvalidInput` (see `vision-bridge.contract.ts`).

### `VisionAnalysisFailedError`

Thrown when `VNImageRequestHandler.perform([request])` itself throws, or when `request.results` is `nil` after a successful `perform` (Vision's documented "ran but produced no results structure" failure mode — distinct from "ran and produced an empty results array", which is a successful result).

JS rejection name: `VisionAnalysisFailed`. JS Error subclass: `VisionAnalysisFailed`.

### Module-not-registered

Surfaced **JS-side** by `requireOptionalNativeModule('Vision') === null`. The `isAvailable()` JS method returns `false` in this case, and `analyze()` (in the iOS file) rejects with `VisionNotSupported` rather than calling into Swift. There is no Swift-side `VisionNotSupportedError` because the module simply does not exist on non-iOS / iOS < 13 platforms.

---

## 4. Threading

`expo-modules-core`'s `AsyncFunction` runs on an internal serial dispatch queue, off the main thread. `VNImageRequestHandler.perform` is synchronous on its caller's thread; running it inside `AsyncFunction` keeps it off the JS thread and off the main / UI thread. No additional `DispatchQueue.global` or `OperationQueue` plumbing is required.

The hook's overlap-skip invariant (R-010) is enforced JS-side; the Swift module does not need to track in-flight calls (concurrent calls are legal and would each return their own result, but the hook does not issue them).

---

## 5. Coordinate-space conversion (the critical detail)

Apple Vision's `boundingBox` is `CGRect` in normalized `[0, 1]` with origin at the **bottom-left** of the image. React Native uses **top-left** origin. The Swift bridge MUST perform the conversion before crossing the JS boundary:

```swift
let yTop = 1.0 - (bbox.origin.y + bbox.height)
```

This is documented in three places (research.md R-003, data-model.md §1, and the Swift source) because it is the single most likely place for a bug that ships ("face boxes appear at the bottom of the screen") and the most subtle to debug.

---

## 6. Test coverage from the JS side

Although the Swift source has no Windows-runnable test, the JS-side bridge contract test (`test/unit/native/vision-detector.test.ts`) covers the **boundary** by jest-mocking the native module:

- `bridge.isAvailable()` returns the platform-appropriate boolean.
- `.android.ts` and `.web.ts` stubs reject with `VisionNotSupported`.
- iOS `analyze()` rejects with `InvalidInput` when both `base64` and `uri` are present.
- iOS `analyze()` rejects with `InvalidInput` when neither is present.
- iOS `analyze()` resolves to the `AnalysisResult` shape when the mocked native module returns a fixture.

The test does NOT verify the contents of the bounding-box conversion (that lives in Swift); it verifies the *shape* of what comes back is contract-conformant.

---

## 7. Reference

- JS contract: [`vision-bridge.contract.ts`](./vision-bridge.contract.ts)
- Plan: [`../plan.md`](../plan.md)
- Research: [`../research.md`](../research.md) (R-002, R-003, R-005, R-010)
- Data model: [`../data-model.md`](../data-model.md)
- Quickstart: [`../quickstart.md`](../quickstart.md)
- Apple Vision framework: <https://developer.apple.com/documentation/vision>
- `VNDetectedObjectObservation.boundingBox` (origin convention): <https://developer.apple.com/documentation/vision/vnrectangleobservation/2867227-boundingbox>
- `expo-modules-core` `Module` DSL: <https://docs.expo.dev/modules/module-api/>
