# Quickstart — Audio Recording + Playback Module (Feature 020)

**Branch**: `020-audio-recording` | **Date**: 2026-04-28
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Data Model**: [data-model.md](./data-model.md)

This is the operator-facing install + verification guide for feature 020. Unlike feature 019 (which required zero `app.json` changes), feature 020 **does** require one new dependency, one new plugin entry, and one new iOS Info.plist key — because microphone capture is gated by Apple's privacy framework.

---

## 1. Install (in the worktree)

```powershell
# In C:\Users\izkizk8\spot-020-audio
npx expo install expo-audio

# expo-sharing is needed for the Share action on US-2; if it's already in
# package.json this is a no-op, otherwise it adds it pinned to the right
# version for SDK 55:
npx expo install expo-sharing
```

`npx expo install` (not raw `pnpm add`) is mandatory — it queries Expo's per-SDK compatibility matrix and pins versions known to work with Expo SDK 55 / React Native 0.83 / React 19.2.

After install:

```powershell
pnpm install      # if pnpm-lock.yaml needs to settle
pnpm check        # MUST pass green (FR-050 / SC-011)
```

---

## 2. Register the Expo config plugin

Open `app.json` and append `"./plugins/with-audio-recording"` to the `plugins` array. The exact ordering relative to other plugins does NOT matter for correctness (see §4 below) but the conventional placement is alongside the other privacy-key plugins:

```diff
   "plugins": [
     "expo-router",
     "expo-image",
     "./plugins/with-live-activity",
     "./plugins/with-app-intents",
     "./plugins/with-home-widgets",
     "./plugins/with-screentime",
     "./plugins/with-coreml",
     "./plugins/with-vision",
     "./plugins/with-speech-recognition",
+    "./plugins/with-audio-recording",
     ...
```

After the plugin runs (during the next prebuild or EAS Build), the iOS `Info.plist` will contain:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Audio Lab uses the microphone to demonstrate recording and playback.</string>
```

If you want a different copy, set the key directly in `app.json`'s `ios.infoPlist` — the plugin is "set-if-absent", so it will preserve any value you've already written.

---

## 3. What you do NOT need to do

These are intentional non-actions (D-04 / FR-043 / FR-044):

- **No `UIBackgroundModes: audio`.** Background-mode recording is out of scope for v1. If the app backgrounds while recording, OS-defined behavior governs.
- **No Android permissions added by hand.** `expo-audio` handles `RECORD_AUDIO` via its own AndroidManifest merge at build time.
- **No bespoke Swift / Kotlin module.** All native APIs are reached through `expo-audio`. There is no `native/ios/audio-lab/` folder.
- **No new EAS build profile.** The existing `sideload` and `development` profiles cover this feature.

---

## 4. Plugin coexistence with features 017 and 018

Both 017 (`with-vision`) and 018 (`with-speech-recognition`) ship config plugins that edit the iOS Info.plist using the same `withInfoPlist` + "set if absent" pattern. **Specifically, 018 already adds `NSMicrophoneUsageDescription`** with a feature-018-specific default copy (`"Used to capture audio for live speech-to-text"`).

Because every plugin uses "set if absent", the merge is order-deterministic and idempotent:

| Plugin order in `app.json` | Final `NSMicrophoneUsageDescription` value |
|----------------------------|---------------------------------------------|
| 018 then 020 | `"Used to capture audio for live speech-to-text"` (018's value, preserved) |
| 020 then 018 | `"Audio Lab uses the microphone to demonstrate recording and playback."` (020's value, preserved) |
| Operator sets the key in `app.json` `ios.infoPlist` directly | Operator's value (both plugins are no-ops on this key) |

In all three cases the Info.plist contains exactly **one** `NSMicrophoneUsageDescription` entry. The plugin test at `test/unit/plugins/with-audio-recording/index.test.ts` asserts all three orderings produce a deep-equal Info.plist (SC-009).

---

## 5. On-device verification

Open the Modules tab → tap **Audio Lab**. Run through these checks on each platform you care about; iOS is the primary target.

### Check 1 — US-1: Record, stop, see the row appear (P1)

1. Tap the large record button.
2. The first time only: grant microphone permission when the system prompt appears.
3. The button visibly pulses red; the elapsed-time readout starts ticking in `HH:MM:SS`; the vertical waveform meter responds to your voice.
4. Speak for ~5 seconds.
5. Tap the record button again to stop.
6. A new row appears in the **Recordings** list below with a timestamp name (e.g., `2026-04-28-14-37-12.m4a`), a duration matching what you spoke, and a non-zero file size.
7. Pull-to-refresh or navigate away and back. The row persists (loaded from AsyncStorage key `spot.audio.recordings`).

### Check 2 — US-2: Play, delete, share (P2)

1. On any recording row, tap **Play**. Audio plays through the speaker; the row visually indicates "playing"; playback stops automatically at end-of-file.
2. While that recording is playing, tap **Play** on a different row. The first stops, the second starts (single-active-player invariant).
3. Tap **Delete** on a row. The row disappears; the underlying file is removed from disk; reloading the screen confirms it's gone from AsyncStorage.
4. Tap **Share** on a row. On iOS/Android the platform share sheet opens with the recording URI. On Web (or where `expo-sharing` is unavailable) the fallback runs without throwing — the file URI is copied to the clipboard or opened via `Linking`.

### Check 3 — US-3: Quality presets (P2)

1. With the recorder idle, select the **Low** segment of the quality selector.
2. Record ~5 seconds, stop. Note the file size on the new row.
3. Repeat with **Medium** (same spoken duration).
4. Repeat with **High** (same spoken duration).
5. Verify file sizes increase: Low < Medium < High, with at least 30 % delta between adjacent tiers (SC-005). Note: SC-005 is primarily an iOS/Android assertion; Web bitrate hints may not be honored by all browsers.

### Check 4 — US-4: Audio session category (P3)

1. Open the **Audio Session Card** at the bottom of the screen.
2. Read the explanation paragraph for each category.
3. Select **Playback**, tap **Apply**. The status pill updates to "Playback".
4. Engage the device's silent (ringer-off) switch. Play a saved recording. Audio still plays (because Playback sets `playsInSilentMode: true` — SC-006).
5. Switch to **Record** then **Apply**. The status pill updates. Recording works as expected.
6. Start recording, then while still recording tap **Apply** with a different category selected. Verify the in-progress recording is finalized and saved (per the normal Stop flow) and then the new category is applied (SC-007 / FR-024).
7. On Web: the Audio Session Card categories are read-only / informational tooltips per FR-045 (no Apply button).

---

## 6. Troubleshooting

- **System permission prompt didn't appear**: Verify the plugin is registered in `app.json` and re-run the iOS prebuild (`npx expo prebuild --clean`). Check that `Info.plist` contains `NSMicrophoneUsageDescription`.
- **`pnpm check` fails after install**: Re-run `npx expo install expo-audio expo-sharing` and accept the resolver's pin. Common cause is a transitive peer-dep mismatch when raw `pnpm add` was used by mistake.
- **Recording row appears with `0 ms` duration**: `expo-audio`'s recorder may not have flushed the metadata at stop time on some Android devices — workaround is to add a 100 ms wait between `stop()` and the `getInfoAsync` call. Tracked as a follow-up if observed in CI.
- **Audio plays but Audio Session Card has no effect on Android**: This is expected — Android's audio framework approximates rather than exactly implements iOS's category model (R-007). The pill still updates to reflect the requested category; the underlying flags map to whatever Android's `AudioFocus` framework provides.
