# Quickstart — EventKit (Calendar + Reminders) Module (037)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the on-device verification checklist for feature 037.
JS-pure tests (run via `pnpm check`) cover every assertion that does
not require real EventKit hardware; this checklist covers the
remainder.

---

## §1 — JS-pure verification (Windows / macOS / Linux)

Run from the repository root:

```sh
pnpm install
pnpm check
```

Expected:

- Lint: 0 errors, 0 warnings, **0 `eslint-disable` directives** in any
  file under `src/modules/eventkit-lab/`, `plugins/with-eventkit/`, or
  the new test directories (SC-010).
- Typecheck: green under TypeScript strict mode.
- Tests: all 18+ new suites enumerated in `spec.md` FR-021 pass; the
  baseline grows by ≥ 18 suites versus 036's closing total
  (recorded in `specs/037-eventkit/retrospective.md` after merge).
- Format: `pnpm format` is a no-op (FR-028).

---

## §2 — Smoke verification of the config plugin

Run a fresh `expo prebuild` against a clean checkout:

```sh
git clean -xfd ios android
npx expo prebuild --platform ios --clean
```

Verify the generated `ios/<app>/Info.plist`:

```sh
plutil -p ios/*/Info.plist | grep -E 'NSCalendars|NSReminders'
```

Expected output (exact strings depend on the operator override; the
defaults are):

```
"NSCalendarsUsageDescription" => "This module demonstrates EventKit calendar access for educational purposes."
"NSCalendarsWriteOnlyAccessUsageDescription" => "This module may demonstrate write-only calendar event creation on iOS 17+."
"NSRemindersUsageDescription" => "This module demonstrates EventKit reminders access for educational purposes."
"NSRemindersFullAccessUsageDescription" => "This module demonstrates full reminders access on iOS 17+ for educational purposes."
```

Re-run `npx expo prebuild --platform ios` (without `--clean`).
Expected: Info.plist diff is empty (idempotency, SC-008).

Inspect `git status` after a fresh prebuild + the 037 plugin enabled
alongside all 23 prior plugins. Expected: each prior plugin's
contributions to `Info.plist`, `entitlements`, `Podfile`,
`AndroidManifest.xml`, and the Xcode project tree are byte-identical
to the parent branch (SC-009).

---

## §3 — On-device iOS verification (iOS 4+, ideally also iOS 17+)

Run on an iOS device or simulator. (Simulators expose calendars but
do not always expose reminders; an iCloud-signed-in physical device
is preferred for the Reminders tab.)

```sh
npx expo run:ios
```

### §3.1 — Calendar tab, fresh permission

1. Open the app, navigate to Modules → "EventKit Lab".
2. Default tab is Calendar.
3. **Authorization card**: status reads `notDetermined`. Tap
   "Request Access". Approve in the system prompt.
4. On iOS 17+, the system prompt includes "Full Access" and
   "Write Only" options. Choose **Full Access** for this run.
5. Authorization card transitions to `authorized`.
6. **Calendars list** populates with at least one calendar (title,
   type, color). Tap **Refresh** — list re-renders without
   flicker.
7. **Events query card**: default segment is **Today**. Verify the
   list either renders today's events (title, location, start–end,
   all-day badge where applicable) or an empty-state row.
8. Switch to **Next 7 days** then **Next 30 days**. Verify the list
   updates each time and that the previously-selected segment
   remains visually selected.

### §3.2 — Calendar tab, full CRUD

1. Tap **Compose** (or the equivalent inline composer surface).
2. Fill: title = "Spot test event", location = "Home", start = now+1h,
   end = now+2h, all-day = off, calendar = first writable calendar,
   alarm = 15 min.
3. Tap **Save**. The composer dismisses; the events list refreshes;
   the new event appears.
4. Tap the new event's row. Composer reopens prefilled. Change title
   to "Spot test event (edited)". Tap **Save**. Row updates after
   refresh.
5. Long-press the row. Confirm the destructive prompt. Row
   disappears.
6. Repeat with `allDay = true`. Verify the row renders an
   "All day" badge and that the start time is normalised to
   00:00:00.
7. Pick a read-only calendar (if any are present, e.g., a
   subscribed holiday calendar). Verify Save is disabled with the
   inline notice "This calendar is read-only".

### §3.3 — iOS 17+ write-only mode

1. Open Settings → Privacy & Security → Calendars → spot.
2. Change access to **Write Only**.
3. Return to the EventKit Lab Calendar tab.
4. Authorization card now reads `writeOnly`.
5. **Events query card** is disabled with "Write-only access —
   cannot read events" inline notice.
6. **Event composer** remains active. Create a new event; verify the
   `createEventAsync` call succeeds (no inline error). The events
   list does NOT refresh (because read is denied).
7. Restore Full Access in Settings.

### §3.4 — Reminders tab

1. Switch to **Reminders** tab. Note that the Authorization card is
   independent of the Calendar tab's card.
2. Status reads `notDetermined`. Tap **Request Access**. Approve in
   the system prompt; on iOS 17+ choose **Full Access**.
3. Status transitions to `authorized` (or `fullAccess` on iOS 17+).
4. **Lists** section populates. Tap **Refresh**.
5. **Reminders query card**: default filter is **Incomplete**. Verify
   the list renders matching reminders.
6. Toggle **Completed** then **All**. Verify each call updates the
   list.
7. **Reminder composer**: title = "Spot test reminder", due date =
   tomorrow, list = first writable list, priority = medium.
8. Save. Reminder appears after refresh.
9. Tap the row, edit the title, save. Row updates.
10. Long-press, confirm, row disappears.
11. Create a reminder with NO due date. Verify the row renders
    without a due-date badge (spec §"Edge Cases").

### §3.5 — Permission denial path

1. Settings → Privacy & Security → Calendars → spot → **Don't
   Allow** (or Settings → Reminders → spot → Don't Allow).
2. Reopen the EventKit Lab tab. Authorization card reads `denied`.
3. "Request Access" button is hidden. "Open Settings" link is
   visible.
4. Tap **Open Settings**. The system Settings app opens
   (`Linking.openSettings()`).
5. Re-grant access. Return to the app. Status updates to
   `authorized` after the next mount or focus.

---

## §4 — On-device Android verification

```sh
npx expo run:android
```

1. Open Modules → "EventKit Lab".
2. **Calendar tab**:
   - Authorization card requests Android's runtime calendar
     permissions (READ_CALENDAR / WRITE_CALENDAR).
   - Calendars list populates after grant.
   - Events query card and CRUD work end-to-end via
     `expo-calendar`'s Android implementation.
3. **Reminders tab**:
   - `AndroidRemindersNotice` renders inline ("Reminders are
     limited or unavailable on Android").
   - CRUD controls are disabled.
   - No JavaScript exceptions surface (DevTools console clean).

---

## §5 — Web verification

```sh
npx expo start --web
```

1. Open Modules → "EventKit Lab".
2. `IOSOnlyBanner` renders above the two-tab shell.
3. Both tabs render with all controls disabled.
4. DevTools Console: no errors. No network calls to `expo-calendar`
   (the library is not in the bundle's import closure for
   `screen.web.tsx` — verified statically by
   `screen.web.test.tsx`).
5. Tab switching still works visually (the tab bar is interactive),
   but every disabled control honours
   `accessibilityState={{ disabled: true }}` and the banner carries
   `accessibilityRole="alert"`.

---

## §6 — Pre-merge checklist

- [ ] `pnpm check` green
- [ ] `pnpm format` produces no diff
- [ ] §2 plugin smoke verified (Info.plist keys present, idempotent)
- [ ] §3.1 + §3.2 verified on iOS device (or iOS 17+ simulator with
      Calendar access)
- [ ] §3.3 verified on iOS 17+ (write-only mode)
- [ ] §3.4 verified on iOS device with Reminders access
- [ ] §3.5 verified (denial + Open Settings)
- [ ] §4 verified on Android device (Calendar functional, Reminders
      notice rendered)
- [ ] §5 verified on web (banner, disabled controls, no library
      import)
- [ ] `retrospective.md` written with the final test totals and any
      lessons captured under `docs/memory/` if evidenced and
      reusable
