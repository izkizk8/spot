---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 13+
  - Apple Developer account (free tier is sufficient)
---

# How to verify Core Image filters on iPhone

## Goal

Apply each of the six built-in `CIFilter` effects (sepia, Gaussian blur, vignette,
colour-invert, photo-noir, luminance-sharpen) to the reference image and confirm
the GPU-accelerated output renders correctly on device.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 13+ (GPU-accelerated `CIContext` path requires iOS 13)
- Free Apple Developer account (no entitlements required)
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
5. In the app, open the **Modules** tab and tap **Core Image**.
6. The reference image appears with a filter selector below it.
7. Tap each filter name (Sepia, Blur, Vignette, Invert, Noir, Sharpen) and
   confirm the preview updates in real-time.
8. Adjust the intensity slider where available and confirm the filter responds.
9. Tap **Apply** to commit the filter and observe the processed image.

## Verify

- Each filter name applies a visually distinct effect to the reference image
- Slider adjustments change the output continuously without freezing
- Switching filters resets the slider to the default value
- **Apply** produces a processed image (not a blank or unmodified output)

## Troubleshooting

- **Preview is blank or all-grey** → confirm iOS 13+ device; check the
  Xcode console for `CIContext` init errors
- **Sharpen filter shows no visible change** → luminance-sharpen requires
  a high-resolution source image; the bundled reference is intentionally
  low-res for speed — use the picker to choose a higher-res photo
- **App crashes on filter apply** → check Xcode console for Metal errors;
  ensure the device is not in Low Power mode which can restrict GPU access

## Implementation references

- Spec: `specs/064-core-image/spec.md`
- Plan: `specs/064-core-image/plan.md`
- Module: `src/modules/064-core-image/`
- Native bridge: `src/native/core-image.ts`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows