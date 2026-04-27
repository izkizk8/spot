# Quickstart — Haptics Playground (spec 008)

This is the verify-and-ship recipe for the Haptics Playground module. It
covers install, dev server, on-device verification, the cross-platform
smoke matrix, and the local quality gate.

---

## 1. Install

```bash
# from repo root
pnpm install
npx expo install expo-haptics
```

`expo-haptics` is the only new runtime dependency. AsyncStorage is already
in the dep tree from spec 006. No prebuild, no config plugin, no native
build needed.

---

## 2. Dev

```bash
pnpm start             # Metro
pnpm ios               # iOS simulator (visual pulses + composer; haptics no-op on simulator)
pnpm android           # Android emulator (visual pulses + composer; haptics best-effort on emulator)
pnpm web               # Web (banner + visual pulses + composer; haptics no-op)
```

To feel real haptics on iOS you need a physical iPhone. Build a sideload
IPA via `pnpm ios:ipa` if you want to install on a personal device — see
`docs/_howto/sideload-iphone.md`.

---

## 3. On-device verification matrix

After landing the module, verify each story end-to-end on each platform.

### Story 1 — Single-fire haptics (P1)

| Platform | Step | Expected |
|---|---|---|
| iOS device | Open Modules grid → tap **Haptics Playground** card | Screen renders with three sections (Notification / Impact / Selection) |
| iOS device | Tap each of the 9 buttons | Each fires the corresponding Taptic Engine feedback within ~100 ms; visual pulse animates on every press |
| Android device | Same | Closest-equivalent vibrator pattern fires; pulse animates |
| Web | Open the screen | Banner reads "Haptics not supported on this platform"; tapping any button still shows the visual pulse with zero console errors |

### Story 2 — Composer (P2)

| Step | Expected |
|---|---|
| Tap cell 1 once | Cell label/icon advances `off → light` |
| Tap cell 1 nine more times | Cell cycles back to `off` after passing through all 8 options |
| Fill cells 1, 3, 5 with values; press **Play** | Cells 1, 3, 5 fire in order with ~120 ms between each; each pulses as it fires |
| Press **Play** with all cells off | Nothing fires; no error dialog |
| Press **Play** during playback | Sequence stops immediately; no further cells fire |
| Navigate back during playback | No haptics fire after leaving the screen |

### Story 3 — Presets (P3)

| Step | Expected |
|---|---|
| Compose a non-empty pattern; tap **Save preset** | New row appears in Presets list named `Preset 1` (or next free integer) |
| Kill app cold; reopen Haptics Playground | Preset row is still there |
| Tap the preset row | Pattern replays identically with the same 120 ms spacing |
| Delete a preset (e.g. `Preset 2`) and save a new one | New preset is named `Preset 2`, not `Preset N+1` |
| Tap **Save preset** with all cells off | No preset saved; brief inline notice appears |

### Story 4 — Cross-platform fallbacks (P2)

| Platform | Expected |
|---|---|
| Android | Haptics fire (vibrator-equivalent), pulses animate, composer/presets work identically to iOS |
| Web | Web banner visible; all buttons/composer/presets interactive; no runtime errors in browser console |

---

## 4. Quality gates (local)

```bash
pnpm check     # = format:check && lint && typecheck && test
```

All four must pass with zero warnings introduced by this module (SC-008).
The seven new test files live under `test/unit/modules/haptics-playground/`.

If you only want fast feedback during development:

```bash
pnpm test --testPathPattern haptics-playground
```

---

## 5. Removing the module (sanity check)

The module is fully removable as a unit. To prove it during code review:

1. Delete `src/modules/haptics-playground/`
2. Delete `test/unit/modules/haptics-playground/`
3. Remove the one import line and one array entry in
   `src/modules/registry.ts`

`pnpm check` should still pass and the rest of the app should be unchanged.
This is the spec 006 plug-in contract working as designed.
