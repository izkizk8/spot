---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 15+
  - Apple Developer account (free tier is sufficient)
---

# How to verify Visual Look Up on iPhone

## Goal

Long-press an image in the Visual Look Up lab to trigger `ImageAnalysisInteraction`,
and tap **Analyse Demo** to confirm `VNImageAnalyzer` runs on the bundled image and
returns subject / Look Up results.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 15+ (`VNImageAnalyzer` and `ImageAnalysisInteraction` require iOS 15)
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
5. In the app, open the **Modules** tab and tap **Visual Look Up**.
6. Tap **Analyse Demo** — `VNImageAnalyzer` processes the bundled placeholder image
   and the result summary appears below the image card.
7. Long-press the image view — `ImageAnalysisInteraction` activates and the iOS
   "Look Up" popover (info bubble) becomes visible.
8. Tap the info bubble to open a Visual Look Up sheet (subject details, web results).

## Verify

- "Analyse Demo" shows an analysis result with at least one subject detected
- Long-press on the image reveals the system Look Up callout
- The callout opens a system panel (iOS 15+); no crash on long-press

## Troubleshooting

- **Long-press does nothing on iOS 14** → Visual Look Up requires iOS 15+; the lab
  shows an iOS-version warning banner on unsupported OS versions
- **"Analyse Demo" returns empty subjects** → network connectivity is not required;
  if result is empty on device try a different photo with a clear foreground subject
- **Build fails with missing `NSPhotoLibraryUsageDescription`** → run
  `npx expo prebuild --clean`; injected by the `with-visual-look-up` plugin

## Implementation references

- Spec: `specs/060-visual-look-up/spec.md`
- Plan: `specs/060-visual-look-up/plan.md`
- Module: `src/modules/visual-look-up-lab/`
- Native bridge: `src/native/visual-look-up.ts`
- Plugin: `plugins/with-visual-look-up/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows