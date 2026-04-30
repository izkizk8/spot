# Implementation Plan — Feature 044 (HomeKit Lab)

**Branch**: `044-homekit`
**Parent**: `043-healthkit`

## Architecture

```
src/modules/homekit-lab/
├── index.tsx                    # Module manifest
├── characteristic-types.ts      # Kind union, status enum, helpers
├── screen.tsx                   # iOS variant — composes 6 sections
├── screen.android.tsx           # IOSOnlyBanner-only variant
├── screen.web.tsx               # IOSOnlyBanner-only variant
├── hooks/
│   └── useHomeKit.ts            # State machine wrapping the bridge
└── components/
    ├── AuthorizationCard.tsx
    ├── HomesList.tsx
    ├── RoomsList.tsx
    ├── AccessoriesList.tsx
    ├── CharacteristicEditor.tsx
    ├── LiveObserveCard.tsx
    └── IOSOnlyBanner.tsx

src/native/
├── homekit.types.ts             # Cross-platform type surface
├── homekit.ts                   # iOS bridge (requireOptionalNativeModule)
├── homekit.android.ts           # Throws HomeKitNotSupported
└── homekit.web.ts               # Throws HomeKitNotSupported

native/ios/homekit/
├── HomeKitBridge.swift          # Expo Module wrapping HMHomeManager
├── HomeKit.podspec
└── expo-module.config.json

plugins/with-homekit/
├── index.ts                     # NSHomeKitUsageDescription Info.plist
└── package.json
```

## Bridge contract — `src/native/homekit.ts`

```ts
export interface HomeKitBridge {
  isAvailable(): boolean;
  getHomes(): Promise<readonly HomeRecord[]>;
  getAccessories(homeId: string): Promise<readonly AccessoryRecord[]>;
  readCharacteristic(
    accessoryId: string, characteristicId: string,
  ): Promise<CharacteristicValue>;
  writeCharacteristic(
    accessoryId: string, characteristicId: string,
    value: CharacteristicValue,
  ): Promise<void>;
  observeCharacteristic(
    accessoryId: string, characteristicId: string,
    listener: (value: CharacteristicValue) => void,
  ): () => void;
}

export class HomeKitNotSupported extends Error { … }
```

## Hook contract — `useHomeKit`

```ts
interface UseHomeKitReturn {
  available: boolean | null;
  authStatus: HomeKitAuthStatus;
  initialised: boolean;
  lastError: string | null;
  homes: readonly HomeRecord[];
  accessories: readonly AccessoryRecord[];
  selectedHomeId: string | null;
  selectedAccessoryId: string | null;
  selectedCharacteristicId: string | null;
  observerActive: boolean;
  observerUpdateCount: number;
  init(): Promise<void>;
  selectHome(id: string | null): void;
  selectAccessory(id: string | null): void;
  selectCharacteristic(id: string | null): void;
  writeValue(value: CharacteristicValue): Promise<void>;
  readValue(): Promise<void>;
  toggleObserver(): void;
  reset(): void;
}
```

The hook owns lifecycle: `init` is invoked lazily on mount (it
discovers the homes via `HMHomeManager`), refreshes accessories when a
home is selected, and tears the observer down in its cleanup.

## Plugin design — `with-homekit`

Single Info.plist key: `NSHomeKitUsageDescription`. Pure helper
`applyHomeKitUsageString` is exported so unit tests can assert each
mutation row without driving the full mod runner. Re-running on its
own output is byte-stable. Unrelated keys are never touched.

## Test design

| Suite | Coverage |
|-------|----------|
| characteristic-types.test.ts | enum frozen, helpers pure |
| manifest.test.ts | id, platforms, minIOS, render |
| registry.test.ts | exactly one entry, on all 3 platforms |
| screen.test.tsx | iOS — 6 cards rendered |
| screen.android.test.tsx | only IOSOnlyBanner |
| screen.web.test.tsx | only IOSOnlyBanner |
| 7 component suites | structure, callbacks, edge cases |
| useHomeKit.test.tsx | full lifecycle + errors |
| native/homekit.test.ts | bridge contract (mocked) |
| with-homekit/index.test.ts | pure rows, idempotency, coexistence |

Total: 16 new suites.

## Constraints

- Constitution v1.1.0
- Additive only
- No new lint exceptions
- pnpm format before commit
- Mock all native bridges at the import boundary
