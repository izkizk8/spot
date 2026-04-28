# Quickstart — Lock Screen Widgets Module

End-to-end on-device verification of the Lock Screen Widgets module on
a real iPhone running **iOS 16 or later**. The Swift surface for the
four lock-screen sources is not unit-testable on the Windows-based dev
environment used by this repository (per FR-LW-052 / Constitution V
exemption pattern), so the steps below are the canonical proof that
the module works.

> **Estimated time**: 20 minutes (assumes EAS dev client already
> configured and feature 014's home widget already verifiable on the
> device).

## Pre-requisites

- macOS host with Xcode 15+ (or EAS Build cloud) for the iOS dev
  client.
- An iPhone running **iOS 16 or later**, USB-connected and trusted.
- `pnpm install` succeeded on the worktree.
- `pnpm check` is green on the feature branch (target: ≥ 304 suites
  / ≥ 1998 tests, +14 over the 290/1984 branch-start baseline; final
  delta confirmed in retrospective).
- Apple Developer account configured for the dev client signing.
- Feature 014 prerequisite landed: 014's
  `plugins/with-home-widgets/add-widget-bundle.ts` `BUNDLE_SOURCE`
  literal MUST emit the marker comments
  `// MARK: spot-widgets:bundle:additional-widgets:start` /
  `:end` in `ios-widget/SpotWidgetBundle.swift` (research §3 / T001).
  If absent, 027's `expo prebuild` will fail loudly per FR-LW-041.

## 1. Regenerate the prebuild after adding the plugin

After `./plugins/with-lock-widgets` is appended to the `plugins` array
in `app.json`:

```bash
# From the worktree root, on a macOS host:
pnpm install
pnpm exec expo prebuild --clean
```

Verify in the regenerated `ios/spot.xcodeproj`:

- The `LiveActivityDemoWidget` target's **Sources build phase** lists,
  in addition to 014's files:
  - `LockScreenAccessoryWidget.swift`
  - `LockScreenAccessoryProvider.swift`
  - `LockScreenAccessoryEntry.swift`
  - `LockScreenAccessoryViews.swift`
- `ios-widget/SpotWidgetBundle.swift` between the marker comments
  contains exactly:

  ```swift
  // MARK: spot-widgets:bundle:additional-widgets:start
  if #available(iOS 16.0, *) {
      LockScreenAccessoryWidget()
  }
  // MARK: spot-widgets:bundle:additional-widgets:end
  ```

- **No new extension target** named `SpotLockScreenWidget` exists
  (FR-LW-018 / AC-LW-011).
- The App Group entitlement on `spot/spot.entitlements` and
  `LiveActivityDemoWidget/LiveActivityDemoWidget.entitlements` is
  unchanged from 014's configuration (027's plugin does not touch
  entitlements; FR-LW-017).

## 2. Build the dev client and install on iOS 16+

```bash
eas build --profile development --platform ios --local   # OR cloud
# Sideload the IPA per docs/_howto/sideload-iphone.md.
```

On the device:

- The app launches and shows the Modules grid.
- A new **"Lock Screen Widgets"** card appears alongside the existing
  modules (including 014's "Widgets Lab").
- Tapping the card opens a screen titled "Lock Screen Widgets" with
  the five panels in this fixed top-to-bottom order: status panel,
  configuration panel + push button, live preview panel (3 accessory
  cards), setup instructions card, per-kind reload event log
  showing the "No reloads yet" empty-state line.

## 3. Add a spot lock-screen accessory widget on iOS 16+

For each of the three accessory families
(`.accessoryRectangular`, `.accessoryCircular`, `.accessoryInline`):

1. **Long-press the Lock Screen** (lock the device first, then
   long-press to enter customisation).
2. Tap **Customize** → tap your custom Lock Screen.
3. Tap a widget slot (below the clock, or above on iOS 16+ depending
   on Lock Screen layout).
4. In the widget gallery search field, type `spot`.
5. Confirm the gallery shows **exactly one** "spot" entry (not two).
   Tap it.
6. Confirm the family picker exposes **exactly three** options:
   Rectangular, Circular, Inline.
7. Pick the family you're verifying and tap to add. Tap **Done**.

Acceptance:

- The widget renders the **default** configuration on first add
  (`showcaseValue: 'Hello, Lock!'`, `counter: 0`, default tint),
  even if the user has not yet opened the Lock Screen Widgets screen
  (US2 AS4 / spec Edge Case "Widget rendering when App Group is
  brand-new").
- No broken-widget chrome appears in any accessory family.
- On iOS 17+, the widget renders with the system's
  `.fill.tertiary` container background.
- On iOS 16.x, the widget renders with a transparent background
  (no `containerBackground` API; FR-LW-015).

## 4. Round-trip a configuration push

1. Open Lock Screen Widgets in the app.
2. In the configuration panel:
   - Set the showcase value to `LOCK_TEST_<HHMM>` (current minute, so
     it's recognisably new).
   - Bump the counter to `42`.
   - Tap the `green` swatch.
3. Tap **Push to lock-screen widget**. Within ~1 s confirm:
   - A user-visible confirmation appears (toast / inline OK).
   - The per-kind reload event log shows a new entry at the top with
     a current timestamp, the kind identifier `SpotLockScreenWidget`,
     and a success indicator.
   - **All installed lock-screen accessory widgets** refresh to display
     the new value, the new counter, and the green tint within their
     family-appropriate layout (US1 AS4).
4. Switch to the orange tint and tap Push again. Confirm all installed
   widgets update with the orange accent.

## 5. 014 home-widget non-regression

This is the critical cross-feature isolation check (AC-LW-009 /
AC-LW-010 / spec Edge Case "014 home widget and 027 lock widget
pushed in alternation"):

1. Add 014's home widget to the Home Screen if not already present
   (`Widgets Lab` → follow 014's quickstart).
2. From 014's "Widgets Lab" screen, push a configuration with
   `showcaseValue: 'HOME'`, counter `1`, blue tint.
3. From 027's "Lock Screen Widgets" screen, push a configuration with
   `showcaseValue: 'LOCK'`, counter `99`, pink tint.
4. Confirm:
   - The home widget shows `HOME / 1 / blue` (unchanged by step 3).
   - The lock-screen widget shows `LOCK / 99 / pink` (unchanged by
     step 2).
   - 014's reload event log (in the Widgets Lab screen) does NOT
     contain a `SpotLockScreenWidget` entry.
   - 027's reload event log does NOT contain a `SpotShowcaseWidget`
     entry.
5. Repeat alternation 3× and confirm both surfaces remain disjoint.

## 6. Reload event log + cross-platform fallback

**Reload event log (iOS 16+ only)**:

1. Tap **Push to lock-screen widget** 12 times in succession.
2. Confirm the per-kind reload event log shows **exactly 10** entries
   (FR-LW-029 / Edge Case "Per-kind reload event log overflow"), with
   the oldest two evicted.
3. Navigate away from the screen, then back. Confirm the log resets
   to "No reloads yet" (discarded on unmount per FR-LW-029).

**Cross-platform fallback** — run the same screen on:

- **Android** (physical device or emulator)
- **Web** (`pnpm web`)
- An iPhone running **iOS 15** if available

For each, verify (US3):

- The "Lock Screen Widgets are iOS 16+ only" banner is visible at the
  top.
- The configuration panel and the three accessory preview cards
  (Rectangular / Circular / Inline) render and remain interactive
  (tints, counter, showcase value all editable).
- Edits update all three previews in the same render pass.
- The "Push to lock-screen widget" button is **visibly disabled** with
  an inline explanation.
- The status panel's "next refresh time" line is hidden.
- The setup instructions card is hidden.
- The per-kind reload event log is hidden.
- The browser/Metro console shows **zero runtime errors**.
- Manually invoking
  `bridge.reloadTimelinesByKind('SpotLockScreenWidget')` from a debug
  REPL rejects with `WidgetCenterNotSupportedError` (US3 AS4).
- `bridge.isAvailable()` returns `false` without throwing (US3 AS5).

## 7. Idempotency + commutativity of the config plugin

On the macOS host with the worktree checked out:

```bash
# Idempotency:
pnpm install
pnpm exec expo prebuild --clean      # first run
git -C ios diff --stat               # capture state A
git -C ios status                    # also capture untracked listing
pnpm exec expo prebuild --clean      # second run
git -C ios diff --stat               # capture state B
# A and B must be identical (NFR-LW-004).

# Commutativity (FR-LW-040 — order independence):
# Edit app.json to put `./plugins/with-lock-widgets` BEFORE
# `./plugins/with-home-widgets` in the plugins array.
pnpm exec expo prebuild --clean
git -C ios diff --stat               # must equal state A above.
```

Open `ios/spot.xcodeproj` in Xcode and confirm:

- `LiveActivityDemoWidget` target's Sources build phase lists 014's
  files PLUS the four 027 lock-screen files; **no duplicates**.
- `ios-widget/SpotWidgetBundle.swift` contains the marker region
  with exactly one `LockScreenAccessoryWidget()` insertion.
- 014's `ShowcaseWidget()` line in the bundle remains intact.
- No new extension target exists.

## 8. Quality gate

```bash
pnpm format     # MUST be run before commits (FR-LW-051 / AC-LW-013)
pnpm check      # format + lint + typecheck + test
```

Must be green with **zero new warnings** and **zero
`eslint-disable` directives for unregistered rules** (FR-LW-051 /
AC-LW-013). Test totals must show ≥ +14 suites over the 290/1984
branch-start baseline.

## Common pitfalls

- **"Plugin failed: SpotWidgetBundle.swift is missing the required
  marker comments"** — 014's `BUNDLE_SOURCE` literal does not emit
  the markers yet. Land T001 (the 014 prerequisite back-patch)
  before re-running prebuild. The exact 3-line diff is in
  `research.md` §3.
- **Duplicate `LockScreenAccessoryWidget()` line in the bundle** —
  the plugin used append-mode instead of region-replacement. Open
  `plugins/with-lock-widgets/insert-bundle-entry.ts` and confirm the
  region-replacement implementation matches research §4.
- **Lock Screen widget shows "Hello, Widget!" instead of "Hello,
  Lock!"** — the widget is reading 014's keys (`widgetConfig.*`)
  instead of 027's (`spot.widget.lockConfig.*`). Open
  `LockScreenAccessoryProvider.swift` and confirm the keys match
  data-model.md §"Storage keys".
- **Both home and lock widgets refresh on every push** — the bridge
  is calling `reloadAllTimelines()` instead of
  `reloadTimelinesByKind('SpotLockScreenWidget')`. Confirm the
  Push button handler in `screen.tsx` calls the per-kind variant.
- **iOS 16.0 device shows blank widget** — `.containerBackground` was
  invoked unguarded. Wrap in `if #available(iOS 17, *)` per
  research §2 / FR-LW-015.
- **Two "spot" entries in the Lock Screen widget gallery** — a second
  widget extension target was created. Forbidden by FR-LW-018 /
  AC-LW-011. Verify the prebuild used the **append-to-existing**
  path in `add-swift-sources.ts`, not a new-target path.

## Rollback

To remove feature 027 without affecting feature 014:

1. Revert the registry import + array entry in
   `src/modules/registry.ts`.
2. Remove the `./plugins/with-lock-widgets` entry from `app.json`.
3. Delete `src/modules/lock-widgets-lab/`,
   `plugins/with-lock-widgets/`,
   `native/ios/widgets/lock-screen/`,
   `test/unit/modules/lock-widgets-lab/`,
   `test/unit/plugins/with-lock-widgets/`,
   `test/unit/native/widget-center-by-kind.test.ts`.
4. Revert the additive lines in `src/native/widget-center.ts`,
   `widget-center.android.ts`, `widget-center.web.ts`,
   `widget-center.types.ts` (remove
   `reloadTimelinesByKind` / `setLockConfig` / `getLockConfig`).
5. `pnpm exec expo prebuild --clean` and confirm the Xcode project
   matches its pre-027 state — the four lock-screen Swift files are
   gone, the bundle's marker region is empty (markers themselves
   stay in place since they are 014-owned).
