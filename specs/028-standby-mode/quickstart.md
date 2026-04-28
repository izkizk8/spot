# Quickstart — Verifying the StandBy Mode Module

This guide walks a reviewer through verifying feature 028 manually.
There are two paths: a **cross-platform fallback path** (Android /
Web / iOS < 17) that exercises the in-app preview half, and a
**device path** (iOS 17+ on a real iPhone) that exercises the full
StandBy round-trip including the on-device widget refresh.

## Prerequisites

- Repository at `028-standby-mode` branch with all 028 source landed.
- `pnpm install` clean.
- For the device path: an iPhone running **iOS 17.0 or later** (any
  model — non-Pro iPhones do support StandBy, just without AOD); a
  charger (MagSafe puck, Qi puck, or Lightning / USB-C cable);
  Xcode + valid signing for the dev build.
- For the cross-platform fallback path: any combination of a desktop
  web browser, an Android emulator or device, and (optionally) an
  iPhone simulator on iOS 16.x.
- Features 014 (Home Widgets) and 027 (Lock Screen Widgets) merged
  on the same branch parent — required by the coexistence assertion
  in §7.

## Path A — Cross-platform fallback (Android / Web / iOS < 17)

This path exercises everything that does NOT require iOS 17+: the
explainer card, the configuration panel including the
rendering-mode segmented picker, the live StandBy preview, the
disabled push button, the iOS-17-only banner, and the absence of
the setup card / reload event log on these platforms.

### A.1 Web

1. `pnpm web` (or `pnpm exec expo start --web`).
2. Open the running app in Chrome / Firefox / Safari.
3. Navigate to the Modules home grid. Confirm a "StandBy Mode" card
   is present (FR-SB-002).
4. Tap the card. The screen header reads **"StandBy Mode"**
   (FR-SB-025).
5. Confirm the on-screen elements appear in this fixed top-to-bottom
   order (FR-SB-027):
   1. **"StandBy Mode is iOS 17+ only"** banner (FR-SB-027 (a))
   2. Explainer card (FR-SB-039) — mentions StandBy + the three
      rendering modes
   3. Configuration panel (showcase value field, counter input,
      tint picker, rendering-mode segmented picker, **disabled**
      "Push to StandBy widget" button with inline explanation)
   4. Live StandBy preview card
   - Setup instructions card MUST NOT be visible (FR-SB-041)
   - Reload event log MUST NOT be visible
6. Edit the showcase value to `"Web demo"`. The live preview card
   updates within the same render pass (FR-SB-036).
7. Bump the counter. The live preview's large numerals update.
8. Pick the green tint. The live preview accent changes.
9. Switch the rendering-mode segment to **Accented**. The preview
   re-renders with the high-contrast monochrome+tint treatment
   (FR-SB-037, US3 AS3).
10. Switch to **Vibrant**. The preview re-renders with the
    translucent / luminance-preserving approximation.
11. Switch back to **Full Color**. The preview shows the saturated
    tint as background.
12. Try clicking the disabled "Push to StandBy widget" button. It
    MUST NOT trigger any bridge call. Open the browser DevTools
    console and confirm no `WidgetCenterNotSupportedError` is logged
    (the button is disabled, so no call is made).
13. Reload the page. The configuration MUST persist (the AsyncStorage
    shadow store at key `spot.widget.standbyConfig` survives reload).

### A.2 Android

1. `pnpm android` (or `pnpm exec expo run:android`).
2. Repeat steps 3–13 above on the Android device / emulator. All
   assertions are identical (FR-SB-027 covers Android symmetrically).

### A.3 iOS < 17 (optional — only if you have an iOS 16.x simulator)

1. Boot an iOS 16.4 simulator. `pnpm exec expo run:ios --device <id>`.
2. Repeat steps 3–13. Additionally confirm: opening the screen
   does NOT crash with a "missing native module" error and does NOT
   attempt to load any iOS-17-only native bridge symbol (FR-SB-046,
   SC-007).

### A.4 Bridge throw assertion (any non-iOS-17+ platform)

In a Jest test environment OR via a manual JS REPL on the running
app:

```ts
import { setStandByConfig, getStandByConfig, isAvailable } from '@/native/widget-center';

await isAvailable();   // returns false on Android / Web / iOS < 17 — does NOT throw
await getStandByConfig();  // throws WidgetCenterNotSupportedError
await setStandByConfig({ showcaseValue: 'x', counter: 1, tint: 'red', mode: 'fullColor' });
                            // throws WidgetCenterNotSupportedError
```

Both throws MUST be `WidgetCenterNotSupportedError` (FR-SB-023, US3
AS4). They MUST NOT silently no-op.

## Path B — iOS 17+ device round-trip

This path exercises the full feature: StandBy widget gallery,
TimelineProvider, App Group, three rendering modes on a real device.

### B.1 Build and install

1. Plug in an iPhone running iOS 17 or later.
2. `pnpm exec expo prebuild --clean`. (Confirm no Xcode project
   surprises — see §7 below for the idempotency check.)
3. `pnpm exec expo run:ios --device` and select your phone.
4. Trust the developer certificate on the phone if prompted.

### B.2 Add the spot StandBy widget to the StandBy stack

1. On the iPhone: open **Settings → StandBy** and confirm StandBy
   is **enabled**.
2. Optional: Settings → StandBy → **Display** → set to "Always On"
   if your iPhone supports it (14 Pro / 15 Pro / later Pro models).
3. Place the iPhone on its charger (MagSafe puck preferred; cable
   works).
4. Rotate the phone to **landscape** and **lock** the screen. The
   StandBy view appears (clock / photos / Smart Stack panes).
5. Long-press the right Smart Stack pane. Tap the **+** button to
   open the StandBy widget gallery.
6. In the gallery search field, type **"spot"**. Confirm exactly
   one entry appears (FR-SB-008, US2 AS2).
7. Tap the entry. Confirm exactly two family options are shown:
   `.systemMedium` and `.systemLarge` (FR-SB-005, US2 AS2). No
   `.systemSmall` and no accessory families.
8. Add `.systemMedium`. Tap **Done**.
9. The widget appears in the Smart Stack rendering the documented
   default config: showcase value `"StandBy"`, counter `0`, default
   tint, mode `.fullColor` (FR-SB-029, US2 AS4). NOT a placeholder
   or error chrome.

### B.3 Push a configuration and observe refresh

1. Unlock the phone and open the Spot app.
2. Navigate to Modules → **StandBy Mode**.
3. Confirm the iOS 17+ panel layout (FR-SB-026):
   1. Explainer card
   2. Configuration panel (showcase value, counter, tint,
      rendering-mode segmented picker, **enabled** "Push to StandBy
      widget" button)
   3. Live StandBy preview
   4. Setup instructions card
   5. Reload event log — initially shows the empty-state line
      "No reloads yet" (FR-SB-033 last sentence)
4. Edit the showcase value to `"Demo at 14:02"`. Bump the counter
   to `42`. Pick the orange tint. Switch the rendering-mode segment
   to **Accented**. Watch the live preview re-render
   immediately (FR-SB-036).
5. Tap **"Push to StandBy widget"**.
6. Confirm:
   - A user-visible "Pushed" confirmation appears.
   - The reload event log gains a new top entry tagged
     `SpotStandByWidget`, status `success`, with a timestamp
     matching the push (FR-SB-030, FR-SB-033).
   - The empty-state line is gone.
7. Place the phone back on the charger in landscape, lock it.
   StandBy activates. The spot StandBy widget refreshes within
   1 second (NFR-SB-002, US1 AS4) showing:
   - Showcase value `"Demo at 14:02"`
   - Counter `42`
   - Orange tint
   - **Accented** rendering treatment (the system honours the
     accented mode declared via
     `.widgetAccentedRenderingMode(.accented)` in the widget
     configuration)

### B.4 Test all three rendering modes (AC-SB-014)

1. Repeat §B.3 with the rendering-mode segment set to **Full Color**.
   Push, observe the StandBy widget refresh in saturated colour.
2. Repeat with **Vibrant**. The system applies vibrant rendering in
   night-mode StandBy (after the device dims; on AOD-capable
   iPhones this is automatic; on others, leave the room dark for
   ~30 s and watch the widget transition to translucent / luminance
   rendering).
3. Confirm all three on-device renderings are visibly distinct
   (SC-002, AC-SB-014).

### B.5 Add `.systemLarge` and observe parity (US2 AS5)

1. From the StandBy stack, long-press → +, search "spot", add the
   `.systemLarge` family.
2. Confirm both families now appear in the right Smart Stack and
   both render the same shared configuration in their
   family-appropriate layouts (large numerals on `.systemLarge`,
   FR-SB-015).
3. Push a new configuration. Both family instances refresh within
   1 second (US2 AS5).

### B.6 Tap-through deep link (US2 AS6, SC-009)

1. With the spot StandBy widget visible in StandBy and the device
   **unlocked** (charger + landscape + unlocked — FaceID grants
   StandBy interactivity on iOS 17+), tap the widget.
2. iOS opens the Spot app at the **StandBy Mode module screen**,
   not the default landing route (FR-SB-017,
   `.widgetURL("spot://modules/standby-lab")`).
3. If the route does NOT resolve to the StandBy Mode screen, this
   is the R-D fallback case in plan.md / research.md §7. Update
   the literal in `StandByViews.swift` and re-run.

### B.7 Cross-feature isolation (AC-SB-009 / AC-SB-010)

1. Have the home widget (014) installed on the home screen, the
   lock-screen accessory widget (027) on the lock screen, and the
   StandBy widget (028) in StandBy.
2. Open the **Home Widgets** module screen (014). Push a new home
   config. Observe:
   - The home widget refreshes.
   - The lock-screen widget DOES NOT refresh.
   - The StandBy widget DOES NOT refresh.
   - The StandBy module's reload event log (visible only when
     navigated to the StandBy screen) MUST NOT contain the home
     push event.
3. Repeat from the Lock Screen Widgets module (027). Same isolation:
   only 027's surface refreshes.
4. Repeat from the StandBy Mode module (028). Same isolation: only
   028's surface refreshes.

### B.8 Per-kind reload event log overflow (FR-SB-033, US1 AS5)

1. On the StandBy Mode screen, tap "Push to StandBy widget" 11
   times in rapid succession.
2. Confirm the reload event log displays exactly 10 entries; the
   oldest (the first push) has been evicted; the most recent push
   is at the top.

### B.9 Rapid pushes / no-installed-widget edge cases

1. Remove the spot StandBy widget from the StandBy stack.
2. Tap "Push to StandBy widget" again. Confirm:
   - The bridge call resolves successfully.
   - The reload event log records the push as `success`.
   - No widget refresh occurs (none is installed) — this is correct.
3. Re-add the widget. The next push refreshes it.

## §7 Idempotency and commutativity audit (AC-SB-008, NFR-SB-004)

### 7.1 Run `expo prebuild` twice

1. From a clean checkout: `pnpm exec expo prebuild --clean`.
2. `git status` — note the diff vs. the prebuild output.
3. `pnpm exec expo prebuild --clean` again.
4. `git status` — the diff MUST be byte-identical to step 2. No
   duplicated Swift sources in the widget extension target's
   `Sources` build phase. No duplicated `StandByWidget()` line in
   `ios-widget/SpotWidgetBundle.swift`. No regression of 014's or
   027's plugin output.

### 7.2 Reorder the three widget plugins in `app.json`

1. In `app.json`'s `plugins` array, swap the order of
   `./plugins/with-home-widgets`, `./plugins/with-lock-widgets`, and
   `./plugins/with-standby-widget`. Try at least 3 of the 6
   permutations.
2. For each permutation: `pnpm exec expo prebuild --clean`.
3. Compare `ios/` directory contents byte-for-byte across
   permutations (e.g. `git diff` against a known-good snapshot).
   The Xcode project state MUST be byte-identical (NFR-SB-004,
   AC-SB-008). The bounded region in `SpotWidgetBundle.swift` MUST
   contain both the `LockScreenAccessoryWidget()` line and the
   `StandByWidget()` line in the same lexicographic order
   regardless of plugin invocation order (research §3
   commutativity proof).

### 7.3 Coexistence regression (AC-SB-010)

1. With the device path (§B) artefacts already verified, push a
   home config (014), a lock config (027), and a StandBy config
   (028) in any order.
2. Confirm all three widget surfaces (home / lock / StandBy)
   continue to refresh independently and correctly.
3. The three reload event logs (one per module screen) remain
   independent. The three App Group key namespaces
   (`spot.widget.config` / `spot.widget.lockConfig` /
   `spot.widget.standbyConfig`) remain disjoint.

## §8 No-new-extension-target audit (AC-SB-011, SC-008)

1. After `expo prebuild`, open the generated Xcode project in
   Xcode.
2. Inspect the Targets list in the Project navigator. Confirm
   exactly the targets that were present before 028's plugin was
   installed — no new widget extension target named
   `SpotStandByWidget` or similar.
3. Inspect the existing widget extension target's **Build Phases →
   Compile Sources**. Confirm the four 028 Swift files
   (`StandByWidget.swift`, `StandByProvider.swift`,
   `StandByEntry.swift`, `StandByViews.swift`) appear in the list
   alongside 014's and 027's sources. No duplicates.

## §9 Cleanup

1. Remove the spot StandBy widget from the StandBy stack (long-press
   → −).
2. Remove the spot Lock Screen widget and the spot Home widget if
   they were added for the regression test.
3. Settings → StandBy → disable StandBy if you don't normally use
   it.
