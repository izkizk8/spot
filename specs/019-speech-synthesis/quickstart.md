# Quickstart — Speech Synthesis Module (Feature 019)

**Branch**: `019-speech-synthesis` | **Date**: 2026-04-28
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Data Model**: [data-model.md](./data-model.md)

This is the operator-facing install + verification guide for feature 019. It is intentionally short because the feature requires **zero `app.json` changes, zero Info.plist keys, zero entitlements, and zero plugins** (see R-001).

---

## 1. Install (one command, in the worktree)

```powershell
# In C:\Users\izkizk8\spot-019-speech-synth
npx expo install expo-speech
```

That's the entire install. `npx expo install` (not raw `pnpm add`) is mandatory — it queries Expo's per-SDK compatibility matrix and pins a version known to work with Expo SDK 55 / React Native 0.83 / React 19.2.

After install, verify:

```powershell
pnpm install      # if pnpm-lock.yaml needs to settle
pnpm check        # MUST pass green (FR-046 / SC-008)
```

If `pnpm check` fails, read the failure — common reasons:

- The resolved `expo-speech` version conflicts with another dep. Re-run `npx expo install expo-speech` and accept the resolver's pin.
- A test stub for `expo-speech` is missing in `test/unit/`. Add a Jest moduleNameMapper entry mirroring the precedents in `test/__mocks__/`.

---

## 2. What you do NOT need to do

These are intentional non-actions (D-01, FR-040, FR-041, FR-042):

- **No `app.json` edit.** No plugin to add to the `plugins` array.
- **No Info.plist key.** Specifically: do NOT add `NSSpeechRecognitionUsageDescription` (that's for `SFSpeechRecognizer`, feature 018) and do NOT add `NSMicrophoneUsageDescription` (no audio capture happens here).
- **No entitlement / capability change.** No App Group, no background-audio mode.
- **No native build step beyond a fresh `pod install` after the dep install.** The Swift file at `native/ios/speech-synthesis/SpeechSynthesizer.swift` is autolinked by `expo-modules-core` via its podspec.

---

## 3. On-device verification (iOS, after `pnpm ios`)

Map each spec user story to a numbered manual check. Do these on a physical iPhone (not the simulator) for highest fidelity — voice quality and Personal Voice are device-only on some configs.

### Check 1 — US-1: Speak / Pause / Continue / Stop (P1)

1. Open the Modules tab → tap **Speech Synthesis**.
2. The text input is empty; the **Speak** button is disabled. Verify both.
3. Type any non-empty text.
4. Tap **Speak**. Audio begins; transport state moves to **speaking**; **Pause** and **Stop** become enabled; **Continue** stays disabled.
5. Tap **Pause**. Audio halts; transport moves to **paused**; **Continue** becomes enabled; **Pause** disables.
6. Tap **Continue**. Audio resumes from where it paused; transport returns to **speaking**.
7. Tap **Stop**. Audio terminates immediately; transport returns to **idle**; only **Speak** is enabled.
8. Tap **Speak** again and let it run to completion. Verify transport returns to **idle** automatically (no manual stop required).

### Check 2 — US-2: Voice picker grouped by language with quality badges (P2)

1. Open the voice picker from the screen.
2. Verify voices are grouped under BCP-47 section headers (e.g., `en-US`, `en-GB`, `zh-CN`, `ja-JP`). The headers are the raw tags (D-12).
3. Verify each row shows the voice name and a badge labeled **Default**, **Enhanced**, or **Premium**.
4. Verify alphabetical sort within each section.
5. Select a non-default voice; return to the screen; tap **Speak**. Verify audible difference.
6. (iOS 17+ with at least one Personal Voice authorized) Verify a **Personal Voice** section appears at the top of the list above all language sections.

### Check 3 — US-3: Rate / Pitch / Volume segmented controls (P2)

1. For each of the three controls (Rate / Pitch / Volume), tap each of the three segments and tap **Speak** between changes.
2. Verify audible differences:
   - Rate Slow vs Normal vs Fast: noticeably slower / faster cadence.
   - Pitch Low vs Normal vs High: noticeably lower / higher voice.
   - Volume Low vs Normal vs High: noticeably softer / louder.
3. Begin a long utterance, then change a control mid-speech; verify the current utterance is unchanged and the new value applies on the next **Speak** (FR-016).

### Check 4 — US-4: Sample preset chips (P3)

1. Tap **English** preset. Input becomes `The quick brown fox jumps over the lazy dog.` (FR-005).
2. Tap **Chinese** preset. Input becomes `敏捷的棕色狐狸跳过了懒狗。` (A-02).
3. Tap **Japanese** preset. Input becomes `素早い茶色の狐が怠け者の犬を飛び越えます。` (A-02).
4. Tap **Speak** after each preset (with a matching-locale voice selected) and verify intelligible audio.

### Check 5 — US-5: Highlighted-word display (P3)

1. Load any preset (≥ 8 words) and tap **Speak**.
2. Watch the text input area: the word currently being spoken is visually highlighted, advancing in sync with audio (SC-003).
3. Tap **Pause**. Highlight freezes on the most recently spoken word.
4. Tap **Continue**. Highlight resumes advancing.
5. Tap **Stop**. Highlight clears within one frame.
6. Tap **Speak** and let it finish naturally. Highlight clears within one frame on completion.
7. Toggle iOS Settings → Accessibility → Motion → **Reduce Motion** ON. Re-run; verify the highlight still appears but no longer fades (it appears/disappears statically). Restore Reduce Motion OFF.

### Check 6 — US-6: Personal Voice (iOS 17+ only)

Prerequisite: device runs iOS 17 or later AND the user has created at least one Personal Voice in Settings → Accessibility → Personal Voice → Create a Personal Voice.

1. Verify the **PersonalVoiceCard** appears on the screen. (On iOS < 17 it MUST NOT appear at all.)
2. Status pill reads `notDetermined`.
3. Tap **Request Personal Voice authorization**. The system permission prompt appears.
4. Tap **Allow**. Status pill updates to `authorized` within ~1 s (SC-006).
5. Open the voice picker. Verify a **Personal Voice** section appears at the top above all language sections, containing the user's authorized Personal Voices.
6. Select a Personal Voice; return to the screen; tap **Speak**. Verify the Personal Voice is used.
7. (Optional) Repeat with **Don't Allow** to verify `denied` state.

---

## 4. On-device verification (Android, after `pnpm android`)

Android uses `expo-speech`. The screen, hook, and components are identical to the iOS path; only the bridge differs.

1. **US-1 transport**: Same checks as iOS. **Note**: on some Android OEMs, `Speech.pause()` / `Speech.resume()` are unsupported — in that case the Pause/Continue buttons are disabled by the screen at mount-time (FR-021). Verify the buttons are either functional OR disabled with no error.
2. **US-2 voice picker**: Voices are grouped by BCP-47; quality badges render (`Default` for most Android voices, `Enhanced` where the OEM exposes it; `Premium` does not appear on Android). The **Personal Voice** section never appears on Android (D-08).
3. **US-3 rate/pitch/volume**: Same audible-difference check; mapping is internally re-scaled (R-007).
4. **US-4 presets**: Identical.
5. **US-5 highlighting**: Works on OEMs that fire `onBoundary` (most modern Pixels and Samsungs); degrades silently to no-highlight elsewhere (FR-024) — verify the screen never errors or hangs.
6. **US-6 Personal Voice**: The card MUST NOT render on Android (D-08, FR-025). Verify its absence.

---

## 5. On-device verification (Web, after `pnpm web`)

Web uses `window.speechSynthesis`. Test in current Chromium and Safari (Firefox should also work but is less reliable for voice availability — out of scope for SC-009).

1. **US-1 transport**: Same checks as iOS.
2. **US-2 voice picker**: `speechSynthesis.getVoices()` may return `[]` initially; the bridge re-fetches on the `voiceschanged` event. Verify voices populate within a second or two of opening the screen. Quality badge is always `Default` on Web (the API has no quality tier).
3. **US-3 rate/pitch/volume**: Same audible-difference check.
4. **US-4 presets**: Identical.
5. **US-5 highlighting**: Chromium fires `boundary` events for most voices and the highlight works; Safari fires them inconsistently and the highlight may be intermittent — verify the screen never errors when boundary events are absent (FR-024).
6. **US-6 Personal Voice**: The card MUST NOT render on Web (D-08, FR-025). Verify its absence.

---

## 6. Quality gate (Windows-runnable, no device)

This is the gate enforced by `pnpm check` (FR-046 / SC-008). Run before merging:

```powershell
pnpm check
```

This wraps:

- `pnpm format` (Prettier)
- `pnpm lint` (ESLint + oxlint)
- `pnpm typecheck` (`tsc --noEmit`, strict)
- `pnpm test` (Jest Expo + RNTL — the ~14 JS-pure files enumerated in plan.md)

All four MUST be green. Any failure blocks merge.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module 'expo-speech'` in tests | Dep not installed or test mock missing | Re-run `npx expo install expo-speech`; add a Jest mock if your test file imports the real module |
| iOS app crashes on screen open | Native module not autolinked | Re-run `pod install` in `ios/`; verify `SpeechSynthesis.podspec` is discoverable; check Xcode build log |
| Personal Voice card appears on iOS 16 | Runtime gate not applied | Verify the screen uses `Platform.OS === 'ios' && Number(Platform.Version) >= 17` to gate the mount |
| Web voice picker is empty after 3 s | `voiceschanged` event missed | Verify the bridge subscribes to `voiceschanged` AND calls `getVoices()` once at mount; some browsers fire `voiceschanged` only once |
| Android Pause button is enabled but does nothing | OEM-specific pause/continue unsupported but probe didn't catch it | Inspect probe logic in `useSynthesisSession`; ensure failure path sets `pauseSupported = false` |
| `pnpm check` fails on a fresh clone | Stale `pnpm-lock.yaml` | `pnpm install --frozen-lockfile=false` then re-run `pnpm check` |

---

## 8. Operator quick-reference

```text
Install:           npx expo install expo-speech
Native modules:    1 Swift file (auto-linked, no plugin)
Info.plist keys:   none
app.json edits:    none
Permissions:       none
Entitlements:      none
Background modes:  none
Quality gate:      pnpm check (must be green)
```

This is the headline simplicity story for feature 019. If you find yourself adding any of the items in the "none" rows, you've drifted from the spec — re-read R-001 in `research.md` before proceeding.
