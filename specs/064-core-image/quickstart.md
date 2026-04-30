# 064 Core Image — Quick Start

## What it does
Showcases six built-in CIFilter effects (sepia, Gaussian blur, vignette, colour-invert,
photo-noir, luminance-sharpen) applied to a reference image on iOS.

## Requirements
- iOS 13+ (CIFilter available since iOS 5; GPU-accelerated path since iOS 13).
- No special entitlements or Info.plist keys required.

## Running
```bash
pnpm ios        # standard Expo Go / dev build
```

Open the Modules tab → "Core Image" → select a filter → adjust sliders → tap Apply.
