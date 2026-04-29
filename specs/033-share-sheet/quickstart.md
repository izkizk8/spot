# Quickstart — Share Sheet Module (033)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying feature
033 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an iOS
   device. Closes FR-022, FR-023, SC-005, SC-007, SC-008, SC-009.
2. **On-device verification** — required to close US1 / US2 / US3 /
   US4 / US5 / US6 acceptance scenarios that depend on
   `UIActivityViewController` and the system clipboard actually
   running on real iOS / Android / Web hardware. Closes SC-001
   through SC-004 and SC-010.

Unlike feature 030 there is **no lldb step** —
`UIActivityViewController` is verifiable directly from the running
app by tapping **Share** on the screen.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device iOS steps: macOS host with Xcode 16+, an iOS 8+
  device or simulator, and Apple developer signing configured for
  the `com.izkizk8.spot` bundle id (or a fork thereof). An **iPad**
  device or simulator is required to verify SC-002 (anchor
  presentation without crash).
- For Android on-device steps: a configured Android emulator or
  device with the Files app / Google Files installed.
- For Web verification: a desktop browser (Chrome / Edge / Safari).
  Web Share API is supported on Safari macOS 12.1+ and Chrome
  Android; for the clipboard fallback path, any modern browser.

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install
pnpm format       # FR-023 — must produce no diff after the feature commit
pnpm lint         # FR-023 — no eslint-disable directives anywhere in 033
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # SC-005 — all listed test files pass
pnpm check        # FR-023 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta of
**≥ +18 suites** versus 032's closing baseline (see plan.md §"Test
baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ test/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: no matches. (FR-023)

### 1.3 Confirm registry growth is +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts
```

**Expected**: exactly one new `import` line and one new array entry
(`shareSheetLab`). No reordering of existing entries.

### 1.4 Confirm `app.json` is unchanged

```pwsh
git --no-pager diff main...HEAD -- app.json
```

**Expected**: empty diff. Per research §3 / R-C, no plugin entry is
added. (FR-021 + SC-008)

### 1.5 Confirm `package.json` is unchanged

```pwsh
git --no-pager diff main...HEAD -- package.json pnpm-lock.yaml
```

**Expected**: empty diff. Both `expo-clipboard` and `expo-sharing`
are already pinned (the latter from feature 032).

### 1.6 Confirm `plugins/` directory is unchanged

```pwsh
git --no-pager diff main...HEAD --name-only -- plugins/
```

**Expected**: no entries. `plugins/with-share-sheet/` is **not**
created.

### 1.7 Web bundle isolation

The screen.web.tsx variant must NOT pull `src/native/share-sheet.ts`
into the web bundle. Verified at the test level by
`screen.web.test.tsx` asserting the import graph; spot-check by
inspecting the test output for that suite.

---

## §2 — On-device verification

### 2.1 iOS — basic share (US1)

1. Launch the app on iOS device/simulator.
2. Open **Modules** tab → tap the **Share Sheet** card.
3. With **Text** selected and the default text:
   1. Tap **Share**. Verify `UIActivityViewController` presents.
   2. Pick any destination (e.g., **Copy**). Verify result log shows
      `{ type: 'text', activityType: 'com.apple.UIKit.activity.CopyToPasteboard',
      outcome: 'completed' }`.
   3. Tap **Share** again, dismiss the sheet without choosing.
      Verify result log entry has `outcome: 'cancelled'` and
      `activityType: '(none)'`.
4. Switch to **URL**, accept the default `https://expo.dev`, repeat
   the share + cancel flow.
5. Clear the URL field. Verify the **Share** button disables and an
   inline error appears.

**Closes**: SC-001, SC-010, US1 acceptance scenarios.

### 2.2 iOS — exclusions (US2)

1. With **Text** selected, check **Mail** and **Print** in the
   exclusions panel. Tap **Share**. Verify Mail and Print are absent
   from the share sheet.
2. Toggle **Hide all** on. Tap **Share**. Verify the sheet shows
   only the system-required entries (and the custom activity if
   enabled — see 2.3).

**Closes**: SC-004, US2 acceptance scenarios.

### 2.3 iOS — custom activity (US3)

1. Toggle **Include 'Copy with prefix' custom activity** on.
2. With **Text** = `"Hello"` selected, tap **Share**.
3. In the share sheet, scroll to find **Copy with prefix** in the
   actions row. Tap it.
4. Open another app (e.g., Notes), paste. Verify clipboard contents
   are exactly `"Spot says: Hello"`.
5. Toggle the custom activity off, tap **Share** again. Verify
   **Copy with prefix** is absent.

**Closes**: SC-003, US3 acceptance scenarios.

### 2.4 iOS — image and file (US4)

1. Switch to **Image**. Pick the second tile in the 2x2 grid.
   Tap **Share**, pick **Save Image** (or any destination), confirm
   result log records the activity type.
2. Switch to **File**. If documents-lab has files, pick one. If not,
   the bundled fallback file is shown — pick it. Tap **Share**,
   choose any destination, confirm result log records the activity
   type.

**Closes**: US4 acceptance scenarios.

### 2.5 iPad — anchor presentation (US5)

**MUST run on iPad (device or simulator).** This step is
non-negotiable for closing SC-002.

1. Open the **Share Sheet** card on iPad.
2. The AnchorSelector panel should be visible (4-button 2x2 grid).
3. For each anchor in turn (top-left, top-right, center, bottom):
   1. Tap the anchor button.
   2. Tap **Share**.
   3. Verify the share sheet presents as a popover anchored near
      the chosen button. **The app MUST NOT crash.**
   4. Dismiss the sheet.
4. Rotate the iPad between selecting an anchor and tapping Share.
   Verify the sheet still presents without crashing (R-F: rect is
   re-read at share time).

**Closes**: SC-002, US5 acceptance scenarios.

### 2.6 Android — fallbacks (US6)

1. Launch the app on Android device/emulator.
2. Open the **Share Sheet** card. Verify:
   - AnchorSelector is hidden.
   - ExcludedActivitiesPicker is rendered but visibly disabled.
   - CustomActivityToggle is rendered but visibly disabled with
     caption.
3. With **Text** selected, tap **Share**. Verify text is copied to
   clipboard (paste into another app to confirm) and the result log
   records `{ activityType: 'android.clipboard-fallback', outcome:
   'completed' }`.
4. Switch to **File** with a sample file selected. Tap **Share**.
   Verify `expo-sharing` opens the system share sheet. Pick any
   destination; confirm result log records `outcome: 'completed'`.

**Closes**: US6 acceptance scenarios (Android half), SC-007 partial.

### 2.7 Web — fallbacks (US6 cont.)

1. Launch the app in the browser (`pnpm web`).
2. Open the **Share Sheet** card.
3. With **Text** selected, tap **Share**:
   - On a browser supporting Web Share API (Safari macOS, Chrome
     Android): the native share UI appears.
   - On a browser without (Chrome/Edge desktop): the text is copied
     to the clipboard and an inline "Copied to clipboard" toast
     appears. Result log records `{ activityType:
     'web.clipboard-fallback', outcome: 'completed' }`.
4. Verify AnchorSelector is hidden and the iOS-only controls are
   visibly disabled with explanatory captions.

**Closes**: US6 acceptance scenarios (Web half), SC-007 complete.

---

## §3 — Sign-off checklist

- [ ] §1 JS-pure verification complete (commands exit 0; baseline
      delta substituted into plan.md §"Test baseline tracking").
- [ ] §2.1 iOS basic share verified.
- [ ] §2.2 iOS exclusions verified.
- [ ] §2.3 iOS custom activity verified (clipboard contents match
      `"Spot says: <text>"` exactly).
- [ ] §2.4 iOS image + file verified.
- [ ] §2.5 iPad anchor verified for all four presets, including
      orientation change. **No crashes.**
- [ ] §2.6 Android fallbacks verified.
- [ ] §2.7 Web fallbacks verified on at least two browsers (one
      with Web Share API, one without).
- [ ] `retrospective.md` written with final test totals.
