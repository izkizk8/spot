# Quickstart — Feature 083: Live Stickers

## Prerequisites

- Xcode 15+ (iOS 17 SDK)
- A physical iPhone running iOS 17+ or a simulator targeting iOS 17+
- `pnpm install` already run

## Run the module

```bash
cd C:\Users\izkizk8\spot-083-stickers
pnpm ios
```

Navigate to **Modules → Live Stickers** in the app.

## What to test manually

1. Tap **Pick Photo** — the system photo picker opens.
2. Select a photo with a clear foreground subject (person, animal, object).
3. The app lifts the subject(s) and displays thumbnail previews.
4. Tap **Share Sticker** on any subject — the iOS share sheet opens.
5. Drag the sticker into a Messages conversation.
6. Tap **Reset** to clear the result and pick another photo.

## Run unit tests

```bash
cd C:\Users\izkizk8\spot-083-stickers
pnpm test -- --testPathPattern="083-live-stickers|with-live-stickers"
```

## Run the full quality gate

```bash
pnpm format && pnpm check
```

## Notes

- The JS bridge is a stub — no real native Swift code ships in this feature.
  The `pickImageAndLiftSubjects` call will return an empty subjects array
  unless a real `LiveStickers` Expo Module is registered.
- `isSupported()` returns `false` on simulators without the Vision
  capability; the Pick Photo button will be disabled.
- Android and Web show an **iOS Only** banner with no interactive controls.
