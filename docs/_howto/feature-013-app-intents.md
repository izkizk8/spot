---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (App Intents Swift files require native build)
  - iPhone running iOS 16+ (App Intents framework requires iOS 16)
  - Apple Shortcuts app installed (pre-installed on all iOS devices)
  - Apple Developer account (free tier sufficient)
---

# How to verify App Intents on iPhone

## Goal
Confirm that the three App Intents (LogMoodIntent, GetLastMoodIntent,
GreetUserIntent) are invocable from the in-app UI and discoverable in the
iOS Shortcuts app and Siri.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- `with-app-intents` config plugin registered in `app.json`
- `npx expo prebuild --clean` + native rebuild done

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Run prebuild and verify Swift intent files are linked:
   ```bash
   npx expo prebuild --clean
   npx expo run:ios --device
   ```
3. In the app, navigate to **"App Intents Lab"** in the Modules tab.
4. Confirm the mood picker (neutral pre-selected), three buttons (Log mood,
   Get last mood, Greet user), event log, and Mood History list are visible.
5. Tap **Log mood** with `neutral` → result line and event log entry appear.
6. Switch picker to `happy`, tap **Log mood** again → Mood History shows two entries.
7. Tap **Get last mood** → result reads "Last mood: happy".
8. Type "Ada" in the name field; tap **Greet user** → result reads "Hello, Ada!".
9. Tap **Open Shortcuts** → the iOS Shortcuts app opens; verify Spot appears with
   Log mood, Get last mood, and Greet user actions listed.
10. Run **Log mood** from Shortcuts with mood `sad` → return to Spot; Mood History
    has a new `sad` entry.

## Verify
- In-app invocations populate the event log (newest first, capped at 10)
- Mood History list persists across screen unmount/remount
- All three intents appear in Shortcuts with correct parameter prompts
- "Hey Siri, log my mood happy" completes successfully (after at least one in-app invocation)
- On iOS 15: module card hidden; on Android/web: banner shown, JS-only Mood Logger visible

## Troubleshooting
- **Intents not in Shortcuts** → verify the four Swift files are in
  `native/ios/app-intents/` and `with-app-intents` plugin links them at prebuild
- **Siri doesn't find the intent** → donate an in-app invocation first; Siri
  surfaces donated App Shortcuts after the first in-app use
- **`requireNativeModule` error** → rebuild the dev client after registering the plugin

## Implementation references
- Spec: `specs/013-app-intents/spec.md`
- Plan: `specs/013-app-intents/plan.md`
- Module: `src/modules/app-intents-lab/`
- Native bridge: `src/native/app-intents.ts`
- Plugin: `plugins/with-app-intents/`
- Swift files: `native/ios/app-intents/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows