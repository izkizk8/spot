---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (WidgetKit Lock Screen widgets require native iOS build)
  - iPhone running iOS 16+
  - Apple Developer account (free tier sufficient)
---

# How to verify Lock-Screen Widgets on iPhone

## Goal
Confirm accessory circular, rectangular, and inline WidgetKit widgets install and
appear on the Lock Screen, receive timeline updates when the app deep-links a
refresh, and the widget entry taps open the correct in-app screen.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- `with-lock-widgets` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Lock Screen Widgets"** in the Modules tab.
5. Tap **Open Widget Gallery** to confirm no crash and instructions displayed.
6. Lock the iPhone (side button).
7. Long-press the Lock Screen → choose **Customize** → tap the widget zone below
   the clock.
8. Find **Spot** in the widget picker and add the **Circular**, **Rectangular**,
   and **Inline** widgets.
9. Tap **Done** to save the Lock Screen.
10. Back in the app, tap **Reload Timelines** → unlock and verify the widget data
    has refreshed.
11. Tap a widget directly on the Lock Screen → verify the app opens to the correct
    screen.

## Verify
- All three widget sizes appear in the iOS widget picker
- Widgets render data without white box or crash
- Reload Timelines from app triggers an observable widget update
- Tapping widget on Lock Screen deep-links to the expected in-app route
- On iOS < 16: in-app banner "Lock Screen Widgets require iOS 16+"; module hidden

## Troubleshooting
- **Widget extension not in picker** → ensure `with-lock-widgets` is in `app.json` plugins
  and a fresh `npx expo prebuild --clean` was run before building
- **Widget shows placeholder dashes** → timeline provider's `getTimeline` may
  be returning empty entries; check Xcode console for extension log
- **Tap does not deep-link** → verify `widgetURL` is set in SwiftUI view and
  `expo-router` link scheme is registered in `app.json`

## Implementation references
- Spec: `specs/027-lock-screen-widgets/spec.md`
- Plan: `specs/027-lock-screen-widgets/plan.md`
- Module: `src/modules/lock-widgets-lab/`
- Native extension: `native/ios/lock-widgets/`
- Plugin: `plugins/with-lock-widgets/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows