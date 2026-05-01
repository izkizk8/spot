---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (native build required)
  - iPhone running iOS 14+
  - Apple Developer account (free tier is sufficient)
---

# How to verify PhotoKit / PHPicker on iPhone

## Goal

Pick one or more photos from the iOS photo library via `PHPickerViewController`, confirm
the selected assets are returned to the JS layer, and verify permission prompts work
correctly.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 14+ (PHPicker requires iOS 14; older picker requires iOS 13)
- Free Apple Developer account (no paid membership needed)
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
5. In the app, open the **Modules** tab and tap **PhotoKit**.
6. Tap **Pick Photos** — the system PHPicker sheet appears.
7. Grant photo library access when prompted (first launch).
8. Select one or more photos and tap **Add**.
9. The selected asset thumbnails appear on screen with metadata (filename, media type,
   pixel dimensions).
10. Test **Limited Library** access via **Settings → Privacy → Photos → Spot → Selected
    Photos** to verify the limited-access banner appears in the lab.

## Verify

- PHPicker sheet opens and is dismissible without crashing
- Selected photos render as thumbnails in the lab screen
- `AuthorizationStatus` value shown matches the level you granted in Settings
- On iOS 16+ the module reports `limited` status when only specific photos are shared

## Troubleshooting

- **Photos permission dialog never appears** → delete the app, re-install, try again;
  or reset permissions via **Settings → General → Transfer or Reset iPhone → Reset →
  Reset Location & Privacy**
- **Build fails with "missing NSPhotoLibraryUsageDescription"** → run `npx expo prebuild
  --clean`; the `with-photokit` plugin injects the key automatically
- **Thumbnails show as grey boxes** → confirm iOS 14+ device; the PHPicker bridge
  is a no-op stub on iOS 13

## Implementation references

- Spec: `specs/057-photokit/spec.md`
- Plan: `specs/057-photokit/plan.md`
- Module: `src/modules/photokit-lab/`
- Native bridge: `src/native/photokit.ts`
- Plugin: `plugins/with-photokit/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows