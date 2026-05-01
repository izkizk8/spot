---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (SwiftData `@Model` macro requires native iOS build)
  - iPhone running iOS 17+
  - Apple Developer account (free tier sufficient)
---

# How to verify SwiftData on iPhone

## Goal
Confirm `ModelContainer` initialises successfully, `@Model` objects are persisted
across app restarts, queries with `#Predicate` and `SortDescriptor` return correct
results, and CloudKit sync (if configured) propagates changes to a second device.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 17+
- `with-swiftdata` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"SwiftData"** in the Modules tab.
5. Confirm the ModelContainer Status chip shows **"Initialised"**.
6. Tap **Add Item** → enter title "SwiftData Test" → **Save**.
7. Confirm the row appears in the list.
8. Force-quit the app; relaunch → navigate to **"SwiftData"** →
   confirm the row is still present (persistence verified).
9. Tap **Filter** → enter "swift" → confirm results are filtered by the predicate.
10. Tap **Sort** → toggle ascending/descending → confirm row order changes.
11. Tap **Delete** → confirm row removed and persists as deleted after relaunch.

## Verify
- ModelContainer initialises without error
- Saved item persists across app restarts
- Predicate filter returns correct subset of records
- Sort order changes correctly
- Deleted item remains absent after relaunch
- On iOS < 17: in-app banner "SwiftData requires iOS 17+"; module grayed out

## Troubleshooting
- **ModelContainer fails with "migration required"** → if the `@Model` schema changed
  since the last build, add a `MigrationPlan` or delete the app to reset the store
- **Items not persisting** → confirm `modelContext.save()` is called; SwiftData
  auto-saves but explicit saves are safer during rapid writes
- **CloudKit sync not working** → configure `ModelConfiguration` with
  `cloudKitDatabase: .automatic` and ensure iCloud + paid developer account are set up

## Implementation references
- Spec: `specs/053-swiftdata/spec.md`
- Plan: `specs/053-swiftdata/plan.md`
- Module: `src/modules/swiftdata-lab/`
- Native bridge: `src/native/swiftdata.ts`
- Plugin: `plugins/with-swiftdata/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows