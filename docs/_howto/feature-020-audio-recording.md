---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; expo-audio works in simulator with limitations)
  - iPhone running iOS 13+ (physical device for real microphone capture)
  - Apple Developer account (free tier sufficient)
---

# How to verify Audio Recording on iPhone

## Goal
Confirm AVAudioRecorder captures microphone audio, recordings appear in a
persistent list, playback works with single-active-player enforcement, quality
presets produce measurably different file sizes, and the share sheet opens.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-audio` and `expo-sharing` installed:
  ```bash
  npx expo install expo-audio expo-sharing
  ```
- `with-audio-recording` plugin registered in `app.json`
- `NSMicrophoneUsageDescription` injected by the plugin at prebuild time

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
4. In the app, navigate to **"Audio Lab"** in the Modules tab.
5. Tap the large record button — grant microphone permission when prompted.
6. The button pulses red; the elapsed-time counter ticks; the waveform meter responds.
7. Speak for ~5 seconds; tap the button again to stop.
8. A new row appears in the Recordings list with a timestamp name, duration, and size.
9. Tap **Play** on the row — audio plays through the speaker.
10. Tap **Play** on a different row while the first is playing — first stops, second starts.
11. Tap **Delete** on a row — row disappears; file removed from disk.
12. Tap **Share** on a row — iOS share sheet opens with the recording URI.
13. Change quality selector to **Low**, record 5 s; change to **High**, record 5 s —
    confirm High file size > Low file size by at least 30%.

## Verify
- Microphone permission prompt appears on first record tap
- Recording row appears after stop with correct duration and non-zero file size
- Single-active-player invariant: starting a second recording stops the first
- Delete removes the row from the list and the file from disk
- Share opens the iOS share sheet with the recording
- File sizes: Low < Medium < High for the same spoken duration
- Audio Session Card categories change the routing behavior on iOS

## Troubleshooting
- **Permission prompt never appears** → verify `with-audio-recording` in `app.json`
  plugins and `Info.plist` has `NSMicrophoneUsageDescription`
- **Recording row shows `0 ms` duration** → `expo-audio`'s recorder may not have
  flushed metadata on some Android devices; add 100 ms wait after `stop()`
- **`expo-audio` not found** → use `npx expo install expo-audio` (not `pnpm add`)

## Implementation references
- Spec: `specs/020-audio-recording/spec.md`
- Plan: `specs/020-audio-recording/plan.md`
- Module: `src/modules/audio-lab/`
- Native bridge: `src/native/audio-recorder.ts`
- Plugin: `plugins/with-audio-recording/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows