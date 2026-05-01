---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; iOS 17+ simulator or device shows real effects)
  - iPhone running iOS 17+ (symbol effects require iOS 17; lab visible on iOS 16)
  - Apple Developer account (free tier sufficient)
---

# How to verify SF Symbols Playground on iPhone

## Goal
Confirm all SF Symbol animation effects (Bounce, Pulse, Variable Color, Replace,
Appear, Disappear) render correctly on iOS 17+, and that the non-iOS fallback
renders the symbol name as plain text.

## Prerequisites
- Node 20+, pnpm installed; `pnpm install` already run
- `expo-symbols` already pinned in `package.json` (~55.0.7); no new dep needed
- iPhone running iOS 17+ (effects require iOS 17; module hides on iOS 16)
- Free Apple Developer account for sideload builds

## Steps
1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. No native rebuild is required for the JS + `expo-symbols` path.
3. Run the app via `pnpm ios` (iOS 17+ simulator) or sideload via `pnpm ios:ipa`.
4. In the app, navigate to **"SF Symbols Lab"** in the Modules tab.
5. Confirm the Symbol Picker (12 cells), Effect Picker (7 segments), Speed / Repeat
   row, Tint Picker (4 swatches), and **Play Effect** button are visible.
6. Tap **Play Effect** with `heart.fill` + Bounce — the heart bounces once.
7. Switch to **Pulse** effect; tap **Play Effect** — sparkles pulse.
8. Switch Repeat to **Indefinite**; tap **Play Effect** — effect loops continuously.
   Tap again to stop.
9. Tap a Tint swatch — the preview re-tints without needing a Play Effect tap.
10. Switch Effect to **Replace**; pick a secondary symbol; tap **Play Effect** —
    the primary swaps to secondary with a crossfade transition.

## Verify
- All 7 effect types play correctly on iOS 17+
- Indefinite loop stops cleanly on second tap of Play Effect
- Tint change applies within ~100 ms without requiring Play Effect
- Replace mini-picker shows only when Replace effect is selected
- On Android/web: banner reads "iOS 17+ only", all pickers still interactive,
  preview shows the symbol name as plain text

## Troubleshooting
- **Effects don't animate on iOS 16** → module is gated to iOS 17+ by the registry;
  expected — the card should be hidden or show "unavailable" on iOS 16
- **Symbol preview shows nothing** → verify `expo-symbols` version in `package.json`
  matches the Expo SDK 55 pinned version
- **Replace mini-picker not appearing** → check that the Replace segment correctly
  sets `showReplacePicker: true` in screen state

## Implementation references
- Spec: `specs/009-sf-symbols-playground/spec.md`
- Plan: `specs/009-sf-symbols-playground/plan.md`
- Module: `src/modules/sf-symbols-lab/`
- Tests: `test/unit/modules/sf-symbols-lab/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows