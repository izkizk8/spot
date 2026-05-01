# Plan: 080 — Live Text (Image OCR)

## Architecture

```
src/modules/live-text-lab/
  index.tsx                    ← ModuleManifest
  screen.tsx                   ← iOS screen (DataScanner + ImageAnalysis + Vision)
  screen.android.tsx           ← IOSOnlyBanner
  screen.web.tsx               ← IOSOnlyBanner
  hooks/
    useLiveText.ts             ← state machine (bridge seam + __set for tests)
  components/
    IOSOnlyBanner.tsx
    CapabilityCard.tsx
    OCRResultCard.tsx
    SampleImageCard.tsx
    SetupGuide.tsx

src/native/
  live-text.types.ts           ← types + error class
  live-text.ts                 ← iOS bridge (requireOptionalNativeModule)
  live-text.android.ts         ← stub (reject all)
  live-text.web.ts             ← stub (reject all)

plugins/with-live-text/
  index.ts                     ← NSCameraUsageDescription
  package.json

test/unit/modules/live-text-lab/
  manifest.test.ts
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx
  useLiveText.test.tsx
  components/
    IOSOnlyBanner.test.tsx
    CapabilityCard.test.tsx
    OCRResultCard.test.tsx

test/unit/plugins/with-live-text/
  index.test.ts
```

## Decisions

- `minIOS: '13.0'` so VNRecognizeTextRequest fallback is documented
- Plugin injects `NSCameraUsageDescription` only (DataScannerViewController)
- Bridge `getCapabilities()` surfaces which tier is available
