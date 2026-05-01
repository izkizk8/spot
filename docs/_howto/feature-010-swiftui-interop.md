---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (SwiftUI controls require native iOS build)
  - iPhone running iOS 16+ (SwiftUI bridge requires iOS 16; @expo/ui requirement)
  - Apple Developer account (free tier sufficient)
---

# How to verify SwiftUI Interop on iPhone

## Goal
Confirm that five SwiftUI controls (Picker, ColorPicker, DatePicker, Slider,
Stepper/Toggle) render natively via `@expo/ui` and that value changes propagate
back to React Native within ~100 ms.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- `@expo/ui` installed (`npx expo install @expo/ui`)
- Free Apple Developer account

## Steps
1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   npx expo run:ios --device
   ```
3. In the app, navigate to **"SwiftUI Interop"** in the Modules tab.
4. Scroll through the five blocks: Native Picker, Native ColorPicker,
   Native DatePicker, Native Slider, Native Stepper / Toggle.
5. In the **Picker** block, change the segmented or wheel picker — the RN text
   echo below updates within ~100 ms.
6. In the **ColorPicker** block, tap the SwiftUI swatch and pick a new color —
   the RN preview swatch re-tints.
7. In the **Slider** block, drag end-to-end — the RN bar width tracks with no
   visible lag.
8. In the **Stepper/Toggle** block, tap +/− and flip the toggle — the RN readout
   updates immediately.

## Verify
- All five SwiftUI blocks render real SwiftUI controls on iOS 16+
- Value changes from SwiftUI propagate to RN within ~100 ms
- Each block shows a caption naming the SwiftUI control and its RN echo
- On Android: banner reads "SwiftUI is iOS-only — here's the Material counterpart"
  with Material fallback controls rendered
- On web: banner reads "Native SwiftUI is iOS-only" with HTML/RN-Web equivalents

## Troubleshooting
- **Blank screen on iOS 16+** → ensure `@expo/ui` is installed and a native
  rebuild was done (`npx expo prebuild --clean`)
- **SwiftUI Interop card hidden** → module is gated to iOS 16+; confirm device OS
- **Value echoes don't update** → verify `@expo/ui` version matches Expo SDK 55

## Implementation references
- Spec: `specs/010-swiftui-interop/spec.md`
- Plan: `specs/010-swiftui-interop/plan.md`
- Module: `src/modules/swiftui-interop/`
- Tests: `test/unit/modules/swiftui-interop/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows