# Quickstart — SF Symbols Lab (spec 009)

This is the verify-and-ship recipe for the SF Symbols Lab module. It
covers install, dev server, on-device verification, the cross-platform
smoke matrix, and the local quality gate.

---

## 1. Install

```bash
# from repo root
pnpm install
```

`expo-symbols` is already pinned at `~55.0.7` in `package.json`. No
new runtime dependency is added by this feature, no prebuild, no
config plugin.

---

## 2. Dev

```bash
pnpm start             # Metro
pnpm ios               # iOS simulator (real symbol effects on iOS 17+ simulators)
pnpm android           # Android emulator (banner + plain-text glyph fallback)
pnpm web               # Web (banner + plain-text glyph fallback)
```

To exercise the iOS 17+ symbol effects you need an iOS 17+ simulator
(or device). The Replace / Appear / Disappear effects also run on
iOS 17+ — they are emulated by the wrapper via Reanimated and will be
visible there too. On Android and Web the effects are intentionally
no-ops — only the static plain-text glyph and the tint swatch
re-render.

---

## 3. On-device verification matrix

After landing the module, verify each story end-to-end on each
platform.

### Story 1 — Pick a symbol and play an effect (P1, iOS 17+)

| Platform | Step | Expected |
|---|---|---|
| iOS 17+ device | Open Modules grid → tap **SF Symbols Lab** card | Screen renders with banner *hidden*, preview area dominant, Symbol Picker (12 cells), Effect Picker (7 segments), Speed / Repeat row, Tint Picker (4 swatches), and **Play Effect** button |
| iOS 17+ device | Note initial selections | Symbol = `heart.fill`, Effect = Bounce, Speed = Normal, Repeat = Once |
| iOS 17+ device | Tap **Play Effect** | Heart bounces once within ~100 ms (SC-002) |
| iOS 17+ device | Pick `bolt.fill`; tap **Play Effect** | Bolt bounces |
| iOS 17+ device | Pick `sparkles` + Pulse; tap **Play Effect** | Sparkles pulses |
| iOS 16 device | Open Modules grid | SF Symbols Lab card is hidden / disabled by spec 006's `minIOS` gating (FR-004); no crash |

### Story 2 — Speed / Repeat / Tint / Replace mini-picker (P2)

| Step | Expected |
|---|---|
| Switch Speed to Fast; pick Bounce; tap **Play Effect** | Bounce plays at ~2× speed |
| Switch Repeat to 3 times; tap **Play Effect** | Effect repeats 3 times then stops |
| Switch Repeat to Indefinite; tap **Play Effect** | Effect loops continuously |
| Tap **Play Effect** again while Indefinite is running | Effect stops cleanly (FR-021) |
| Tap a different tint swatch | Preview re-tints within ~100 ms with no Play Effect tap (FR-023, SC-006) |
| Switch Effect to Replace | "Replace with" mini-picker appears showing 11 symbols (primary excluded) (FR-025) |
| Pick a secondary symbol; tap **Play Effect** | Primary swaps to secondary with a crossfade transition |
| Switch Effect to Pulse, then back to Replace | Mini-picker hidden then re-shown; previously chosen secondary is restored (FR-027) |
| Switch Effect to Appear; tap **Play Effect** | Symbol fades in from 0 → 100% opacity over ~250 ms |
| Switch Effect to Disappear; tap **Play Effect** | Symbol fades out from 100% → 0% opacity over ~250 ms |
| Switch Effect to Variable Color; tap **Play Effect** | Symbol's layers iteratively fade in/out (iOS 17+ variable color animation) |
| Switch to Replace; observe Speed / Repeat selectors | Both rendered, but visibly de-emphasized / non-interactive (FR-015, FR-016) |
| Navigate back during Indefinite playback | Effect stops; no animations leak past unmount (edge case) |

### Story 3 — Android / Web fallback (P2)

| Platform | Expected |
|---|---|
| Android | Banner reads "iOS 17+ only" at top of screen (FR-028) |
| Android | All four pickers + Replace mini-picker render and accept input (FR-030) |
| Android | Preview area shows the SF Symbol *name as plain text* (e.g. `heart.fill`) styled with current tint and a large display weight (FR-029) |
| Android | Tapping a different tint swatch re-tints the plain-text glyph immediately |
| Android | Tapping **Play Effect** produces no error, no console warning, no crash (FR-031) |
| Web | Same expectations as Android |
| Web | Browser devtools console shows zero `expo-symbols`-related runtime errors (SC-005) |

---

## 4. Quality gates (local)

```bash
pnpm check     # = format:check && lint && typecheck && test
```

All four must pass with zero warnings introduced by this module
(SC-009). The seven new test files live under
`test/unit/modules/sf-symbols-lab/`.

If you only want fast feedback during development:

```bash
pnpm test --testPathPattern sf-symbols-lab
```

---

## 5. Removing the module (sanity check)

The module is fully removable as a unit. To prove it during code
review:

1. Delete `src/modules/sf-symbols-lab/`
2. Delete `test/unit/modules/sf-symbols-lab/`
3. Remove the one import line and one array entry in
   `src/modules/registry.ts`

`pnpm check` should still pass and the rest of the app should be
unchanged. This is the spec 006 plug-in contract working as designed
(FR-033, SC-008).
