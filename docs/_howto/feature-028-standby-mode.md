---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (WidgetKit StandBy requires native iOS build)
  - iPhone running iOS 17+ (StandBy activates when charging in landscape)
  - Apple Developer account (free tier sufficient)
---

# How to verify StandBy Mode Widget on iPhone

## Goal
Confirm the WidgetKit StandBy widget renders in the iOS 17 StandBy full-screen
clock slot, receives timeline updates, and correctly handles the supported widget
families (`systemSmall` used as StandBy slot).

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 17+ with StandBy enabled in Settings → StandBy
- `with-standby-widget` plugin registered in `app.json`
- Lightning / USB-C charger available to activate StandBy

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
4. In the app, navigate to **"StandBy Lab"** in the Modules tab.
5. Confirm the StandBy status card shows **"Available on iOS 17+"**.
6. Plug in the iPhone and lay it face-up in landscape on the charger.
7. StandBy mode activates after a few seconds (tap the screen if needed).
8. Swipe left through the widget pages until the **Spot** StandBy widget appears.
9. Back in the app, tap **Reload Timeline** → observe the widget data refresh.

## Verify
- StandBy widget appears in the Spot widget page on the charging iPhone
- Data displayed in the widget matches the most recent timeline entry
- Reload Timeline from the app triggers an observable StandBy widget update
- On iOS < 17: in-app banner "StandBy requires iOS 17+"; module grayed out

## Troubleshooting
- **StandBy widget not appearing** → ensure `with-standby-widget` is in `app.json`
  plugins and a fresh prebuild was run; also confirm Settings → StandBy is enabled
- **Widget shows static placeholder** → timeline provider may be returning nil;
  check Xcode console for the widget extension log
- **StandBy does not activate** → the iPhone must be on a charger AND in landscape
  AND locked; ambient display must be active

## Implementation references
- Spec: `specs/028-standby-mode/spec.md`
- Plan: `specs/028-standby-mode/plan.md`
- Module: `src/modules/standby-lab/`
- Native extension: `native/ios/standby-widget/`
- Plugin: `plugins/with-standby-widget/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows