# Quickstart: SwiftUI Interop Showcase

Manual verification companion to the JS-only Jest suite. Real SwiftUI
rendering and round-trip timing (SC-002) can only be validated on a
physical device or simulator with a fresh native build.

## Prerequisites

- macOS host with Xcode (latest), an iOS 16+ simulator or a physical
  iPhone on iOS 16+, plus Android Studio (or a connected Android
  device) and any modern desktop browser.
- Repo cloned, `pnpm install` clean.
- `@expo/ui` installed (`npx expo install @expo/ui` if not yet
  present in `package.json`).

## 1. JS quality gates (Windows or macOS)

From the repo root on the `010-swiftui-interop` branch:

```sh
pnpm check
```

Expected: format, lint, typecheck, and Jest all pass with no new
warnings (SC-007). The Jest suite includes:

- `test/unit/modules/swiftui-interop/manifest.test.ts`
- `test/unit/modules/swiftui-interop/screen.test.tsx`
- `test/unit/modules/swiftui-interop/screen.android.test.tsx`
- `test/unit/modules/swiftui-interop/screen.web.test.tsx`
- `test/unit/modules/swiftui-interop/demos/*.test.tsx` (3 per demo × 5 demos = 15 files)

Plus the existing global `test/unit/modules/registry.test.ts` which
will now also include the new module in its enumeration.

## 2. iOS on-device verification (required for SC-001 .. SC-004)

```sh
npx expo prebuild --clean
npx expo run:ios --device   # or --simulator
```

In the running app:

1. Open the **Modules** tab. Confirm a **SwiftUI Interop** card is
   visible (FR-002).
2. Tap the card. The screen scrolls vertically through five blocks in
   this exact order: **Native Picker → Native ColorPicker → Native
   DatePicker → Native Slider → Native Stepper / Toggle row**
   (FR-004, US1 scenario 2).
3. **Picker block**: change either the segmented or the wheel Picker;
   the RN text echo below updates within ~100 ms (US1 scenario 3,
   SC-002).
4. **ColorPicker block**: tap the SwiftUI ColorPicker swatch, pick a
   new color; the RN preview swatch above re-tints (US1 scenario 4).
5. **DatePicker block**: change either the compact or the wheel
   DatePicker; the RN text label updates to show the new date
   (US1 scenario 5).
6. **Slider block**: drag the SwiftUI Slider end-to-end; the RN bar
   width above tracks proportionally and never lags more than one
   frame at the worst (US1 scenario 6, SC-002).
7. **Stepper / Toggle block**: tap +/− on the Stepper and flip the
   Toggle; the RN readout shows both the current number and the
   on/off state (US1 scenario 7).
8. Each block shows a short caption naming the SwiftUI control and
   stating that the value is read in React (FR-011, SC-004).

Pass criteria for SC-001: a first-time user completes step 3 within
10 seconds without consulting docs.

## 3. iOS 15 gating verification (FR-001, edge case)

If you have a device or simulator on iOS 15 (or you can temporarily
set `minIOS: '16.0'` in code higher than your simulator), open the
Modules grid and confirm the **SwiftUI Interop** card is **not**
visible — the existing registry gate hides it (SC-008).

## 4. Android verification (US2, SC-005)

```sh
npx expo run:android
```

1. Open the Modules tab; confirm the **SwiftUI Interop** card is
   visible (FR-002).
2. Tap the card. Confirm the banner reads exactly:
   `SwiftUI is iOS-only — here's the Material counterpart` (FR-012).
3. Confirm RN fallback equivalents render for Picker, ColorPicker,
   DatePicker, Slider, and Stepper/Toggle (FR-013).
4. Interact with each fallback. **No runtime errors** are raised; no
   `@expo/ui/swift-ui` code is invoked (FR-014, SC-005). If you have
   `adb logcat` open, no SwiftUI-related symbol should appear.

## 5. Web verification (US3, SC-005)

```sh
npx expo start --web
```

1. Open the Modules tab; confirm the **SwiftUI Interop** card is
   visible.
2. Click the card. Confirm the banner reads exactly:
   `Native SwiftUI is iOS-only` (FR-015).
3. Confirm plain HTML / RN-Web equivalents render and are interactive
   (FR-016).
4. Open the browser DevTools Network and Sources panes; confirm no
   chunk references `@expo/ui/swift-ui` (FR-017).

## 6. Additive-only verification (SC-006)

```sh
git diff --name-only main...HEAD
```

Expected: every changed source file is under
`src/modules/swiftui-interop/` or `test/unit/modules/swiftui-interop/`,
**except** for exactly **one** modified file outside that tree:
`src/modules/registry.ts` (one import + one array entry) — and
`package.json` / `pnpm-lock.yaml` if `@expo/ui` was newly installed.
No other file outside the module dir is modified by this feature.

## 7. Constitution gate (SC-008)

Constitution at `.specify/memory/constitution.md` v1.0.1 — confirm
this feature requests no exemption and that the Constitution Check
table in `plan.md` shows ✅ for every principle.
