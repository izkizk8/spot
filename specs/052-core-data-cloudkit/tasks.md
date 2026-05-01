# Tasks — 052 Core Data + CloudKit

Sequential tasks; each ends with `pnpm typecheck` succeeding. Final
gate: `pnpm check`.

## T1. Bridge contract

- Create `src/native/coredata-cloudkit.types.ts` with `AccountStatus`,
  `SyncState`, `Note`, `NoteDraft`, `CoreDataCloudKitBridge` and
  `CoreDataCloudKitNotSupported`.
- Create `src/native/coredata-cloudkit.ts` with native resolver using
  `requireOptionalNativeModule`, throwing `CoreDataCloudKitNotSupported`
  on non-iOS or missing module.
- Create `src/native/coredata-cloudkit.android.ts` and
  `src/native/coredata-cloudkit.web.ts` rejecting every method.
- Create `native/ios/coredata/CoreDataCloudKitBridge.swift`
  (educational scaffold) declaring the matching method names.

## T2. Module manifest, types, hook

- `src/modules/coredata-cloudkit-lab/note-types.ts` — `Note`,
  `NoteDraft`, `createDraft(partial?)`.
- `src/modules/coredata-cloudkit-lab/index.tsx` — `ModuleManifest`
  with id `coredata-cloudkit-lab`, lazy `render` of `./screen`.
- `src/modules/coredata-cloudkit-lab/hooks/useNotesStore.ts` — CRUD,
  sync state, observer subscription, `__setCoreDataCloudKitBridgeForTests`.

## T3. Components (9)

- `IOSOnlyBanner.tsx`
- `AccountStatusCard.tsx`
- `SyncStatusPill.tsx`
- `NoteRow.tsx`
- `NotesList.tsx`
- `NoteEditor.tsx`
- `ConflictDemo.tsx`
- `MigrationCard.tsx`
- `SetupInstructions.tsx`

## T4. Screens

- `screen.tsx` — composes all 6 sections from the spec.
- `screen.android.tsx` — IOSOnlyBanner.
- `screen.web.tsx` — IOSOnlyBanner.

## T5. Registry

- Append `coredataCloudKitLab` import + entry at the tail of
  `src/modules/registry.ts`.

## T6. Plugin

- `plugins/with-coredata-cloudkit/index.ts` — `applyICloudServices`,
  `applyICloudContainers`, `applyApsEnvironment`, default `ConfigPlugin`
  composing the three.
- `plugins/with-coredata-cloudkit/package.json`.
- Append `./plugins/with-coredata-cloudkit` to `app.json` plugins
  (count 41 → 42).

## T7. Tests

- `test/unit/native/coredata-cloudkit-bridge.test.ts`
- `test/unit/plugins/with-coredata-cloudkit/index.test.ts`
- Update `test/unit/plugins/with-mapkit/index.test.ts` count assertion
  41 → 42.
- `test/unit/modules/coredata-cloudkit-lab/manifest.test.ts`
- `test/unit/modules/coredata-cloudkit-lab/note-types.test.ts`
- `test/unit/modules/coredata-cloudkit-lab/useNotesStore.test.tsx`
- `test/unit/modules/coredata-cloudkit-lab/screen.test.tsx`
- `test/unit/modules/coredata-cloudkit-lab/screen.android.test.tsx`
- `test/unit/modules/coredata-cloudkit-lab/screen.web.test.tsx`
- `test/unit/modules/coredata-cloudkit-lab/components/{name}.test.tsx`
  for the 9 components.

## T8. Verify

- `pnpm format`
- `pnpm check`
- Inspect manifest test count; verify zero `eslint-disable`.
- Commit.
