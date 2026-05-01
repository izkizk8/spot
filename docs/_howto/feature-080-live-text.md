---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 16+ (full feature; Vision OCR fallback works on iOS 13+)
  - Apple Developer account (free tier is sufficient)
---

# How to verify Live Text OCR on iPhone

## Goal

Scan a document or handwritten note with the camera using `DataScannerViewController`
(iOS 16+), confirm recognised text is extracted and copyable, and verify the
`VNRecognizeTextRequest` Vision fallback works on iOS 13+.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 16+ for live camera scanning; iOS 13+ for static-image OCR
- Camera permission (prompted at first launch)
- Free Apple Developer account
- `pnpm install` already run

## Steps

1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   ```
3. Open `ios/Spot.xcworkspace` in Xcode, select your personal team under
   **Signing & Capabilities**, and connect your iPhone.
4. Build and run with **Product → Run** (⌘R).
5. In the app, open the **Modules** tab and tap **Live Text**.
6. Grant camera access when prompted (required for `DataScannerViewController`).
7. The live camera viewfinder opens. Point it at printed or handwritten text.
8. Recognised text highlights appear over the words in the viewfinder.
9. Tap a highlighted word to select it; tap **Copy** in the callout.
10. Confirm the copied text matches the source text.
11. Tap **Scan Image** to run `VNRecognizeTextRequest` on the bundled static
    sample image — recognised text appears below the image card.

## Verify

- Camera viewfinder opens and shows live text highlights on text-containing surfaces
- Tapping a highlight shows the copy/look-up callout
- Static image scan returns the expected OCR text within ~1 second
- `NSCameraUsageDescription` is present in the built Info.plist

## Troubleshooting

- **Camera permission denied** → grant in **Settings → Privacy → Camera → Spot**
- **No highlights in viewfinder** → ensure good lighting; the device must run iOS 16+
  for `DataScannerViewController`; on iOS 13–15 only static-image OCR is available
- **Static image OCR returns empty string** → Vision may need a moment for the first
  request; try tapping **Scan Image** again
- **`NSCameraUsageDescription` missing** → run `npx expo prebuild --clean`; the
  `with-live-text` plugin injects the key

## Implementation references

- Spec: `specs/080-live-text/spec.md`
- Plan: `specs/080-live-text/plan.md`
- Module: `src/modules/live-text-lab/`
- Native bridge: `src/native/live-text.ts`
- Plugin: `plugins/with-live-text/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows