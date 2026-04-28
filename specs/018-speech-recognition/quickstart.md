# Quickstart: Speech Recognition Module

> **READ THIS FIRST.** This module's recognition pipeline is **iOS-only** for the full feature set. Android renders the screen UI (every section) but disables the mic toggle behind a "Speech Recognition is iOS-only on this build" banner. **Web** opportunistically wires `webkitSpeechRecognition` (Chromium-only); Firefox / non-Chromium browsers see the same banner.
>
> **Dual-permission disclosure** *(repeated from spec.md §Reality Check)*: `SFSpeechRecognizer` requires **two** distinct iOS authorizations on first use:
>
> 1. `NSSpeechRecognitionUsageDescription` — speech-recognition permission
> 2. `NSMicrophoneUsageDescription` — microphone permission
>
> Both prompts may surface in sequence on the first tap of **Request**. The 018 config plugin adds both keys to `Info.plist` with sensible defaults (idempotent; operator-supplied values preserved).
>
> **Audio-session disclosure**: The module claims the shared `AVAudioSession` while listening (category `.record`, mode `.measurement`, options `.duckOthers`). Background music will duck while a session is active. The screen surfaces this side effect via the **Audio Session indicator**. The session is deactivated on `stop` and on every terminal event.
>
> **Privacy disclosure**: Server mode transmits audio to Apple's servers (per `SFSpeechRecognizer`'s contract). On-device mode never transmits. The Recognition Mode segmented control labels this trade-off honestly.

---

## 1. Install dependencies

```bash
pnpm install                              # installs everything in package.json
npx expo install expo-clipboard           # adds expo-clipboard at the Expo-managed version
```

`expo-clipboard` is the only new runtime dependency this feature adds. No operator-supplied artifact is required (no model file, no audio sample — this module is fully driven by the user's live mic input).

---

## 2. JS-pure verification on Windows (the dominant CI path)

This is the primary verification path on Windows + CI; it covers ~100% of the JS surface (speech-types, the session hook with a mocked event emitter, every component, every screen variant with mocked native, the bridge contract + Android stub + web `webkitSpeechRecognition` adapter (mocked), the config plugin against fixtures, the manifest):

```bash
pnpm check     # format + lint + typecheck + test (the project's standard quality gate)
```

Expected: green with no warnings about state updates on unmounted components and no unhandled promise rejections (NFR-003 / NFR-006).

To run a focused subset while iterating:

```bash
pnpm test test/unit/modules/speech-recognition-lab/
pnpm test test/unit/native/speech-recognition.test.ts
pnpm test test/unit/plugins/with-speech-recognition/index.test.ts
```

---

## 3. iOS prebuild (macOS or EAS Build only — Windows operators stop after step 2)

```bash
pnpm exec expo prebuild --platform ios --clean
```

Expected outcomes:

| Stage | Pass condition | Failure mode |
|-------|----------------|--------------|
| `expo prebuild` plugin merge | `Info.plist` contains BOTH `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` set to defaults if not already supplied | None expected — the plugin only adds Info.plist keys |
| Idempotency | A second `expo prebuild --clean` produces the same `Info.plist` (no diff) | None expected (FR-027 / SC-008) |
| Plugin coexistence | 007 / 014 / 015 / 016 / 017 plugin outputs are unaffected; in particular the 017 `NSCameraUsageDescription` value is preserved verbatim | Diff against a chain-without-018 — must show only the two new usage descriptions added (FR-028 / SC-009) |

---

## 4. iOS build + on-device verification (macOS or EAS Build)

```bash
eas build --platform ios     # produces a real device-installable .ipa
```

The simulator can run **server-mode** recognition with a synthetic audio source but cannot reliably exercise live mic input. **Use a real iOS 13+ device for full verification** (iOS 10–12 will work for the server path with degraded `supportsOnDeviceRecognition` reporting).

### 4a. US-1 (Server mode, P1 — the MVP path)

1. Open the spot app on the iOS device and navigate to **Modules → Speech Recognition**.
2. Confirm the screen renders, in vertical order:
   - **Authorization Status pill** reading `notDetermined` with an inline **Request** button.
   - **Audio Session indicator** reading **inactive**.
   - **Recognition Mode** segmented control with **Server** preselected.
   - **Locale picker** with the system locale preselected (or `en-US` if system locale is outside the top-6 list).
   - **Live Transcript** area (empty placeholder).
   - **Mic Toggle** button (large, static idle icon).
   - **Action Row** with **Clear** and **Copy** (Copy is visually disabled — empty transcript).
3. Tap **Request**. The system surfaces the **speech-recognition** prompt; grant it. The system then surfaces the **microphone** prompt; grant it. The Authorization Status pill flips to `authorized` without a screen reload.
4. Tap the **Mic Toggle**. Within one render frame:
   - The button begins its **animated pulse** (subtle scale + opacity).
   - The Audio Session indicator transitions to **active**.
5. Speak a short phrase ("the quick brown fox jumps over the lazy dog"). Within ~1 second:
   - The **partial transcript** appears in the live transcript area, refreshed on every update.
   - As phrases stabilize, **finalized segments** replace the partial in the primary text color.
   - Each rendered word's opacity follows `0.4 + 0.6 * confidence` — words the recognizer was less sure about appear visibly fainter.
6. Tap the **Mic Toggle** again to stop. The pulse ends; the Audio Session indicator returns to **inactive**; the final transcript remains visible.
7. Tap **Copy**. A brief inline "Copied" confirmation appears for ~2 seconds. Verify the transcript is on the clipboard (paste into Notes).
8. Tap **Clear**. The live transcript area becomes empty and **Copy** disables again.
9. **Unmount cleanup**: Navigate back to the Modules grid mid-session (i.e., tap the back button while still listening). Connect to **Console.app** and verify no further `[SpeechRecognizer]` log lines appear after the unmount, no audio session is left active (the next session starts from `inactive`), and no "state update on unmounted component" warnings are emitted (SC-010 / NFR-003).

### 4b. US-2 (On-device mode, P2)

1. With authorizations granted and Mode currently **Server**, tap the **On-device** segment.
2. If the current locale is `en-US` on a modern iPhone, the segment becomes selected; the next `start` invocation passes `onDevice: true`.
3. Toggle Airplane Mode ON. Tap the **Mic Toggle**. Speak the same phrase. Verify partial + final transcripts appear with no network connectivity — proving the audio never left the device.
4. Toggle Airplane Mode OFF.
5. Switch the Locale picker to a locale that does NOT support on-device recognition on this device (Apple's matrix changes; `de-DE` may or may not depending on the device). When such a locale is selected:
   - The Mode auto-falls back to **Server** with an inline message ("Switched to Server: on-device unavailable for {locale}") visible for ~3 seconds.
   - The **On-device** segment becomes visually disabled with the documented accessibility label.

### 4c. US-3 (Locale switching, P2)

1. With authorizations granted, tap the Locale picker. Verify exactly six options: `en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`.
2. Select `ja-JP`. If a session was active, it is stopped and restarted automatically within one event-loop tick (FR-013); the previous transcript is preserved.
3. Tap the **Mic Toggle** and speak a Japanese phrase. Verify partial + final transcripts render in Japanese script (kana / kanji).
4. Switch back to `en-US`. Tap **Clear** to reset the transcript history.

### 4d. US-4 (Authorization handling, P2)

1. In **Settings → Privacy → Speech Recognition → spot**, revoke speech-recognition access. Return to the app.
2. Verify the Authorization Status pill reads `denied`, the **Mic Toggle** is visually disabled, the **Request** button is replaced by an inline **Open Settings** affordance, and tapping the disabled toggle is a no-op (no bridge call).
3. Re-grant access in Settings. Return to the app. The pill reflects `authorized` (the screen re-queries on focus).
4. In Settings, revoke **microphone** access (but leave speech-recognition granted). Return to the app. The pill still reads `authorized` (it tracks speech only); tap the **Mic Toggle**. The bridge `start` rejects with `SpeechAuthorizationError` (kind = `'authorization'`); the screen surfaces an inline "Microphone access required" message; the Audio Session indicator stays **inactive**.

### 4e. Edge-case checks

1. **Microphone busy** (start a Voice Memo recording, then switch back to the spot app and tap the Mic Toggle): `start` rejects with `SpeechAudioEngineError`; inline "Microphone is in use — try again" appears; the toggle returns to idle.
2. **Audio session interruption** (start a session, then trigger Siri or place a phone call): The session terminates; the bridge fires an `error` event with `kind: 'interrupted'`; any partial received before interruption is captured in `final`; the indicator returns to **inactive**.
3. **No speech detected for ~30 seconds**: `SFSpeechRecognizer` ends the session naturally with an empty `final` event; the toggle returns to idle; no error is surfaced.
4. **Network unavailable in Server mode** (Airplane Mode + Server selected): `start` succeeds but no partials arrive within ~10s; the bridge fires `error` with `kind: 'network'`; inline "Server unreachable" appears; the indicator returns to **inactive**.
5. **`expo-clipboard` failure** (extremely rare; simulate by mocking in unit tests): `setStringAsync` rejects; the inline confirmation reads "Copy failed" for ~3 seconds; no exception leaks (NFR-006).
6. **Backgrounding mid-session**: Press the home button while listening. Return to the app. The next event after foregrounding may be an `error` with `kind: 'interrupted'`; the hook handles this identically to Story-1 stop.
7. **Mode change while listening** (Server → On-device): Per FR-013, the session is stopped and restarted within one event-loop tick; transcript history preserved.

### 4f. Console.app sanity (optional)

Connect the device to a Mac and open **Console.app** filtered on the spot app's process. The bridge logs:

```
[SpeechRecognizer] requestAuthorization → authorized
[SpeechRecognizer] start(locale=en_US, onDevice=false) → engine started
[SpeechRecognizer] partial: "the quick brown"
[SpeechRecognizer] partial: "the quick brown fox"
[SpeechRecognizer] final: "the quick brown fox jumps over the lazy dog" (isFinal=true)
[SpeechRecognizer] tearDown — audio session deactivated
```

No `ERROR` lines should appear in steady-state operation.

---

## 5. Expected fallback behavior on Android / Web

### Android

```bash
pnpm android      # or: pnpm exec expo run:android
```

1. Open **Modules → Speech Recognition**.
2. **Verify**:
   - Every UI section renders (pill, indicator, mode picker, locale picker, transcript, mic, action row).
   - The Authorization Status pill shows a neutral `notDetermined`-equivalent label (no Android prompt fires).
   - The **Mic Toggle is visually disabled**; tapping it surfaces an inline "iOS-only" toast / message.
   - The "Speech Recognition is iOS-only on this build" banner is shown prominently at the top.
   - **Zero JavaScript exceptions** across the screen lifecycle (SC-005). Internally, `bridge.isAvailable(locale)` returns `false` synchronously and the screen short-circuits before instantiating `useSpeechSession`'s subscription.

### Web (Chromium — Chrome / Edge / Brave with `webkitSpeechRecognition`)

```bash
pnpm web          # or: pnpm exec expo start --web
```

1. Open **Modules → Speech Recognition** in a Chromium browser.
2. **Verify**:
   - The Mic Toggle is **enabled**.
   - The **On-device** segment is **disabled** (web has no on-device path); Mode is forced to **Server**.
   - Tap the Mic Toggle: the browser surfaces its native microphone-permission prompt; grant it.
   - Speak a phrase: partial + final transcripts appear (note: per-word confidence is not exposed by `webkitSpeechRecognition`, so all words render at full opacity per FR-009 default).
   - Tap **Copy**: the transcript writes to the clipboard via `expo-clipboard` (which uses `navigator.clipboard.writeText` on web).
   - **Zero JavaScript exceptions** across the screen lifecycle (SC-006).

### Web (Firefox / non-Chromium without `webkitSpeechRecognition`)

1. Open the same URL in Firefox.
2. **Verify**:
   - The screen renders the iOS-only banner, the disabled Mic Toggle, and inert controls (same as Android).
   - **Zero JavaScript exceptions** across the screen lifecycle (SC-007).

---

## 6. Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `expo prebuild` produces an `Info.plist` *without* `NSSpeechRecognitionUsageDescription` or `NSMicrophoneUsageDescription` | The 018 plugin is not enabled | Add `"./plugins/with-speech-recognition"` to `app.json`'s `plugins` array; rerun `pnpm exec expo prebuild --clean` |
| iOS install asks for speech / mic permission with a blank purpose string | Operator supplied an empty value in `app.json`'s `ios.infoPlist` block | The plugin's `??=` preserves operator values; either remove the empty value or replace it with a meaningful one |
| Mic toggle pulses but no partial transcripts arrive in Server mode | Network unavailable (Airplane Mode); server-side recognition cannot connect | Check connectivity; the bridge will fire `error` with `kind: 'network'` after ~10 s |
| Mic toggle pulses but no partial transcripts arrive in On-device mode | On-device assets for the locale are not yet downloaded (Apple downloads lazily on first use) | Wait ~30 s with the toggle active; or switch to a known-good locale (`en-US` on US devices) |
| Authorization Status pill stuck on `notDetermined` after tapping Request | Operator denied the system prompt; the OS will not re-prompt | The pill should flip to `denied` once the prompt resolves; if it does not, check Console.app for `[SpeechRecognizer] requestAuthorization → ...` |
| Transcript text appears but every word is full-opacity in iOS | The recognizer has not yet computed per-word confidence (early in a session) | Expected; confidence stabilizes a few seconds in. Words with `confidence == 0` (Apple's "not yet computed" sentinel) intentionally fall back to the FR-009 default opacity of 1.0 |
| Audio Session indicator stays **active** after `stop` | The Swift bridge failed to deactivate the session (typically because another listener is in flight) | File a bug; the `tearDown` path should always deactivate |
| Console: `state update on unmounted component` from `useSpeechSession` | The hook's session token / unsubscribe path missed an event after unmount | Bug in the hook — verify the unmount-time `subscriptionToken` is checked before every `setState` call (NFR-003) |
| Module missing from the Modules grid on iOS < 10 | Manifest sets `minIOS: '10.0'`; older iOS is filtered by the 006 registry | Expected; upgrade the device or test on iOS 10+ |
| iOS-only banner appears on a real iOS 10+ device | `bridge.isAvailable(locale)` returned false | Verify the iOS deployment target is ≥ 10.0, the native module compiled, and the requested locale is in `availableLocales()` |
| Web: tapping Mic Toggle does nothing in Chromium | Browser denied microphone permission silently (e.g., site marked as blocked) | Reset site permissions in the browser's address-bar lock icon |

---

## 7. Reference

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Contracts: [contracts/](./contracts/)
- Apple Speech framework: <https://developer.apple.com/documentation/speech>
- `SFSpeechRecognizer`: <https://developer.apple.com/documentation/speech/sfspeechrecognizer>
- `SFSpeechAudioBufferRecognitionRequest`: <https://developer.apple.com/documentation/speech/sfspeechaudiobufferrecognitionrequest>
- `AVAudioEngine`: <https://developer.apple.com/documentation/avfaudio/avaudioengine>
- `AVAudioSession`: <https://developer.apple.com/documentation/avfaudio/avaudiosession>
- `expo-clipboard`: <https://docs.expo.dev/versions/latest/sdk/clipboard/>
- MDN — `webkitSpeechRecognition` (Web Speech API): <https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition>
