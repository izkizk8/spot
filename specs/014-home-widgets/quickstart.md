# Quickstart — Home Screen Widgets Module

End-to-end on-device verification of the Widgets Lab module on a real
iPhone. The Swift surface is not unit-testable on the Windows-based
developer environment used by this repository (per FR-057), so the steps
below are the canonical proof that the module works.

> **Estimated time**: 15 minutes (assumes EAS dev client already
> configured for the project).

## Pre-requisites

- macOS host with Xcode 15+ (or EAS Build cloud) for the iOS dev client.
- An iPhone running **iOS 14 or later**, USB-connected and trusted.
- `pnpm install` succeeded on the worktree.
- `pnpm check` is green on the feature branch.
- Apple Developer account configured for the dev client signing.

## 1. Build the dev client

```bash
# From the worktree root:
eas build --profile development --platform ios --local   # OR cloud
# When the IPA is produced, sideload it to the device per:
#   docs/_howto/sideload-iphone.md
```

Verify on the device:
- The app launches and shows the Modules grid.
- A new "Widgets Lab" card is visible alongside the existing modules.
- Tapping the card opens a screen titled "Widgets Lab" with the status
  panel, configuration panel, setup-instructions card, three preview
  cards, and the reload-event-log "No reloads yet" empty-state line.

## 2. Add the spot showcase widget at all three sizes

For each size in `[Small, Medium, Large]`:

1. Long-press an empty area of the iOS Home Screen → tap **+**.
2. In the search field type `spot showcase`.
3. Confirm the widget gallery shows **exactly one** entry titled
   "spot showcase" with a one-line description (SC-005). Tap it.
4. Confirm the size picker shows **exactly three** options: Small,
   Medium, Large. Swipe to the size you're verifying.
5. Tap **Add Widget**, then tap an empty Home Screen slot to drop it.

Acceptance:
- The widget renders the **default** configuration on first add
  (showcase value `Hello, Widget!`, counter `0`, tint `blue`)
  even if the app has not yet been opened (SC-006).
- No broken-widget chrome appears at any size (SC-012).

## 3. Round-trip a configuration push

1. Open Widgets Lab in the app.
2. In the configuration panel:
   - Set the showcase value to `WIDGET_TEST_<HHMM>` (where
     `<HHMM>` is the current minute, so it's recognisably new).
   - Bump the counter to `42`.
   - Tap the `green` swatch.
3. Tap **Push to widget**. Within ~1 s confirm:
   - A user-visible confirmation appears (toast / inline OK).
   - The reload event log shows a new entry at the top with a current
     timestamp and a success indicator.
   - **All three** widgets on the Home Screen refresh to display the
     new value, the new counter, and the green tint (SC-003).
4. Switch to the orange tint and tap Push again. Confirm all three
   widgets update with the orange accent.

## 4. Reload event log behaviour

1. Tap **Push to widget** 12 times in succession (any config).
2. Confirm the reload event log shows **exactly 10** entries (FR-036 /
   SC-004), with the oldest two evicted.
3. Navigate away from the screen, then back. Confirm the log is empty
   again ("No reloads yet" — discarded on unmount per FR-044).

## 5. Empty / extreme inputs (Edge Cases)

1. Clear the showcase value (empty string). Confirm the **Push to
   widget** button visibly disables (or, if the implementation chose
   the alternative branch, that pushing falls back to the default).
   The behaviour must match across the iOS push path and the previews.
2. Type a counter value of `9999`. Confirm the previews and the real
   widgets render the value without truncation breaking the layout.
3. Background the app while a push is in flight (rapid Push then
   home-button); return. Confirm the App Group is consistent with the
   most recent push.

## 6. Cross-platform fallback

Run the same screen on:

- **Android** (physical device or emulator)
- **Web** (`pnpm web`)
- An iPhone running **iOS 13 or earlier** if available

For each, verify:

- The "Home Screen Widgets are iOS only" banner is visible at the top.
- The configuration panel and the three preview cards render and
  remain interactive (tints, counter, showcase value all editable).
- Edits update all three previews in the same render pass (SC-007).
- The "Push to widget" button is **visibly disabled** with an inline
  explanation.
- The status panel's "next refresh time" line, the setup instructions
  card, and the reload event log are **not** rendered.
- The browser/console shows **zero runtime errors** (SC-008).
- Manually invoking `bridge.reloadAllTimelines()` from a debug REPL
  rejects with `WidgetCenterNotSupportedError`.
- `bridge.isAvailable()` returns `false` without throwing.

## 7. Idempotency of the config plugin

On a macOS host with the worktree checked out:

```bash
pnpm install
pnpm exec expo prebuild --clean      # first run
git -C ios diff --stat               # capture state A
pnpm exec expo prebuild --clean      # second run
git -C ios diff --stat               # capture state B
# A and B must be identical (SC-011).
```

Open `ios/spot.xcodeproj` in Xcode and confirm:

- The **`LiveActivityDemoWidget`** target's Sources build phase lists:
  - `LiveActivityDemoWidget.swift` (existing, with `@main` removed)
  - `ShowcaseWidget.swift`, `ShowcaseProvider.swift`,
    `ShowcaseEntry.swift`, `ShowcaseWidgetView.swift`,
    `AppGroupKeys.swift` (new)
  - `SpotWidgetBundle.swift` (new, contains `@main` + the
    `WidgetBundle`)
- Both `spot/spot.entitlements` and
  `LiveActivityDemoWidget/LiveActivityDemoWidget.entitlements` contain
  `<string>group.com.izkizk8.spot.showcase</string>` under
  `com.apple.security.application-groups`.
- No new extension target named `SpotShowcaseWidget` exists.

## 8. Quality gate

```bash
pnpm check    # format + lint + typecheck + test
```

Must be green with **zero new warnings** (SC-013).

## Rollback

To remove the feature without affecting feature 007:

1. Revert the registry import + array entry in `src/modules/registry.ts`.
2. Remove the `./plugins/with-home-widgets` entry from `app.json`.
3. Delete `src/modules/widgets-lab/`, `src/native/widget-center.*`,
   `plugins/with-home-widgets/`, `native/ios/widgets/`.
4. `pnpm exec expo prebuild --clean` and confirm
   `LiveActivityDemoWidget` is back to its pre-014 state (its `@main`
   restored on `LiveActivityDemoWidget.swift`, no `SpotWidgetBundle.swift`,
   no App Group entitlement on either target).
