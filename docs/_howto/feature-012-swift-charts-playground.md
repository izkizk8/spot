---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Swift Charts native extension requires iOS build)
  - iPhone running iOS 16+ (Swift Charts framework requires iOS 16)
  - Apple Developer account (free tier sufficient)
---

# How to verify Swift Charts Playground on iPhone

## Goal
Confirm that a native Swift Charts view renders Line, Bar, Area, and Point charts,
responds to dataset mutations (Randomize, Add, Remove), tint changes, and mark
selection — all via the React Native bridge.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- Native rebuild required (`npx expo run:ios`) to include the Swift Charts extension

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate and build native project (macOS only):
   ```bash
   npx expo prebuild --clean
   npx expo run:ios --device
   ```
   The local Swift extension lives at `src/modules/swift-charts-lab/native/ios/`.
3. In the app, navigate to **"Swift Charts Lab"** in the Modules tab.
4. Confirm a real Swift Charts line chart renders with 12-month data, at least 300 pt tall.
5. Tap **Bar** — chart morphs to bars with animation (~0.3 s).
6. Tap **Randomize data** — all marks animate to new values.
7. Tap **Add point** up to 24; tap **Remove point** back down to 2 — buttons
   disable at the respective bounds.
8. Tap each of the 4 tint swatches — chart marks recolor within ~300 ms.
9. Tap a bar to see the inline indicator (month label + value); tap elsewhere to dismiss.

## Verify
- Real Swift Charts view renders (not a JS fallback) on iOS 16+
- All four chart types (Line, Bar, Area, Point) transition with animation
- Add/Remove buttons disable correctly at bounds (24 max, 2 min)
- Mark selection indicator appears on tap and dismisses on Randomize or type-change
- iOS 15: module card is hidden/unavailable (registry minIOS gating)
- Android/web: "iOS 16+ only" banner, all controls interactive, fallback LayoutAnimation chart

## Troubleshooting
- **Swift Charts card missing on iOS 16+** → confirm native rebuild was done with
  `npx expo run:ios`; the `Charts` framework requires a CocoaPods install pass
- **Chart type transitions don't animate** → verify the Swift extension's
  `withAnimation(.default)` call wraps the series update
- **Mark selection doesn't appear on iOS 16** → `chartXSelection` is iOS 17+ only;
  iOS 16 falls back to a tap-gesture per research.md Decision 1

## Implementation references
- Spec: `specs/012-swift-charts-playground/spec.md`
- Plan: `specs/012-swift-charts-playground/plan.md`
- Module: `src/modules/swift-charts-lab/`
- Native extension: `src/modules/swift-charts-lab/native/ios/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows