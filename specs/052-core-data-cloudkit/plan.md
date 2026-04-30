# Plan — 052 Core Data + CloudKit

## Architecture

```
                ┌──────────────────────────────────────┐
                │       Modules tab → /modules/[id]    │
                └────────────────┬─────────────────────┘
                                 │
              src/modules/coredata-cloudkit-lab/
              ├── index.tsx           — manifest (lazy render)
              ├── screen.tsx          — iOS UI (sections 1–6)
              ├── screen.android.tsx  — IOSOnlyBanner gate
              ├── screen.web.tsx      — IOSOnlyBanner gate
              ├── note-types.ts       — value types + createDraft()
              ├── components/         — 9 UI primitives
              │   ├── AccountStatusCard.tsx
              │   ├── SyncStatusPill.tsx
              │   ├── NotesList.tsx
              │   ├── NoteRow.tsx
              │   ├── NoteEditor.tsx
              │   ├── ConflictDemo.tsx
              │   ├── MigrationCard.tsx
              │   ├── SetupInstructions.tsx
              │   └── IOSOnlyBanner.tsx
              └── hooks/
                  └── useNotesStore.ts — CRUD + sync state + observer

              src/native/
              ├── coredata-cloudkit.ts          — iOS resolver
              ├── coredata-cloudkit.android.ts  — rejects everywhere
              ├── coredata-cloudkit.web.ts      — rejects everywhere
              └── coredata-cloudkit.types.ts    — bridge contract

              native/ios/coredata/
              └── CoreDataCloudKitBridge.swift  — Expo Module scaffold

              plugins/with-coredata-cloudkit/
              ├── index.ts            — three idempotent plist mods
              └── package.json
```

## Bridge contract (TypeScript)

```ts
type AccountStatus =
  | 'available' | 'noAccount' | 'restricted'
  | 'couldNotDetermine' | 'temporarilyUnavailable';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

interface CoreDataCloudKitBridge {
  getAccountStatus(): Promise<AccountStatus>;
  fetchNotes(): Promise<readonly Note[]>;
  createNote(draft: NoteDraft): Promise<Note>;
  updateNote(id: string, patch: Partial<NoteDraft>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  simulateConflict(id: string): Promise<Note>;
  subscribe(listener: (state: SyncState) => void): () => void;
}
```

## Hook state machine

```
                ┌────────┐
   create/update│        │  observer:'syncing'
   delete →     │ idle   │ ───────────────┐
   syncing      │        │                ▼
                └────────┘            ┌──────────┐
                     ▲                │ syncing  │
            success  │                └─────┬────┘
                     │                      │
                     │              success │   error
                     │                      │
                     │            ┌─────────┴─────────┐
                     │            ▼                   ▼
                     │      ┌────────┐         ┌──────────┐
                     └──────┤ synced │         │  error   │
                            └────────┘         └──────────┘
```

`offline` is reported by the observer when the iOS reachability layer
fires; the hook records it without aborting in-flight CRUD.

## Plugin behavior

1. Insert/merge `com.apple.developer.icloud-services` → `['CloudKit']`.
2. Insert/merge `com.apple.developer.icloud-container-identifiers` →
   `['iCloud.<bundleId>']` (computed from
   `config.ios.bundleIdentifier`).
3. Insert/merge `aps-environment` → `'development'`.

Each step preserves operator-supplied values. Pure helpers exposed for
unit tests:

```
applyICloudServices(entitlements) → entitlements
applyICloudContainers(entitlements, bundleId) → entitlements
applyApsEnvironment(entitlements) → entitlements
```

## Test inventory

| Test file | Cases (≈) |
|-----------|-----------|
| `test/unit/native/coredata-cloudkit-bridge.test.ts` | web stub for every method rejects; android stub equivalent; type-name export |
| `test/unit/plugins/with-coredata-cloudkit/index.test.ts` | per-helper idempotency, preservation, mod-chain |
| `test/unit/plugins/with-mapkit/index.test.ts` | bump expected `plugins.length` 41→42 |
| `test/unit/modules/coredata-cloudkit-lab/manifest.test.ts` | id / title / description / platforms / minIOS / render |
| `test/unit/modules/coredata-cloudkit-lab/note-types.test.ts` | `createDraft` defaults; type guards |
| `test/unit/modules/coredata-cloudkit-lab/useNotesStore.test.tsx` | CRUD, sync transitions, subscribe/unsubscribe, error paths |
| `test/unit/modules/coredata-cloudkit-lab/screen.test.tsx` | iOS screen renders shell |
| `test/unit/modules/coredata-cloudkit-lab/screen.android.test.tsx` | Android shows IOSOnlyBanner |
| `test/unit/modules/coredata-cloudkit-lab/screen.web.test.tsx` | Web shows IOSOnlyBanner |
| `test/unit/modules/coredata-cloudkit-lab/components/*.test.tsx` (9 files) | each renders with sane defaults |

## Risks & mitigations

- **R1** — Tightly coupled state in `useNotesStore`. *Mitigation:*
  bridge is mocked at import boundary; hook owns no globals other than
  the swap-in test bridge.
- **R2** — Ordering of registry imports. *Mitigation:* append-only at
  the tail; manifest test and registry tests catch drift.
- **R3** — Plugin field collisions with prior modules. *Mitigation:*
  every helper merges and preserves operator values.
