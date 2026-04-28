# Quickstart: MapKit Lab Module

End-to-end manual verification, top to bottom. All commands are
PowerShell on Windows; substitute `pnpm` shell as needed.

## 0. Prerequisites

- Worktree at `C:\Users\izkizk8\spot-024-mapkit` on branch
  `024-mapkit`, working tree clean.
- Node 20+, pnpm installed and active.
- For iOS device verification: a custom dev client built with the
  in-tree native module pair (`MapKitSearchBridge`,
  `LookAroundBridge`) — Expo Go cannot exercise the bridges (it
  will throw `MapKitNotSupportedError`, which the panels surface
  inline; map + Annotations + Polyline still work).

## 1. Install dependencies

```powershell
npx expo install react-native-maps expo-location
```

Expected: `package.json` gains the two entries; `pnpm-lock.yaml`
updates; `pnpm install` finishes clean. No other deps change.

## 2. Lint / typecheck / test (the whole quality gate)

```powershell
pnpm format
pnpm check
```

Expected: green. `pnpm check` runs
`format:check && lint && typecheck && test`. The new test files
listed in `plan.md` §Test Strategy are all present and passing.

## 3. iOS — full feature on a custom dev client

1. Build the dev client (`pnpm ios:simulator` or your normal
   sideload flow).
2. Launch; from the modules list tap **MapKit Lab**.
3. Map renders full-bleed. Toolbar shows the 4-segment map-type
   control, the user-location toggle, and the Recenter button.
4. **US1** — tap each segment (Standard / Satellite / Hybrid /
   MutedStandard); the basemap visibly changes. Tap Recenter; on
   `granted` permission, camera moves to the device location;
   otherwise camera moves to the continental-US fallback region.
5. **US6** — open the Permissions card; status shows
   `undetermined`. Tap "Request when-in-use permission"; accept;
   the card flips to `granted` and the toolbar's user-location
   toggle becomes operable.
6. **US2** — open Annotations tab; toggle each of the four preset
   landmarks on; four pins appear. Toggle two off; two remain. Pan
   the map; tap "Add at center"; a new pin appears at the new
   center.
7. **US3** — open Polyline tab; tap "Draw sample loop"; a closed
   loop overlay appears centered on the visible region. Tap Clear;
   it disappears.
8. **US4** — open Search tab; type "coffee" and submit. Result
   list renders non-empty (in a populated region). Tap a result;
   camera animates to that coordinate.
9. **US5** — open LookAround tab. On iOS 16+ over a covered
   location (e.g. central Paris with the Eiffel Tower preset
   toggled), tap "Show LookAround at center"; the LookAround modal
   appears. On iOS < 16 the body shows the "iOS 16+ required"
   notice.

## 4. iOS — Expo Go (degraded but functional)

Open the same screen in Expo Go. Expected:

- Map, toolbar, Annotations, Polyline, and Permissions card all
  work normally.
- Search tab shows the inline error message
  `"searchLocations is not supported on this platform"` after
  hitting Submit.
- LookAround tab shows the inline error after hitting the button
  (or the "iOS 16+ required" notice if the device is < 16).
- The rest of the screen remains fully interactive.

## 5. Android

1. `pnpm android` (or your normal Android dev-client flow).
2. Open MapKit Lab.
3. Map renders via Google Maps under `react-native-maps`. Toolbar,
   Annotations, Polyline, Permissions card all work.
4. Search and LookAround tabs render the `IOSOnlyBanner`.

## 6. Web

1. `pnpm web`.
2. Open MapKit Lab.
3. The map area shows the placeholder
   ("Map view not available on web"). Toolbar and bottom panel
   still render. Search and LookAround tabs render the
   `IOSOnlyBanner`. Recenter, Add-at-center, Draw-sample-loop
   buttons are present but inert (no throw).

## 7. Plugin verification (config plugin idempotency + coexistence)

```powershell
pnpm test test/unit/plugins/with-mapkit/index.test.ts
```

Expected: all 7 cases pass — adds the key, overwrites stale value,
idempotent on re-run, no warnings on baseline, only edits the
documented Info.plist key, `app.json` has 15 plugin entries with
`./plugins/with-mapkit` placed at index 14 (just before the inline
`expo-sensors` array), full mod-chain folds without throwing.

## 8. Final pre-commit hygiene

```powershell
pnpm format          # write
pnpm check           # green
git status           # only the additive files in the diff
```

Diff shape (NFR-002):

- `src/modules/registry.ts` — exactly +2 lines (1 import, 1 entry).
- `app.json` — exactly +1 line.
- `package.json` — +2 entries; `pnpm-lock.yaml` updated.
- All other diffs are **new files** under
  `src/modules/mapkit-lab/`, `src/native/mapkit-search.*`,
  `src/native/lookaround.*`, `native/ios/mapkit/`,
  `plugins/with-mapkit/`, `test/__mocks__/` (4 new files), and
  `test/unit/{modules/mapkit-lab,native,plugins/with-mapkit}/`.

If any other file appears in `git status`, stop and reconcile before
committing.
