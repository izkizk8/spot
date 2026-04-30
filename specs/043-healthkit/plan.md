# Implementation Plan — Feature 043 (HealthKit Lab)

**Branch**: `043-healthkit`
**Parent**: `042-app-clips`

## Architecture

```
src/modules/healthkit-lab/
├── index.tsx                    # Module manifest
├── sample-types.ts              # Permission sets, sleep stage enum, helpers
├── screen.tsx                   # iOS variant — composes 6 sections
├── screen.android.tsx           # IOSOnlyBanner-only variant
├── screen.web.tsx               # IOSOnlyBanner-only variant
├── hooks/
│   └── useHealthKit.ts          # State machine wrapping react-native-health
└── components/
    ├── AuthorizationCard.tsx
    ├── StepCountCard.tsx
    ├── HeartRateCard.tsx
    ├── SleepCard.tsx
    ├── WorkoutCard.tsx
    ├── LiveUpdatesCard.tsx
    └── IOSOnlyBanner.tsx

plugins/with-healthkit/
├── index.ts                     # Info.plist + entitlement mods (wrapper)
└── package.json
```

## Hook contract — `useHealthKit`

```ts
interface UseHealthKitReturn {
  available: boolean | null;
  authStatusByType: Readonly<Record<HealthSampleId, AuthStatus>>;
  initialised: boolean;
  lastError: string | null;
  steps7d: readonly DailyStep[];
  heartRate24h: readonly HeartRateSample[];
  latestHeartRate: HeartRateSample | null;
  sleepLastNight: readonly SleepSegment[];
  workouts: readonly WorkoutSummary[];
  weight: WeightSample | null;
  observerActive: boolean;
  observerUpdateCount: number;
  init(): Promise<void>;
  refreshAll(): Promise<void>;
  writeManualHeartRate(bpm: number): Promise<void>;
  writeWeight(kg: number): Promise<void>;
  toggleObserver(): void;
  reset(): void;
}
```

The hook owns lifecycle: it invokes `init` lazily on mount, fans out
all queries via `Promise.allSettled`, and tears down the observer in
its cleanup function.

## Plugin design — `with-healthkit`

`plugins/with-healthkit/index.ts` wraps `withInfoPlist` and
`withEntitlementsPlist` on top of the parent target:

| Key | File | Behaviour |
|-----|------|-----------|
| `NSHealthShareUsageDescription` | Info.plist | Set if absent, replace if not a string, preserve otherwise |
| `NSHealthUpdateUsageDescription` | Info.plist | Same policy |
| `com.apple.developer.healthkit` | Entitlements | Boolean true, byte-stable on rerun |

Pure helpers `applyHealthKitUsageStrings` and
`applyHealthKitEntitlement` are exported for unit testing without the
mod runner.

## Test strategy

| Test | Scope | Env |
|------|-------|-----|
| `manifest.test.ts` | Manifest invariants | node |
| `registry.test.ts` | Registry includes healthkit-lab once with expected platforms | node |
| `sample-types.test.ts` | Permission sets shape, sleep helpers, frozen | node |
| `screen.test.tsx` | iOS screen composes 6 sections | jsdom |
| `screen.android.test.tsx` | Android variant — IOSOnlyBanner only | jsdom |
| `screen.web.test.tsx` | Web variant — IOSOnlyBanner only | jsdom |
| `hooks/useHealthKit.test.tsx` | Auth flow, queries, writes, observer subscribe / unsubscribe, error paths, unmount cleanup | jsdom |
| `components/*.test.tsx` (7) | One per component | jsdom |
| `plugins/with-healthkit/index.test.ts` | Pure mutations + idempotency + coexistence + plugin chain | node |
| `plugins/with-mapkit/index.test.ts` | Bumped plugin count 33 → 34 | node |

## Risks

- **`react-native-health` callback API**: handled by promise-wrap
  helpers inside the hook. Tests mock the module flat at the import
  boundary, so the production callback shape is observed only by code
  that we control.
- **Plugin coexistence**: covered by the dedicated coexistence test
  composing `with-healthkit` after `with-keychain-services`,
  `with-sign-in-with-apple`, and `with-app-clips`, then re-running to
  prove idempotency under composition.
