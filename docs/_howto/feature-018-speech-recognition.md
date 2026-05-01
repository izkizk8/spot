---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (SFSpeechRecognizer requires native iOS build)
  - iPhone running iOS 13+ (physical device for live microphone input)
  - Apple Developer account (free tier sufficient)
---

# How to verify Speech Recognition on iPhone

## Goal
Confirm SFSpeechRecognizer captures live speech via the microphone, returns
partial and final transcripts, supports on-device mode (offline), and that
both permission prompts (speech + microphone) work correctly.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- `expo-clipboard` installed (`npx expo install expo-clipboard`)
- `with-speech-recognition` plugin registered in `app.json`
- Info.plist must contain `NSSpeechRecognitionUsageDescription` and
  `NSMicrophoneUsageDescription` (added by the plugin)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Prebuild and build:
   ```bash
   npx expo prebuild --clean
   eas build --platform ios
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Speech Recognition"** in the Modules tab.
5. Tap **Request** — grant the speech-recognition prompt, then the microphone prompt.
6. Confirm Authorization Status pill reads `authorized`.
7. Tap the **Mic Toggle** — pulse animation starts; Audio Session indicator shows `active`.
8. Speak "the quick brown fox jumps over the lazy dog".
9. Partial transcript appears within ~1 second; final transcript after ~2 seconds.
10. Tap the **Mic Toggle** again — audio stops; final transcript persists.
11. Tap **Copy** → paste into Notes to verify clipboard content.
12. Tap **Clear** → transcript empties; Copy disables.
13. Toggle Airplane Mode ON; switch to **On-device** mode; tap Mic Toggle; speak.
    Confirm transcript appears with no network (server mode would fail).

## Verify
- Partial and final transcripts appear in real time with per-word confidence opacity
- Audio Session indicator transitions active → inactive correctly on stop
- On-device mode produces transcripts with Airplane Mode enabled
- Locale picker shows 6 locales; switching locale restarts session and preserves transcript
- Denied permission: Mic Toggle disabled, Open Settings affordance appears
- On Android: all UI renders; Mic Toggle disabled; "Speech Recognition is iOS-only" banner
- On Chromium web: Mic Toggle enabled via `webkitSpeechRecognition`

## Troubleshooting
- **Mic Toggle pulses but no transcript** → check network (server mode needs connectivity)
  or wait ~30 s for on-device assets to download on first on-device use
- **Both permission prompts don't appear** → verify the plugin added both plist keys:
  `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription`
- **Audio session stays active after Stop** → bug in Swift tearDown; open Console.app
  and check for `[SpeechRecognizer] tearDown` log line

## Implementation references
- Spec: `specs/018-speech-recognition/spec.md`
- Plan: `specs/018-speech-recognition/plan.md`
- Module: `src/modules/speech-recognition-lab/`
- Native bridge: `src/native/speech-recognition.ts`
- Plugin: `plugins/with-speech-recognition/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows