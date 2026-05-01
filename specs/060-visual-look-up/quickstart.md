# Quick-start — Feature 060 Visual Look Up

## Running the lab (iOS 15+ device or simulator)

```bash
pnpm ios
# Navigate → Visual Look Up
# Tap "Analyse Demo" to run VNImageAnalyzer on the bundled placeholder
# Long-press the image to trigger ImageAnalysisInteraction
```

## Key APIs

| API | Notes |
|-----|-------|
| `VNImageAnalyzer` | Analyse a `CGImage` / data URL; returns `VNAnalysis` with a subject set |
| `ImageAnalysisInteraction` | UIKit overlay added to a `UIImageView`; drives "Look Up" popover |
| `VNAnalysisTypes.visualLookUp` | Opt-in subject look-up alongside `.text`, `.machineReadableCode` |

## Bridging overview

The thin Expo Module `VisualLookUpModule.swift` calls `VNImageAnalyzer.analyze(image, orientation:, analysisTypes:)` and maps the resulting `VNImageAnalysis` subjects to `VisualLookUpBridge.AnalysisResult`.

## Setup checklist

- iOS deployment target ≥ 15.0 (already set in app.json)
- `NSPhotoLibraryUsageDescription` in Info.plist (added by `with-visual-look-up` plugin)
