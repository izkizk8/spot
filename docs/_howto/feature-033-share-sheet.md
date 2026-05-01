---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; Share Sheet uses UIActivityViewController, available in Expo Go)
  - iPhone running iOS 8+
  - Apple Developer account (free tier sufficient)
---

# How to verify Share Sheet on iPhone

## Goal
Confirm UIActivityViewController presents with the correct activity items (text, URL,
image), custom activity items render with correct titles and icons, and completion
callbacks report the selected activity type.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- No native plugin required; UIActivityViewController is available in all iOS builds

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Build or use Expo Go:
   ```bash
   npx expo start
   ```
3. In the app, navigate to **"Share Sheet"** in the Modules tab.
4. Tap **Share Text** — share sheet appears with a text snippet.
5. Cancel the sheet — confirm "cancelled" callback shows in the result panel.
6. Tap **Share URL** — share sheet appears with the configured URL.
7. Tap **Share Image** — share sheet appears with an inline thumbnail in the header.
8. Tap **Share Multiple** — share sheet appears with text + URL + image combined.
9. Select a real destination (e.g., Notes) — confirm success callback with activity type.
10. Tap **Exclude Activities** with `AIRDrop` excluded — confirm AirDrop row is absent.

## Verify
- Share sheet appears for all four share types (text, URL, image, multiple)
- Cancel callback reports "cancelled" without crash
- Success callback reports the selected activity type after sharing
- Excluding an activity type removes that row from the sheet
- On Android: `Intent.ACTION_SEND` sheet opens for all share types
- On web: `navigator.share()` Web Share API used if available; fallback clipboard

## Troubleshooting
- **Share sheet crashes on image share** → ensure the image is a local URI or
  base64; remote URLs must be downloaded before passing to UIActivityViewController
- **Completion callback never fires on iPad** → use `popoverPresentationController`
  anchor; on iPad the sheet is a popover — the anchor is required to avoid crash
- **AirDrop exclusion has no effect** → only `UIActivity.ActivityType` constants
  are accepted for exclusion; custom third-party activity types cannot be excluded

## Implementation references
- Spec: `specs/033-share-sheet/spec.md`
- Plan: `specs/033-share-sheet/plan.md`
- Module: `src/modules/share-sheet-lab/`
- Native bridge: `src/native/share-sheet.ts`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows