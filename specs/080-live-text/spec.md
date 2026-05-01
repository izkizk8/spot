# Spec: 080 — Live Text (Image OCR)

## Overview

Educational lab demonstrating iOS Live Text capabilities:
- **DataScannerViewController** (iOS 16+) — live camera OCR scanning
- **ImageAnalysisInteraction** (iOS 16+) — long-press text interaction on static images
- **VNRecognizeTextRequest** (iOS 13+) — fallback Vision-framework OCR

## Feature ID

`080-live-text` | Slug: `live-text-lab`

## iOS APIs

| API | Min iOS | Purpose |
|-----|---------|---------|
| `DataScannerViewController` | 16.0 | Live camera text / barcode scanning |
| `ImageAnalysisInteraction` | 16.0 | System text interaction overlay on still images |
| `VNRecognizeTextRequest` | 13.0 | Vision-based OCR on static images (fallback) |

## Platforms

- **iOS** — full feature (tiered by OS version)
- **Android / Web** — `IOSOnlyBanner`

## Bridge Surface (`LiveTextBridge`)

```ts
getCapabilities(): Promise<LiveTextCapabilities>
recognizeText(base64Image: string): Promise<OCRResult>
startScanner(config: ScannerConfig): Promise<ScanSession>
stopScanner(sessionId: string): Promise<void>
```

## Module Manifest

- `id`: `live-text-lab`
- `title`: `Live Text`
- `minIOS`: `13.0`
- `platforms`: `['ios', 'android', 'web']`

## Plugin

`with-live-text` — adds `NSCameraUsageDescription` to `Info.plist`.
