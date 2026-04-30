# Feature 053 — SwiftData Lab

**Status**: Specified
**Branch**: `053-swiftdata`
**Parent**: `052-core-data-cloudkit`

## Summary

An additive iOS-17+ educational module demonstrating **SwiftData**, the
modern Core Data replacement: the `@Model` macro, `@Query`, `ModelContext`,
and `FetchDescriptor`. The module wraps a single `TaskItem` entity (id,
title, completed, priority enum, dueDate) with a CRUD UI plus filter,
sort, and stats demonstrations.

This is the 48th module in the showcase registry. It mirrors the
established lab-module shape: a manifest, an iOS screen, Android/web
gates, an iOS-only Swift bridge, and JS-pure unit tests with the
native module mocked at the import boundary.

By design, **no Expo config plugin** ships with this feature — local
SwiftData stores require no entitlements; the CloudKit-backed variant
would duplicate 052's plugin and is intentionally out of scope.

## User stories

- **US1** (must) — As a developer studying SwiftData, I open the
  *SwiftData* module on iOS and see the schema availability and
  container info in plain English.
- **US2** (must) — I can create, edit, and delete a `TaskItem` and see
  the list update immediately from the local store.
- **US3** (must) — I can filter the list with a segmented control:
  *All / Active / Completed / Today*.
- **US4** (must) — I can sort the list with a segmented control:
  *Created / Priority / Due date*.
- **US5** (should) — I see a stats card with the count by priority and
  the completion rate.
- **US6** (must) — I see setup instructions describing the `@Model`
  macro and `ModelContainer` setup, plus a note about the optional
  CloudKit sync.
- **US7** (must) — On Android and web the module still loads but
  surfaces a clear "iOS only" banner.

## Functional requirements

- **FR1** — A `swiftdata-lab` `ModuleManifest` registered at the tail
  of `src/modules/registry.ts` with `platforms: ['ios','android','web']`
  and `minIOS: '17.0'`.
- **FR2** — A JS bridge `src/native/swiftdata.ts` resolving the
  `SwiftData` Expo Module via `requireOptionalNativeModule` plus
  matching `swiftdata.android.ts` / `swiftdata.web.ts` stubs. Methods:
  `getSchemaInfo`, `fetchTasks(query)`, `createTask`, `updateTask`,
  `deleteTask`.
- **FR3** — Swift entry point `native/ios/swiftdata/SwiftDataBridge.swift`
  defining the Expo Module surface and a `@Model class TaskItem`
  declaration (educational scaffold; not compiled in CI).
- **FR4** — Module screens: `screen.tsx` (iOS), `screen.android.tsx`,
  `screen.web.tsx` (Android/web both render `IOSOnlyBanner`).
- **FR5** — Components: `CapabilityCard`, `TasksList`, `TaskRow`,
  `TaskEditor`, `FilterPicker`, `SortPicker`, `StatsCard`,
  `SetupInstructions`, `IOSOnlyBanner` (9 components).
- **FR6** — Hook `hooks/useSwiftDataTasks.ts` exposing CRUD state plus
  filter, sort, and derived stats — with
  `__setSwiftDataBridgeForTests` for swap-at-import-boundary testing.
- **FR7** — Type module `task-types.ts` defining `TaskItem`,
  `TaskDraft`, `Priority`, `TaskFilter`, `TaskSort`, plus
  `createDraft`, `isToday`, `computeStats` helpers.
- **FR8** — Pure module `query-builder.ts` exporting
  `buildFetchDescriptor(filter, sort, now)` and
  `applyQuery(tasks, filter, sort, now)` — the JS-side mirror of the
  Swift `FetchDescriptor` predicate / sortBy assembly used by the hook
  to keep the list consistent on the JS side.
- **FR9** — **No** plugin, **no** `app.json` change, **no**
  `with-mapkit` count bump.

## Non-functional requirements

- **NFR1** — Additive only: no existing test, file, or behaviour is
  removed or amended.
- **NFR2** — `pnpm check` (format + lint + typecheck + test) must pass
  green from a clean tree.
- **NFR3** — No `eslint-disable` directives anywhere in the new code.
- **NFR4** — `pnpm format` is run before commit.
- **NFR5** — Native bridges are mocked at the import boundary in
  tests; no SwiftData symbols are imported by the test runner.

## Out of scope

- Compiling or running the Swift bridge.
- CloudKit-backed SwiftData container (would duplicate 052).
- Real `ModelContainer` migration / schema versioning pipeline.
- Persistence across reloads in the JS-side hook (state is in-memory).
