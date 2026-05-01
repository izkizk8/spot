---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (native build required for full iOS experience)
  - iPhone running iOS 14+ (iOS 17+ recommended for Liquid Glass)
  - Apple Developer account (free tier sufficient)
---

# How to verify iOS Feature Showcase (App Shell, Modules Tab, Liquid Glass) on iPhone

## Goal
Confirm the app shell, Modules tab with module registry, and Liquid Glass Playground
render correctly and that theme persistence works across cold launches.

## Prerequisites
- macOS with Xcode 15+ (or Windows for JS-only verification)
- iPhone running iOS 14+ (iOS 17+ for full Liquid Glass native rendering)
- Free Apple Developer account
- `pnpm install` already run

## Steps
1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Install the async-storage dependency:
   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```
3. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   ```
4. Open `ios/Spot.xcworkspace` in Xcode, select your Apple ID team under
   **Signing & Capabilities**, connect your iPhone, and choose **Product → Run** (⌘R).
5. In the app, confirm four tabs appear: **Home**, **Explore**, **Modules**, **Settings**.
6. Tap the **Modules** tab — the grid of module cards appears.
7. Tap the **Liquid Glass Playground** card. On iOS 17+, three glass surfaces
   react to the blur intensity, tint, and shape controls in real time.
8. Navigate to **Settings**, pick a theme (System / Light / Dark). Verify every
   surface updates immediately. Quit the app and relaunch — the theme is restored.

## Verify
- Four tabs render: Home, Explore, Modules, Settings
- Modules grid populates from the registry with at least one card
- Liquid Glass surfaces respond live on iOS 17+ (translucent fallback on earlier iOS)
- Theme preference persists across cold launches (stored at `spot.theme.preference`)
- Android and web show the documented fallback badge on iOS-only cards

## Troubleshooting
- **Modules tab shows empty grid** → confirm `src/modules/registry.ts` exports `MODULES`
  and the registry is imported by the Modules screen
- **Liquid Glass shows wrong fallback on iOS 17+** → run `npx expo prebuild --clean`
  and rebuild; stale native artifacts may cause rendering issues
- **Theme not persisted** → verify `@react-native-async-storage/async-storage` is
  installed (`npx expo install @react-native-async-storage/async-storage`)

## Implementation references
- Spec: `specs/006-ios-feature-showcase/spec.md`
- Plan: `specs/006-ios-feature-showcase/plan.md`
- Module: `src/modules/liquid-glass-playground/`
- Registry: `src/modules/registry.ts`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows