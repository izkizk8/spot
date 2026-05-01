# Contract — `with-eventkit` Expo config plugin

**Feature**: 037-eventkit
**See**: [spec.md](../spec.md) FR-017, FR-018, FR-019, FR-020, SC-008, SC-009
**See**: [research.md](../research.md) §6 (R-F)

Implementation files:

- `plugins/with-eventkit/index.ts` — the `ConfigPlugin`
- `plugins/with-eventkit/index.test.ts` — co-located export-shape
  smoke test
- `plugins/with-eventkit/package.json` — Expo plugin package
  metadata
- `test/unit/plugins/with-eventkit/index.test.ts` — full
  behavioural test (idempotency, defaults, coexistence)

## Constants

```ts
const KEYS = {
  NSCalendarsUsageDescription:
    'This module demonstrates EventKit calendar access for educational purposes.',
  NSCalendarsWriteOnlyAccessUsageDescription:
    'This module may demonstrate write-only calendar event creation on iOS 17+.',
  NSRemindersUsageDescription:
    'This module demonstrates EventKit reminders access for educational purposes.',
  NSRemindersFullAccessUsageDescription:
    'This module demonstrates full reminders access on iOS 17+ for educational purposes.',
} as const;
```

## Invariants (asserted by `test/unit/plugins/with-eventkit/index.test.ts`)

- **P1**. The plugin's default export is a `ConfigPlugin` (function
  taking an Expo config and returning an Expo config).
- **P2**. Running the plugin on an Expo config whose `ios.infoPlist`
  is **missing** any of the four keys (or has them as a non-string
  / empty-string value) sets that key to its default copy from
  `KEYS`.
- **P3**. Running the plugin on an Expo config whose `ios.infoPlist`
  ALREADY has any of the four keys as a non-empty string preserves
  that string byte-identical (no overwrite).
- **P4**. The plugin does NOT touch any other Info.plist key. The
  composition test snapshots the Info.plist before / after and
  asserts the only differences are the four documented keys.
- **P5**. **Idempotency** — running the plugin twice on the same
  Expo config produces a deep-equal config (SC-008). This holds
  whether the defaults are in effect or operator-supplied real
  values are present.
- **P6**. **Coexistence with all 23 prior plugins** (FR-019, SC-009).
  Composing
  `[withScreentime, withCoreML, withVision, withSpeech,
    withAudio, withSignInWithApple, withLocalAuth, withKeychain,
    withMapKit, withCoreLocation, withRichNotifications,
    withLockWidgets, withStandbyWidget, withFocusFilters,
    withBackgroundTasks, withSpotlight, withDocuments, withARKit,
    withBluetooth, withLiveActivity, withAppIntents, withHomeWidgets,
    withPassKit, withEventKit]`
  on an empty Expo config produces a config in which:
    - Each prior plugin's contribution to `ios.entitlements`,
      `ios.infoPlist`, `android.permissions`, and the Xcode project
      (target list, framework list, build phases) is BYTE-IDENTICAL
      to running each plugin alone.
    - The four new usage-description keys are present with default
      copy.
- **P7**. The plugin does NOT touch entitlements, frameworks,
  build phases, target lists, App Groups, `android.permissions`,
  Gradle, the Podfile, or any non-Info.plist surface. The
  composition test asserts this by snapshotting each surface
  before / after.
- **P8**. The plugin's `package.json` declares `main` as `index.ts`
  and has no runtime `dependencies` (config plugins resolve
  `@expo/config-plugins` from the host package; mirroring
  `plugins/with-passkit/package.json`).

## Plugin shape

```ts
// plugins/with-eventkit/index.ts
import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

const KEYS = {
  NSCalendarsUsageDescription:
    'This module demonstrates EventKit calendar access for educational purposes.',
  NSCalendarsWriteOnlyAccessUsageDescription:
    'This module may demonstrate write-only calendar event creation on iOS 17+.',
  NSRemindersUsageDescription:
    'This module demonstrates EventKit reminders access for educational purposes.',
  NSRemindersFullAccessUsageDescription:
    'This module demonstrates full reminders access on iOS 17+ for educational purposes.',
} as const;

const withEventKit: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    for (const key of Object.keys(KEYS) as Array<keyof typeof KEYS>) {
      const existing = cfg.modResults[key];
      if (typeof existing !== 'string' || existing.trim() === '') {
        cfg.modResults[key] = KEYS[key];
      }
    }
    return cfg;
  });

export default withEventKit;
```

## `package.json` shape

```json
{
  "name": "with-eventkit",
  "version": "1.0.0",
  "main": "index.ts",
  "private": true
}
```

(No `dependencies`. Mirrors `plugins/with-passkit/package.json`.)

## App-config edit

```jsonc
// app.json (additive — exactly 1 entry in expo.plugins)
{
  "expo": {
    "plugins": [
      "expo-router",
      // ...prior plugin entries...
      "./plugins/with-passkit",
      "./plugins/with-eventkit"
    ]
  }
}
```

## Documentation requirement (in the source comments)

The plugin source (or its `index.ts` JSDoc block) MUST document:

1. The four default copy strings and their lifecycle (overwritten
   only when absent / empty).
2. How an operator replaces them: edit `app.json`'s
   `ios.infoPlist[<key>]` directly with user-facing copy.
3. That iOS 17+ surfaces the more granular "write-only" /
   "full-access" prompts when the corresponding pair of keys is
   present; iOS < 17 ignores the iOS-17-only keys harmlessly.
4. A pointer to `quickstart.md` §2 (operator override + smoke
   verification).

## Test surface (sketch)

`test/unit/plugins/with-eventkit/index.test.ts` exercises:

- **P2 (defaults)**: empty config → all four keys present with the
  default strings; explicit empty string for any key → replaced;
  non-string existing value → replaced.
- **P3 (preserve)**: pre-populated string for any key → unchanged
  after running the plugin (operator override survives).
- **P4 (no foreign-key writes)**: snapshot the Info.plist dict
  before / after; only the four documented keys differ.
- **P5 (idempotency)**: deep-equal after two runs (snapshot or
  recursive equality on the resolved config).
- **P6 (coexistence)**: compose all 23 prior plugins +
  `with-eventkit`; assert each prior plugin's contribution is
  byte-identical to its solo output; assert the four
  usage-description keys are present with defaults.
- **P7 (no surface bleed)**: snapshot
  `ios.entitlements`, `android.permissions`, frameworks, build
  phases — all byte-identical before / after.
