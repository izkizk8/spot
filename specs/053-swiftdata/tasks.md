# Tasks — 053 SwiftData

Sequential tasks; each ends with `pnpm typecheck` succeeding. Final
gate: `pnpm check`.

## T1. Bridge contract

- Create `src/native/swiftdata.types.ts` with `Priority`, `TaskItem`,
  `TaskDraft`, `TaskFilter`, `TaskSort`, `SchemaInfo`,
  `SwiftDataBridge`, `SwiftDataNotSupported`.
- Create `src/native/swiftdata.ts` with native resolver using
  `requireOptionalNativeModule`, throwing `SwiftDataNotSupported` on
  non-iOS or missing module.
- Create `src/native/swiftdata.android.ts` and
  `src/native/swiftdata.web.ts` rejecting every method.
- Create `native/ios/swiftdata/SwiftDataBridge.swift` declaring the
  `@Model class TaskItem` and matching method names (educational
  scaffold).

## T2. Module types & query-builder

- `src/modules/swiftdata-lab/task-types.ts` — re-exports of
  `TaskItem`, `TaskDraft`, `Priority`, `TaskFilter`, `TaskSort`;
  `EMPTY_TITLE`, `createDraft`, `isToday`, `computeStats`.
- `src/modules/swiftdata-lab/query-builder.ts` —
  `buildFetchDescriptor`, `applyQuery`, `priorityWeight`.

## T3. Manifest & hook

- `src/modules/swiftdata-lab/index.tsx` — `ModuleManifest` with id
  `swiftdata-lab`, lazy `render` of `./screen`, `minIOS: '17.0'`.
- `src/modules/swiftdata-lab/hooks/useSwiftDataTasks.ts` — CRUD,
  filter & sort state, `applyQuery`-derived `visibleTasks`,
  `computeStats`-derived `stats`, observer-less surface,
  `__setSwiftDataBridgeForTests`.

## T4. Components (9)

- `IOSOnlyBanner.tsx`
- `CapabilityCard.tsx`
- `TaskRow.tsx`
- `TasksList.tsx`
- `TaskEditor.tsx`
- `FilterPicker.tsx`
- `SortPicker.tsx`
- `StatsCard.tsx`
- `SetupInstructions.tsx`

## T5. Screens

- `screen.tsx` — composes all 6 sections from the spec.
- `screen.android.tsx` — IOSOnlyBanner.
- `screen.web.tsx` — IOSOnlyBanner.

## T6. Registry

- Append `swiftdataLab` import + entry at the tail of
  `src/modules/registry.ts`.

## T7. Tests (16 files)

- `test/unit/native/swiftdata-bridge.test.ts`
- `test/unit/modules/swiftdata-lab/manifest.test.ts`
- `test/unit/modules/swiftdata-lab/task-types.test.ts`
- `test/unit/modules/swiftdata-lab/query-builder.test.ts`
- `test/unit/modules/swiftdata-lab/useSwiftDataTasks.test.tsx`
- `test/unit/modules/swiftdata-lab/screen.test.tsx`
- `test/unit/modules/swiftdata-lab/screen.android.test.tsx`
- `test/unit/modules/swiftdata-lab/screen.web.test.tsx`
- `test/unit/modules/swiftdata-lab/components/{name}.test.tsx` for
  the 9 components.

## T8. Verify

- `pnpm format`
- `pnpm check`
- Inspect manifest test count; verify zero `eslint-disable`.
- Commit.
