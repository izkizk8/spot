---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (UIApplicationShortcutItem requires native iOS build)
  - iPhone running iOS 9+ with 3D Touch or Haptic Touch
  - Apple Developer account (free tier sufficient)
---

# How to verify Quick Actions (Home Screen Shortcuts) on iPhone

## Goal
Confirm static and dynamic UIApplicationShortcutItems appear in the Home Screen
long-press menu, tapping a shortcut deep-links to the correct in-app screen, and
dynamic shortcuts can be added and removed at runtime.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 9+
- `with-quick-actions` plugin registered in `app.json` (adds `UIApplicationShortcutItems`
  to Info.plist for static shortcuts)

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
4. In the app, navigate to **"Quick Actions"** in the Modules tab.
5. Tap **Add Dynamic Shortcut** → fill title "Open Lab" → **Add**.
6. Press the Home button; long-press the Spot app icon → confirm shortcut menu shows
   both the static shortcut (from Info.plist) and the "Open Lab" dynamic shortcut.
7. Tap the "Open Lab" shortcut — app opens and navigates to the correct screen.
8. Back in the module, tap **Remove Dynamic Shortcut** → long-press icon again →
   confirm dynamic shortcut is gone; static shortcut remains.

## Verify
- Static shortcut from Info.plist always appears in the long-press menu
- Dynamic shortcut added at runtime appears in the menu
- Tapping a shortcut deep-links to the correct in-app route
- Removing a dynamic shortcut removes it from the menu
- On Android: App Shortcuts (ShortcutManager) equivalent tested
- On web: "Quick Actions is iOS/Android only" banner

## Troubleshooting
- **No shortcut menu on long-press** → ensure the app icon is not in a folder;
  also confirm Haptic Touch is enabled in Settings → Accessibility → Touch → Haptic Touch
- **Static shortcuts not appearing** → `UIApplicationShortcutItems` must be in the
  root app Info.plist (not extension Info.plist); verify plugin output
- **Deep link not firing on shortcut tap** → confirm `application(_:performActionFor:completionHandler:)`
  is implemented in AppDelegate and routes `shortcutItem.type`

## Implementation references
- Spec: `specs/039-quick-actions/spec.md`
- Plan: `specs/039-quick-actions/plan.md`
- Module: `src/modules/quick-actions-lab/`
- Native bridge: `src/native/quick-actions.ts`
- Plugin: `plugins/with-quick-actions/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows