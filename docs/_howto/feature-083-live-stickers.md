---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Xcode 15 required for iOS 17 SDK)
  - iPhone running iOS 17+
  - Apple Developer account (free tier is sufficient)
---

# How to verify Live Stickers subject cut-out on iPhone

## Goal

Pick a photo, lift the foreground subject(s) using Vision `VNGenerateForegroundInstanceMaskRequest`,
preview the sticker thumbnails, and share a sticker to Messages or another app.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 17+ (subject lift requires iOS 17 Vision APIs)
- Photo library access (prompted at first launch)
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
5. In the app, open the **Modules** tab and tap **Live Stickers**.
6. Tap **Pick Photo** — the system PHPicker sheet appears.
7. Grant photo library access when prompted.
8. Choose a photo with a clear foreground subject (person, pet, or object on a
   plain background works best).
9. The app processes the image and displays subject thumbnail previews with
   transparent backgrounds.
10. Tap **Share Sticker** on any thumbnail — the iOS share sheet opens.
11. Share to Messages and drag the sticker into a conversation.
12. Tap **Reset** to clear results and test another photo.

## Verify

- PHPicker sheet opens and returns the selected image
- Subject thumbnails appear with transparent backgrounds
- "Share Sticker" opens the system share sheet with the cut-out PNG
- Sharing to Messages inserts the sticker correctly
- On iOS < 17 or simulator without Vision, the screen shows a "not supported" banner

## Troubleshooting

- **Thumbnails are not transparent / show full rectangle** → the native
  `LiveStickers` Expo Module is a stub in the current build; the cut-out
  runs in JS simulation mode. A real Swift implementation ships in a follow-up
- **Pick Photo button is disabled** → `isSupported()` returned false; check that
  the device runs iOS 17+ and Vision framework is available
- **Empty subjects array returned** → try a photo with higher contrast between
  subject and background; very busy backgrounds reduce subject detection confidence
- **`NSPhotoLibraryUsageDescription` missing** → run `npx expo prebuild --clean`;
  the `with-live-stickers` plugin injects the key

## Implementation references

- Spec: `specs/083-live-stickers/spec.md`
- Plan: `specs/083-live-stickers/plan.md`
- Module: `src/modules/live-stickers-lab/`
- Native bridge: `src/native/live-stickers.ts`
- Plugin: `plugins/with-live-stickers/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows
- [feature-057-photokit.md](feature-057-photokit.md) — PhotoKit / PHPicker basics