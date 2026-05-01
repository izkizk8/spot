---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Widget Extension requires native build)
  - iPhone running iOS 16.1+ (Dynamic Island requires iPhone 14 Pro or newer)
  - Apple Developer account (free tier sufficient for on-device sideloading)
---

# How to verify Live Activities + Dynamic Island on iPhone

## Goal
Start, update, and end an ActivityKit Live Activity and confirm it renders on the
Lock Screen and in the Dynamic Island of a compatible device.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16.1+ (iPhone 14 Pro or newer for Dynamic Island)
- Free Apple Developer account
- `pnpm install` already run
- `@expo/config-plugins` installed (`npx expo install @expo/config-plugins`)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Register the config plugin in `app.json` plugins array:
   `"./plugins/with-live-activity"`
3. Generate native projects on macOS:
   ```bash
   npx expo prebuild --clean --platform ios
   ```
   Verify `ios/spot/Info.plist` contains `NSSupportsLiveActivities: true` and
   `ios/spot.xcodeproj/project.pbxproj` lists a `LiveActivityDemoWidget` target.
4. Build the IPA for sideloading:
   ```bash
   pnpm ios:ipa
   ```
5. Install the IPA on your iPhone per [sideload-iphone.md](sideload-iphone.md).
6. In the app, navigate to **"Live Activity Demo"** in the Modules tab.
7. Tap **Start** — within 1 second the Lock Screen and Dynamic Island show the activity.
8. Tap **Update** — the counter increments on both Lock Screen and Dynamic Island.
9. Tap **End** — the activity disappears from Lock Screen and Dynamic Island.

## Verify
- Lock Screen and Dynamic Island both show the activity after Start
- Counter increments on Update (visible within 500 ms)
- Activity disappears within 1 second of End
- On non-Dynamic Island devices the activity renders on Lock Screen only
- On Android/web the card shows "iOS only" without crashing

## Troubleshooting
- **`requireNativeModule('LiveActivityDemo')` undefined** → rebuild the dev client
  after wiring the plugin (`npx expo prebuild --clean --platform ios`)
- **Activity doesn't appear despite Start succeeding** → check
  Settings → spot → Live Activities is ON and
  Settings → Face ID & Passcode → Allow Access When Locked → Live Activities is ON
- **Idempotency check fails** → see `plugins/with-live-activity/add-widget-extension.ts`;
  existence check must key on stable target name `LiveActivityDemoWidget`

## Implementation references
- Spec: `specs/007-live-activities-dynamic-island/spec.md`
- Plan: `specs/007-live-activities-dynamic-island/plan.md`
- Module: `src/modules/live-activity-demo/`
- Native bridge: `src/native/live-activity.ts`
- Plugin: `plugins/with-live-activity/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows