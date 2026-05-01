# Quickstart: 080 — Live Text

## Prerequisites

- iOS 13+ device for Vision OCR fallback
- iOS 16+ device for DataScannerViewController and ImageAnalysisInteraction
- Camera permission granted

## Running

```bash
pnpm ios
# Navigate: Modules → Live Text
```

## Testing

```bash
pnpm test -- --testPathPattern=live-text
```

## Key APIs

| API | Tier | Notes |
|-----|------|-------|
| `VNRecognizeTextRequest` | iOS 13+ | Vision OCR on static images |
| `DataScannerViewController` | iOS 16+ | Live camera scanning |
| `ImageAnalysisInteraction` | iOS 16+ | Long-press text overlay |

## Plugin

Added to `app.json` as `./plugins/with-live-text`. Injects `NSCameraUsageDescription`.
