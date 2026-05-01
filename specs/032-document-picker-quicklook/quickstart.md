# Quickstart — Document Picker + Quick Look Module (032)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying feature
032 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an iOS
   device. Closes FR-019, FR-020, SC-004, SC-005, SC-006, SC-007.
2. **On-device verification** — required to close US1 / US2 / US3 /
   US4 acceptance scenarios that depend on `QLPreviewController` and
   `expo-document-picker` actually running on real iOS / Android
   hardware. Closes SC-001, SC-002, SC-003.

Unlike feature 030, **there is no lldb step** — `QLPreviewController`
is verifiable directly from the running app by tapping **Preview** on
any row.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device steps: macOS host with Xcode 16+, an iOS 11+ device
  or simulator, and Apple developer signing configured for the
  `com.izkizk8.spot` bundle id (or a fork thereof).
- For Android on-device steps: a configured Android emulator or
  device with the Files app / Google Files installed.

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install
pnpm format       # FR-020 — must produce no diff after the feature commit
pnpm lint         # FR-020 — no eslint-disable directives anywhere in 032
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # SC-004 — all listed test files pass
pnpm check        # FR-020 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta of
**≥ +17 suites** versus 031's closing baseline (see plan.md §"Test
baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ plugins/with-documents/ test/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: no matches. (FR-020)

### 1.3 Confirm registry growth is +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts
```

**Expected**: exactly one new `import` line (`documentsLab`) and one
new array entry; no other registry entries reordered or removed.
(SC-005)

### 1.4 Confirm `app.json` plugins growth is +1

```pwsh
git --no-pager diff main...HEAD -- app.json
```

**Expected**: exactly one new entry `./plugins/with-documents`
appended to the `plugins` array; no other plugin entries reordered or
removed. (SC-005)

### 1.5 Confirm dependency growth is exactly +2

```pwsh
git --no-pager diff main...HEAD -- package.json
```

**Expected**: exactly two new entries in `dependencies` —
`expo-document-picker` and `expo-sharing`. No other dependency
versions move. (FR-018)

```pwsh
git --no-pager diff main...HEAD -- pnpm-lock.yaml |
  Select-String -Pattern '^\+\s+/[a-z0-9-]+@' -CaseSensitive |
  Where-Object { $_ -notmatch 'expo-document-picker|expo-sharing' }
```

**Expected**: every added top-level package entry is a transitive
dependency of `expo-document-picker` or `expo-sharing`; no other
unrelated packages are added.

### 1.6 Plugin idempotency + scope-limit (unit test)

The plugin test (`test/unit/plugins/with-documents/index.test.ts`)
covers SC-003. Confirm both assertions exist:

```pwsh
Select-String -Path test/unit/plugins/with-documents/index.test.ts `
  -Pattern 'idempotent|byte-identical|toEqual|coexist|31 prior' `
  -SimpleMatch
```

**Expected**: matches for at least the words `idempotent`,
`byte-identical`, and references to running the plugin against a
fixture seeded with all 31 prior plugin outputs.

### 1.7 Web bundle does not pull in iOS bridge

```pwsh
node -e "console.log(require.resolve('./src/modules/documents-lab/screen.web'))"
# Then run the project's web bundle smoke test
pnpm test -- screen.web.test
```

**Expected**: `screen.web.test.tsx` asserts via Jest's module
registry that `src/native/quicklook.ts` (the iOS variant) is not in
the import closure of `screen.web.tsx`. Mirrors 030 SC-007 / 031
carryover.

### 1.8 Bundled samples are exactly four, no PDF

```pwsh
Get-ChildItem src/modules/documents-lab/samples/ -File | Measure-Object
Get-ChildItem src/modules/documents-lab/samples/ -File -Filter '*.pdf' | Measure-Object
```

**Expected**: 4 files in samples/, 0 of them PDFs. (FR-005, R-F)

---

## §2 — On-device verification (iOS 11+)

### 2.1 Build & run on a real iOS device

```bash
pnpm install
npx expo prebuild --clean       # plugin runs; verify no errors
npx expo run:ios --device       # signed dev build
```

**Verify in the running app:**

1. Tap the **Documents Lab** card on the iOS Showcase home.
2. Confirm the screen renders five panels in order:
   `PickDocumentsCard` → `BundledSamplesCard` → `TypeFilterControl`
   → `FilesList` → (no `IOSOnlyBanner` / no `QuickLookFallback`).

### 2.2 US1 — Pick a document and preview it (SC-001)

1. Tap **Open documents**.
2. The system picker appears (iCloud Drive + Files app + any
   installed document-provider extensions).
3. Pick any PDF from iCloud Drive.
4. Confirm one new row appears in the Files List with correct name,
   mime type label (`application/pdf`), and a non-zero size.
5. Tap **Preview** on that row.
6. **Verify**: `QLPreviewController` presents modally within ~300 ms.
   The PDF renders with the system Quick Look chrome (page navigator,
   share button, dismiss button). Total time from card-tap to
   visible PDF: **< 10 seconds**. (SC-001)
7. Dismiss the sheet. Verify the screen returns to the Files List
   with no residual UI artifacts.

### 2.3 US2 — Bundled samples render without copy step (SC-002)

For each of the four sample tiles (`hello.txt`, `note.md`,
`data.json`, `icon.png`):

1. Tap the tile in `BundledSamplesCard`.
2. Confirm a new row appears in the Files List.
3. Tap **Preview**.
4. **Verify**: Quick Look renders the sample directly from the bundle
   URI without any "could not load" error and without any visible
   copy step (e.g. no "preparing preview" spinner > 200 ms).
5. Dismiss.

Repeat: tap the same sample twice. Confirm two distinct rows exist
(duplicates allowed; FR-005 acceptance scenario 3).

### 2.4 US3 — Filter drives both list and picker

1. Add three rows: one PNG (sample), one TXT (sample), one PDF
   (picker, from iCloud).
2. Tap **Images** in `TypeFilterControl`.
3. **Verify**: only the PNG row is visible. The TXT and PDF rows are
   hidden (not rendered).
4. Tap **Open documents** with the filter still set to **Images**.
5. **Verify**: the system picker only offers image files; tapping
   any non-image file is impossible.
6. Switch to **Text**. Tap **Open documents**. Verify the picker
   constrains to `text/*` family (text and JSON files are
   selectable; images and PDFs are dimmed).
7. Switch to **PDF** with no PDFs in the list — verify the empty-
   state line "No PDF files in your list" is shown.
8. Switch back to **All** and verify all rows are visible.

### 2.5 Per-row actions

For any row in the Files List:

- **Share** — taps `expo-sharing.shareAsync`; the iOS share sheet
  appears with the file. Cancel to return.
- **Delete from list** — the row disappears from the list. Verify
  by checking iCloud Drive / Files app that the underlying file
  STILL EXISTS (deletion is local-only; FR-009).

### 2.6 Persistence

1. Add a mix of picker and sample rows.
2. Force-quit the app.
3. Re-open the app and navigate back to **Documents Lab**.
4. **Verify**: every row is rehydrated with correct name / mime /
   size / addedAt. Tapping **Preview** on a previously-picked file
   still works as long as the underlying URI resolves.
5. Reinstall the app (delete + reinstall from Xcode).
6. Re-open Documents Lab.
7. **Verify**: the Files List is empty (sample URIs from the previous
   bundle were dropped during rehydration; picker URIs no longer
   resolve in the new sandbox). No error toast appears. (SC-007)

### 2.7 Plugin idempotency on `expo prebuild`

```bash
npx expo prebuild --clean
shasum ios/spot/Info.plist > /tmp/info-plist-1
npx expo prebuild --clean
shasum ios/spot/Info.plist > /tmp/info-plist-2
diff /tmp/info-plist-1 /tmp/info-plist-2
```

**Expected**: empty diff. The two checksums match exactly. (SC-003)

Verify the two managed keys are present and `true`:

```bash
plutil -p ios/spot/Info.plist | grep -E 'LSSupportsOpeningDocumentsInPlace|UIFileSharingEnabled'
```

**Expected**: both lines show `=> 1` (true).

Verify no other prior-plugin keys regressed:

```bash
plutil -p ios/spot/Info.plist | grep -E 'NSUserActivityTypes|BGTaskSchedulerPermittedIdentifiers|UIBackgroundModes|NSCameraUsageDescription|NSMicrophoneUsageDescription'
```

**Expected**: every prior plugin's mutations remain visible (031's
`NSUserActivityTypes`, 030's `BGTaskSchedulerPermittedIdentifiers`,
025's `UIBackgroundModes` containing `'location'`, etc.). (R1
mitigation; SC-003)

---

## §3 — Cross-platform fallback verification (Android / Web)

### 3.1 Android

1. `npx expo run:android` on a configured emulator / device.
2. Tap **Documents Lab**.
3. **Verify**: `IOSOnlyBanner` is visible above the Quick Look
   section explaining the limitation. (FR-017, US4 AS3)
4. Tap **Open documents**. Pick any file.
5. **Verify**: the row appears in the Files List.
6. Tap **Preview**.
7. **Verify**: the app does NOT crash. The `QuickLookFallback` panel
   renders within 100 ms (SC-006). The **Share** action remains
   available.
8. Tap **Share**. Verify the Android share sheet appears.
9. Tap **Delete**. Verify the row is removed.

### 3.2 Web

1. `pnpm web` (or `npx expo start --web`).
2. Open the `Documents Lab` route.
3. **Verify**: `IOSOnlyBanner` is visible. (US4 AS3)
4. Tap **Open documents**. Use the browser's file picker to pick
   any local file.
5. **Verify**: the row appears in the Files List.
6. Tap **Preview**.
7. **Verify**: the app does NOT crash. `QuickLookFallback` renders.
   The `QuickLookNotSupported` error was caught by `FileRow` and
   surfaced inline (US4 AS2).
8. Open DevTools and inspect the network / module graph. Confirm
   that `src/native/quicklook.ts` (the iOS variant) is NOT loaded.
   (SC-007 carryover)

---

## §4 — Sign-off checklist

- [ ] §1.1 — `pnpm check` green; ≥ +17 suites delta vs 031 baseline.
- [ ] §1.2 — Zero `eslint-disable` directives.
- [ ] §1.3 — Registry +1.
- [ ] §1.4 — `app.json` plugins +1.
- [ ] §1.5 — Dependencies +2 (and only +2 top-level).
- [ ] §1.6 — Plugin tests cover idempotency + 31-prior-plugin coexistence.
- [ ] §1.7 — Web bundle does not pull in iOS bridge.
- [ ] §1.8 — Exactly four bundled samples, no PDF.
- [ ] §2.2 — US1 on-device end-to-end < 10 s.
- [ ] §2.3 — All four bundled samples preview without "could not load".
- [ ] §2.4 — Filter drives both list and picker.
- [ ] §2.5 — Share / Delete behave per spec; Delete is local-only.
- [ ] §2.6 — Persistence + reinstall scenarios behave per spec.
- [ ] §2.7 — `expo prebuild` byte-identical on second run; no prior-plugin regression.
- [ ] §3.1 — Android fallback path renders + does not crash.
- [ ] §3.2 — Web fallback path renders + does not crash + no iOS bridge in bundle.

When every box is checked, T016 (the on-device verification task) is
signed off and the feature is ready for `retrospective.md` and merge.
