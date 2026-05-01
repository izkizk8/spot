# Feature 052 — Core Data + CloudKit Lab

**Status**: Specified  
**Branch**: `052-core-data-cloudkit`  
**Parent**: `051-tap-to-pay`

## Summary

An additive iOS-only educational module demonstrating
`NSPersistentCloudKitContainer` — a Core Data persistent store mirrored
to CloudKit's private database. The module wraps a single `Note` entity
(id, title, body, createdAt, updatedAt) with a CRUD UI plus
demonstrations of CloudKit account status, sync-state observation,
write-conflict handling (last-write-wins), and lightweight schema
migration.

This is the 47th module in the showcase registry. It mirrors the
established lab-module shape: a manifest, an iOS screen, Android/web
gates, an iOS-only Swift bridge, an Expo config plugin for
entitlements, and JS-pure unit tests with the native module mocked at
the import boundary.

## User stories

- **US1** (must) — As a developer studying CloudKit-backed Core Data,
  I open the *Core Data + CloudKit* module on iOS and see the current
  CloudKit account status surfaced in plain English.
- **US2** (must) — I see a sync-status pill that transitions between
  *Synced / Syncing… / Error / Offline* as the underlying remote
  notifications fire.
- **US3** (must) — I can create, edit, and delete a `Note` and see the
  list update immediately from the local store.
- **US4** (should) — I can press a *Simulate Conflict* button that
  performs two rapid writes against the same record to exhibit
  CloudKit's last-write-wins resolution.
- **US5** (should) — I see the current Core Data model version and a
  short explainer about lightweight migration.
- **US6** (must) — I see the setup instructions: CloudKit container
  identifier, capability checks, and remote-notification entitlements
  required for sync.
- **US7** (must) — On Android and web the module still loads but
  surfaces a clear "iOS only" banner.

## Functional requirements

- **FR1** — A `coredata-cloudkit-lab` `ModuleManifest` registered at
  the tail of `src/modules/registry.ts` with `platforms: ['ios',
  'android', 'web']` and `minIOS: '13.0'`.
- **FR2** — A JS bridge `src/native/coredata-cloudkit.ts` resolving the
  `CoreDataCloudKit` Expo Module via `requireOptionalNativeModule` plus
  matching `coredata-cloudkit.android.ts` / `.web.ts` stubs. Methods:
  `getAccountStatus`, `fetchNotes`, `createNote`, `updateNote`,
  `deleteNote`, `simulateConflict`, `subscribe` (returns an unsubscribe
  function).
- **FR3** — Swift entry point `native/ios/coredata/CoreDataCloudKitBridge.swift`
  defining the Expo Module surface (educational scaffold; not compiled
  in CI).
- **FR4** — Expo config plugin `plugins/with-coredata-cloudkit/`
  injecting (a) the `com.apple.developer.icloud-services` entitlement
  containing `["CloudKit"]`, (b) the
  `com.apple.developer.icloud-container-identifiers` array, (c) the
  `aps-environment` key for push notifications. Idempotent under
  repeated invocation.
- **FR5** — Module screens: `screen.tsx` (iOS), `screen.android.tsx`,
  `screen.web.tsx` (Android/web both render `IOSOnlyBanner`).
- **FR6** — Components: `AccountStatusCard`, `SyncStatusPill`,
  `NotesList`, `NoteRow`, `NoteEditor`, `ConflictDemo`, `MigrationCard`,
  `SetupInstructions`, `IOSOnlyBanner` (9 components).
- **FR7** — Hook `hooks/useNotesStore.ts` exposing the CRUD state
  machine, sync transitions, and observer subscribe/unsubscribe — with
  `__setCoreDataCloudKitBridgeForTests` for swap-at-import-boundary
  testing.
- **FR8** — Type module `note-types.ts` defining `Note`,
  `NoteDraft`, `AccountStatus`, `SyncState`, and a small constructor
  helper `createDraft`.
- **FR9** — `app.json` plugins list bumped from 41 → 42 (append
  `./plugins/with-coredata-cloudkit`). Existing `with-mapkit` test
  bumps its expected count from 41 to 42.

## Non-functional requirements

- **NFR1** — Additive only: no existing test, file, or behaviour is
  removed; only the with-mapkit count assertion is updated.
- **NFR2** — `pnpm check` (format + lint + typecheck + test) must pass
  green from a clean tree.
- **NFR3** — No `eslint-disable` directives anywhere in the new code.
- **NFR4** — `pnpm format` is run before commit.
- **NFR5** — Native bridges are mocked at the import boundary in tests;
  no Core Data / CloudKit symbols are imported by the test runner.

## Out of scope

- Compiling or running the Swift bridge.
- Real iCloud provisioning or signing.
- Bidirectional conflict resolution beyond the documented
  last-write-wins demo.
- A real lightweight-migration pipeline (the migration card explains
  the concept but does not perform a migration).
