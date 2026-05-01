---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; not required for JS-only gate)
  - iPhone running iOS 13+ (physical device required to feel real haptics)
  - Apple Developer account (free tier sufficient)
---

# How to verify Haptics Playground on iPhone

## Goal
Exercise all Taptic Engine feedback types (Notification, Impact, Selection),
the Composer pattern sequencer, and preset persistence on a physical iPhone.

## Prerequisites
- Node 20+, pnpm installed; `pnpm install` already run
- `expo-haptics` installed (`npx expo install expo-haptics`)
- Physical iPhone running iOS 13+ (haptics are no-ops in the simulator)
- Free Apple Developer account for sideload builds

## Steps
1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. No native rebuild is required — `expo-haptics` is fully JS-linked, no config plugin.
3. Run the app via `pnpm ios` (simulator) or `pnpm ios:ipa` for a sideloadable IPA.
4. Install the IPA on your iPhone per [sideload-iphone.md](sideload-iphone.md).
5. In the app, navigate to **"Haptics Playground"** in the Modules tab.
6. Under **Notification** tap each of the three buttons (Success, Warning, Error) —
   feel the corresponding Taptic Engine pattern.
7. Under **Impact** tap each of the three intensity buttons (Light, Medium, Heavy).
8. Under **Selection** tap the Selection Feedback button.
9. Open the **Composer** section; tap cells to assign haptic types, then tap **Play**.
10. Tap **Save preset** and verify the preset survives a cold app relaunch.

## Verify
- All 9 single-fire buttons produce distinct, correct haptic feedback
- Visual pulse animation plays on every button tap (including Android/web)
- Composer plays cells in order with ~120 ms spacing
- Saved preset survives a cold app relaunch (persisted via AsyncStorage)
- On Android, closest-equivalent vibrator pattern fires
- On web, a banner reads "Haptics not supported on this platform"

## Troubleshooting
- **No haptics felt** → physical device required; simulator has no Taptic Engine
- **`expo-haptics` not found** → run `npx expo install expo-haptics` and `pnpm install`
- **Preset not persisting** → verify `@react-native-async-storage/async-storage` is
  installed and `spot.haptics.presets` key is writable (not cleared by the OS)

## Implementation references
- Spec: `specs/008-haptics-playground/spec.md`
- Plan: `specs/008-haptics-playground/plan.md`
- Module: `src/modules/haptics-playground/`
- Tests: `test/unit/modules/haptics-playground/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows