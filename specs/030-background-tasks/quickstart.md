# Quickstart — BackgroundTasks Framework Module (030)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying
feature 030 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an
   iOS device. Closes AC-BGT-004..010 and FR-100..103.
2. **On-device verification** — required to close US1 / US2 / US3
   acceptance scenarios that depend on `BGTaskScheduler` actually
   running on real iOS hardware. Closes AC-BGT-003 and the
   user-story acceptance scenarios.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device steps: macOS host with Xcode 16+, an iOS 13+
  device or simulator, and Apple developer signing configured for
  the `com.izkizk8.spot` bundle id (or a fork thereof — see
  spec.md EC-009).

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install
pnpm format       # FR-101 — must produce no diff after the feature commit
pnpm lint         # FR-100 — no eslint-disable directives anywhere in 030
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # AC-BGT-004..009 — all listed test files pass
pnpm check        # FR-102 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta
of **≥ +13 suites** versus 029's closing baseline (see
plan.md §"Test baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ plugins/with-background-tasks/ test/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: no matches. (FR-100)

### 1.3 Confirm registry growth is +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts
```

**Expected**: exactly one new `import` line and one new array
entry; no other registry entries reordered or removed. (AC-BGT-001)

### 1.4 Confirm `app.json` plugins growth is +1

```pwsh
git --no-pager diff main...HEAD -- app.json
```

**Expected**: exactly one new entry
`./plugins/with-background-tasks` appended to the `plugins` array;
no other plugin entries reordered or removed. (AC-BGT-002)

### 1.5 Spot-check plugin idempotency + 025 coexistence (unit test)

The plugin test (`test/unit/plugins/with-background-tasks/index.test.ts`)
already covers SC-005 and SC-008. Confirm both assertions exist:

```pwsh
Select-String -Path test/unit/plugins/with-background-tasks/index.test.ts `
  -Pattern "byte-identical|location" |
  Select-Object -First 10
```

**Expected**: at least one match for each — the test asserts
byte-identical Info.plist on second run AND that 025's `'location'`
entry is preserved by the union-merge.

---

## §2 — On-device verification (macOS + iOS 13+ device)

### 2.1 Prebuild + install

```bash
pnpm expo prebuild --platform ios --clean
cd ios && pod install && cd ..
pnpm ios -- --device "<your iPhone>"
```

### 2.2 AC-BGT-003 — Info.plist snapshot

After prebuild completes, inspect the generated `Info.plist`:

```bash
/usr/libexec/PlistBuddy -c "Print :BGTaskSchedulerPermittedIdentifiers" ios/spot/Info.plist
/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes"                   ios/spot/Info.plist
```

**Expected**:
- `BGTaskSchedulerPermittedIdentifiers` is a superset containing
  both `com.izkizk8.spot.refresh` and `com.izkizk8.spot.processing`.
- `UIBackgroundModes` contains AT LEAST `fetch` and `processing`,
  AND PRESERVES 025's `location` entry if it was present before
  030's plugin ran.

### 2.3 SC-005 — Idempotency on second prebuild

```bash
cp ios/spot/Info.plist /tmp/info.plist.first
pnpm expo prebuild --platform ios --clean
diff /tmp/info.plist.first ios/spot/Info.plist
```

**Expected**: no diff. (Plugin is byte-identical on re-run.)

### 2.4 US1 AS1 + AS2 — App Refresh happy path

1. Launch the app on a real device (simulator works for AS1 +
   manual-trigger AS2 path; real device required for natural
   iOS-driven launch).
2. Open **Background Tasks** from the modules tab.
3. Tap **Schedule App Refresh**.
4. Observe status pill transition `idle → scheduled`.
5. Trigger the handler manually via lldb (Xcode → Debug → Pause,
   then in the lldb console):

   ```text
   e -l objc -- (void)[[BGTaskScheduler sharedScheduler] _simulateLaunchForTaskWithIdentifier:@"com.izkizk8.spot.refresh"]
   ```

6. Resume execution.
7. Within a few seconds, observe:
   - status pill transitions `scheduled → running → completed`,
   - "Last refresh" timestamp + duration update on the schedule
     card,
   - a new row appears at the top of **Run History** with
     `type: refresh`, non-null `startedAt` / `endedAt`, positive
     `durationMs`, and status `completed`,
   - (best-effort) a local notification posts; if undelivered,
     the run still records cleanly (EC-008).

### 2.5 US1 AS3 — Expiration handling

Repeat 2.4 but, after triggering via lldb, immediately background
the app long enough for the simulated workload (~2 s) to be
expired by iOS. Reopen:

**Expected**: a Run History row with `type: refresh`, status
`expired`, `endedAt` ≈ expiration time, and `durationMs`
reflecting the truncated runtime.

### 2.6 US2 AS1 + AS2 — Processing happy path

Repeat 2.4 with **Schedule Processing** + the lldb command using
`com.izkizk8.spot.processing`. Verify the read-only requirements
indicators are visible (FR-032), the workload runs ~5 s, and the
Run History row carries `type: processing`.

### 2.7 US2 AS — Requirements gating (real-device only)

On battery + airplane mode:

1. Tap **Schedule Processing** (no lldb trigger).
2. Wait at least 15 minutes.

**Expected**: iOS does NOT launch the handler; status pill stays
`scheduled`. (Demonstrates `requiresExternalPower=true` +
`requiresNetworkConnectivity=true` gating.)

Plug the device in and re-enable network:

3. Wait up to ~30 minutes (iOS coalesces; your mileage will vary).

**Expected**: the handler eventually runs; a `type: processing`
row appears in Run History. (If iOS never launches it within 30
minutes — common — fall back to the lldb path to verify the code
path; document the natural-launch attempt in the retrospective.)

### 2.8 US3 — Persistence across relaunches

1. With ≥ 1 row in Run History, force-quit the app from the app
   switcher.
2. Reopen the app and navigate to **Background Tasks**.

**Expected**: prior history rows render in correct order
(newest first), preserving timestamps + durations + statuses.
(US3 AS1)

3. Run enough handlers (via lldb) to push the list above 20.

**Expected**: the oldest row is dropped; list length stays at 20.
(US3 AS2 / FR-041)

4. Tap **Clear history** → confirm.

**Expected**: list empties, the empty-state line "No background
runs recorded yet" renders. (US3 AS4 / FR-043)

### 2.9 US4 — Cross-platform fallback (macOS host or any browser)

1. `pnpm web` and open the app in a browser.

**Expected**: Background Tasks card renders the IOSOnlyBanner +
ExplainerCard + TestTriggerCard only; no schedule CTAs. The
browser console shows no errors caused by importing
`src/native/background-tasks.ts`. (US4 AS2 / FR-012 / SC-007)

2. Build for Android (`pnpm android` on a connected Android
   device or emulator).

**Expected**: same set of three components renders; bridge
methods if invoked throw `BackgroundTasksNotSupported`. (US4
AS1 / AS3)

---

## §3 — Spec back-patch checklist (Constitution v1.1.0)

If any on-device discovery in §2 contradicts the spec:

1. Pause T013 (do not sign off).
2. Update `spec.md` with a "Note" or "Clarification" entry
   describing the divergence (Constitution v1.1.0 "Spec
   back-patching").
3. Update `plan.md` §"Resolved [NEEDS CLARIFICATION] markers" if
   the divergence affects R-A..R-E.
4. Re-run §1 (JS-pure verification) to confirm the patched
   surface still passes.
5. Append a "Discoveries" appendix to `retrospective.md`
   capturing what changed and why.
6. Resume T013.

---

## §4 — Sign-off summary

| Step | Closes |
|------|--------|
| §1.1 — pnpm check green | FR-100..103, AC-BGT-010 |
| §1.3 — registry +1 | AC-BGT-001 |
| §1.4 — app.json +1 | AC-BGT-002 |
| §2.2 — Info.plist superset | AC-BGT-003 |
| §2.3 — second prebuild byte-identical | SC-005 |
| §2.4 — App Refresh happy path | US1 AS1, AS2 |
| §2.5 — Expiration | US1 AS3, EC-005 |
| §2.6 — Processing happy path | US2 AS1, AS2 |
| §2.7 — Requirements gating | US2 acceptance |
| §2.8 — Persistence across relaunches | US3 AS1, AS2, AS4 |
| §2.9 — Cross-platform fallback | US4 AS1..3, SC-007 |

When every row is checked, mark T013 done in `tasks.md` and
proceed to retrospective + merge.
