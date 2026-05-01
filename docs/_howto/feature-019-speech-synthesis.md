---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; expo-speech works in simulator too)
  - iPhone running iOS 13+ (Personal Voice requires iOS 17+)
  - Apple Developer account (free tier sufficient)
---

# How to verify Speech Synthesis on iPhone

## Goal
Confirm `AVSpeechSynthesizer` via `expo-speech` speaks typed text with
configurable voice, rate, pitch, and volume; that word highlighting tracks
the spoken position; and that Personal Voice works on iOS 17+.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-speech` installed (`npx expo install expo-speech`)
- No config plugin, no Info.plist changes, no entitlements required

## Steps
1. Build the JS layer (no native rebuild required):
   ```bash
   npx expo install expo-speech
   pnpm install && pnpm check
   ```
2. Run via `pnpm ios` (simulator) or `pnpm ios:ipa` (device sideload).
3. In the app, navigate to **"Speech Synthesis"** in the Modules tab.
4. Type any non-empty text in the input field.
5. Tap **Speak** — audio begins; Pause and Stop buttons become enabled.
6. Tap **Pause** — audio halts; Continue button enables.
7. Tap **Continue** — audio resumes from pause point.
8. Tap **Stop** — audio terminates; transport returns to idle.
9. Tap **Speak** and let it finish naturally — transport returns to idle.
10. Open the voice picker; confirm voices grouped by BCP-47 locale with
    Default/Enhanced/Premium badges; select a non-default voice; tap Speak.
11. Adjust Rate (Slow/Normal/Fast), Pitch (Low/Normal/High), Volume — verify audible differences.
12. Tap the **English** preset chip → input becomes the classic pangram; tap Speak.
13. On iOS 17+ with a Personal Voice created: open the voice picker and confirm
    a Personal Voice section appears at the top.

## Verify
- Pause / Continue / Stop transport controls work correctly
- Word highlighting advances in sync with audio; clears on Stop or natural completion
- Rate, Pitch, Volume produce clearly audible differences
- Preset chips populate the text input correctly
- Personal Voice card absent on iOS < 17; present and functional on iOS 17+
- Android: all transport controls work; highlighting may be absent on some OEMs
- Web: `window.speechSynthesis` used; voices populate after `voiceschanged` event

## Troubleshooting
- **No audio** → ensure device is not in silent mode; check AVAudioSession category
- **`Cannot find module 'expo-speech'`** → run `npx expo install expo-speech`
- **Personal Voice card appears on iOS 16** → check runtime gate
  `Platform.OS === 'ios' && Number(Platform.Version) >= 17`

## Implementation references
- Spec: `specs/019-speech-synthesis/spec.md`
- Plan: `specs/019-speech-synthesis/plan.md`
- Module: `src/modules/speech-synthesis-lab/`
- Swift: `native/ios/speech-synthesis/SpeechSynthesizer.swift` (auto-linked)

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows