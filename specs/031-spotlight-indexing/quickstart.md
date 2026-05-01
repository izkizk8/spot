# Quickstart — CoreSpotlight Indexing Module (031)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying
feature 031 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an
   iOS device. Closes AC-SPL-004..010 and FR-120..124.
2. **On-device verification** — required to close US1 / US2 / US3
   / US4 acceptance scenarios that depend on `CSSearchableIndex`
   and `NSUserActivity` actually running on real iOS hardware.
   Closes AC-SPL-003 and the user-story acceptance scenarios.

Unlike feature 030's quickstart, **there is no lldb step** —
CoreSpotlight is verifiable directly from the iOS home-screen
Spotlight UI by swiping down and typing a search query.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device steps: macOS host with Xcode 16+, an iOS 9+
  device or simulator, and Apple developer signing configured for
  the `com.izkizk8.spot` bundle id (or a fork thereof — see
  spec.md DECISION 2 / R8).

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install
pnpm format       # FR-121 — must produce no diff after the feature commit
pnpm lint         # FR-120 — no eslint-disable directives anywhere in 031
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # AC-SPL-004..009 — all listed test files pass
pnpm check        # FR-122 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta
of **≥ +14 suites** versus 030's closing baseline (see plan.md
§"Test baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ plugins/with-spotlight/ test/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: no matches. (FR-120)

### 1.3 Confirm registry growth is +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts
```

**Expected**: exactly one new `import` line and one new array
entry (`spotlightLab`); no other registry entries reordered or
removed. (AC-SPL-001)

### 1.4 Confirm `app.json` plugins growth is +1

```pwsh
git --no-pager diff main...HEAD -- app.json
```

**Expected**: exactly one new entry `./plugins/with-spotlight`
appended to the `plugins` array; no other plugin entries reordered
or removed. (AC-SPL-002)

### 1.5 Spot-check plugin idempotency + prior-entry preservation (unit test)

The plugin test (`test/unit/plugins/with-spotlight/index.test.ts`)
already covers SC-005 and SC-008. Confirm both assertions exist:

```pwsh
Select-String -Path test/unit/plugins/with-spotlight/index.test.ts `
  -Pattern "byte-identical|priorActivity|toEqual" |
  Select-Object -First 10
```

**Expected**: at least one match for each — the test asserts
byte-identical Info.plist on second run AND that any prior
`NSUserActivityTypes` entry is preserved by the union-merge under
`toEqual` (not `toContain`).

### 1.6 Confirm the bridge has no AsyncStorage import

```pwsh
Select-String -Path src/native/spotlight.ts, src/native/spotlight.types.ts `
  -Pattern 'async-storage|AsyncStorage'
```

**Expected**: no matches. (Feature 031 adds zero new persistence
keys; data-model.md §"Storage layout summary".)

### 1.7 Confirm the web bundle does not pull in the iOS bridge

```pwsh
# Manual smoke: render `screen.web.tsx` in jest-expo's web preset
# and assert it produces no exception. The test
# `screen.web.test.tsx` already does this by mocking
# `src/native/spotlight.ts` to throw on import and asserting the
# render tree never triggers the throw.
pnpm test test/unit/modules/spotlight-lab/screen.web.test.tsx
```

**Expected**: green. (SC-007 / FR-012)

---

## §2 — On-device verification (macOS + iOS 9+ device)

### 2.1 Prebuild + install

```bash
pnpm expo prebuild --platform ios --clean
cd ios && pod install && cd ..
pnpm ios -- --device "<your iPhone>"
```

### 2.2 AC-SPL-003 — Info.plist snapshot

After prebuild completes, inspect the generated `Info.plist`:

```bash
/usr/libexec/PlistBuddy -c "Print :NSUserActivityTypes" ios/spot/Info.plist
```

**Expected**: `NSUserActivityTypes` is a superset containing
`spot.showcase.activity`. If the array contained any prior entries
before 031's plugin ran, those entries MUST still be present in
their original order, with `spot.showcase.activity` appended at
the end.

### 2.3 SC-005 — Idempotency on second prebuild

```bash
cp ios/spot/Info.plist /tmp/info.plist.first
pnpm expo prebuild --platform ios --clean
diff /tmp/info.plist.first ios/spot/Info.plist
```

**Expected**: no diff. (Plugin is byte-identical on re-run.)

### 2.4 US1 AS1 + AS2 — Single-row index + Spotlight-discoverability

1. Launch the app on a real device (simulator works for AS1; real
   device recommended for AS2's home-screen Spotlight verification).
2. Open **Spotlight Indexing** from the modules tab.
3. Pick a row (e.g. **Haptics Playground**) and confirm its badge
   reads `not indexed`.
4. Tap the per-row toggle to **on**.
5. Observe the badge flip to `indexed`.
6. **Swipe down on the iOS home screen** to reveal Spotlight
   Search.
7. Type the row title (e.g. `Haptics Playground`).
8. Within ~5 seconds (system indexing latency; SC-004), the row's
   title appears in Spotlight results with the description and
   keyword set rendered as the result subtitle.

**Expected**: the entry is present in Spotlight results.

9. Return to the screen, tap the same per-row toggle to **off**.
10. Observe the badge flip back to `not indexed`.
11. Re-search Spotlight for the same title.

**Expected**: the entry is absent (within ~5 s of system
re-indexing latency).

### 2.5 US2 AS1 — Bulk index + bulk-search verification

1. With every row currently `not indexed`, tap **Index all** in
   the BulkActionsCard.
2. Observe a pending indicator while the bulk action resolves
   (FR-043). Both bulk CTAs are disabled during this window.
3. After resolution, every row badge reads `indexed`.
4. Swipe down on the iOS home screen and search for `spot
   showcase`.

**Expected**: multiple module rows appear in Spotlight results
(at minimum one per registered module that has a non-empty title /
description / keyword set). The `spot showcase` query matches
because the keyword set on each `SearchableItem` is sourced from
the registry, and the screen's documentation copy uses the same
phrase as a recognisable demo trigger.

### 2.6 US2 AS2 — Bulk remove

1. With every row currently `indexed`, tap **Remove all from index**
   in the BulkActionsCard.
2. Observe the pending indicator. Both bulk CTAs disabled.
3. After resolution, every row badge reads `not indexed`.
4. Re-search Spotlight for `spot showcase`.

**Expected**: zero module rows appear in Spotlight results
(within ~5 s of system re-indexing latency).

### 2.7 US3 — In-app `CSSearchQuery` test

1. Tap **Index all** to seed the system index.
2. In the SearchTestCard, type a known title or keyword (e.g.
   `audio`).
3. Tap **Search Spotlight**.

**Expected**: the results list below the input renders one row per
match, capped at 25 (DECISION 4 / FR-052). Each row shows the
matched item's title and content description.

4. Type a query that matches nothing (e.g. `zzzznonexistent`).
5. Tap **Search Spotlight**.

**Expected**: the explicit empty-state line "No matches in
Spotlight" renders below the input (FR-053).

6. Clear the input.

**Expected**: the **Search Spotlight** CTA becomes disabled
(FR-051 / DECISION 13 / EC-005). The user cannot submit an empty
query.

### 2.8 US4 AS1 + AS2 — `NSUserActivity` mark + verify in Spotlight

1. In the UserActivityCard, confirm the status pill reads
   `inactive`.
2. Tap **Mark this screen as current activity**.
3. Observe the status pill flip to `active`.
4. Swipe down on the iOS home screen and search for `Spotlight
   Indexing` (the screen's title literal per FR-061).

**Expected**: an entry titled `Spotlight Indexing` appears in
Spotlight results, sourced from the active `NSUserActivity` (not
from `CSSearchableIndex` — confirm by tapping **Remove all from
index** first if any items are indexed; the entry should still
appear because `NSUserActivity` is a separate index path).

5. Return to the screen, tap **Clear current activity**.
6. Observe the status pill flip to `inactive`.
7. Re-search Spotlight for `Spotlight Indexing`.

**Expected**: the activity-driven entry is gone.

### 2.9 US4 AS3 + SC-009 — Activity hygiene on screen unmount

1. With status pill `inactive`, tap **Mark this screen as current
   activity**. Status pill flips to `active`.
2. Navigate away from the screen (back to the modules tab).
3. Search Spotlight for `Spotlight Indexing`.

**Expected**: the activity-driven entry is gone immediately after
unmount (within one bridge round-trip). The hook's effect cleanup
(R-C / FR-106) called `clearCurrentActivity()` even though the
user did not tap **Clear**. SC-009 verified.

4. Re-open the Spotlight Indexing screen.

**Expected**: the status pill resets to `inactive` on mount
(DECISION 6 / no auto-restore of activity state across mounts).

### 2.10 EC-006 — System eviction (informational, not blocking)

iOS may evict items from the system index under storage / battery
pressure. This is documented in the PersistenceNoteCard and is not
a bug. To observe:

1. Tap **Index all**.
2. Confirm a few items appear in Spotlight results.
3. Wait several hours / overnight, or trigger memory pressure on
   the device (run multiple memory-hungry apps).
4. Re-search Spotlight without re-indexing.

**Expected**: results may be a strict subset of what was indexed.
The badges still read `indexed` because the JS-side mirror has not
been told to update — this is intentional per DECISION 5. The
recovery path is to tap **Index all** again (DECISION 6).

### 2.11 US5 — Cross-platform fallback (macOS host or any browser)

1. `pnpm web` and open the app in a browser.

**Expected**: Spotlight Indexing card renders the IOSOnlyBanner +
ExplainerCard + PersistenceNoteCard only; no indexing CTAs, no
search input, no activity controls. The browser console shows no
errors caused by importing `src/native/spotlight.ts`. (US5 AS2 /
FR-012 / SC-007)

2. Build for Android (`pnpm android` on a connected Android device
   or emulator).

**Expected**: same set of three components renders; bridge methods
if invoked throw `SpotlightNotSupported`. (US5 AS1 / AS3)

---

## §3 — Spec back-patch checklist (Constitution v1.1.0)

If any on-device discovery in §2 contradicts the spec:

1. Pause T013 (do not sign off).
2. Update `spec.md` with a "Note" or "Clarification" entry
   describing the divergence (Constitution v1.1.0 "Spec
   back-patching").
3. Update `plan.md` §"Resolved [NEEDS CLARIFICATION] markers" if
   the divergence affects R-A..R-E.
4. Re-run §1 (JS-pure verification) to confirm the patched surface
   still passes.
5. Append a "Discoveries" appendix to `retrospective.md` capturing
   what changed and why.
6. Resume T013.

Common categories of divergence to watch for:

- `CSSearchQuery` returning unexpected attribute projections (may
  require updating FR-083's projection list).
- iOS 9–13 simulators rejecting `kUTTypeData` despite the
  `import MobileCoreServices` (R7 — falls back to `UTType.data`
  or string literal `"public.data"`).
- `NSUserActivity` not appearing in Spotlight despite
  `isEligibleForSearch = true` (Apple historically requires the
  activity type to be declared in `Info.plist`'s
  `NSUserActivityTypes` — covered by 031's plugin, but
  occasionally the prebuild output requires a clean install
  before the plist takes effect).

---

## §4 — Sign-off summary

| Step | Closes |
|------|--------|
| §1.1 — pnpm check green | FR-120..124, AC-SPL-010 |
| §1.3 — registry +1 | AC-SPL-001 |
| §1.4 — app.json +1 | AC-SPL-002 |
| §1.6 — no AsyncStorage import | data-model.md §"Storage layout summary" |
| §1.7 — web bundle has no iOS bridge | SC-007, FR-012 |
| §2.2 — Info.plist superset | AC-SPL-003 |
| §2.3 — second prebuild byte-identical | SC-005 |
| §2.4 — single-row index + Spotlight | US1 AS1, AS2 |
| §2.5 — bulk index + Spotlight | US2 AS1, SC-003 |
| §2.6 — bulk remove + Spotlight | US2 AS2 |
| §2.7 — in-app CSSearchQuery | US3 AS1..AS3, EC-005 |
| §2.8 — NSUserActivity mark + verify | US4 AS1, AS2 |
| §2.9 — activity hygiene on unmount | US4 AS3, SC-009, FR-106 |
| §2.10 — system eviction (informational) | EC-006 |
| §2.11 — cross-platform fallback | US5 AS1..AS3, SC-007 |

When every row is checked, mark T013 done in `tasks.md` and
proceed to retrospective + merge.
