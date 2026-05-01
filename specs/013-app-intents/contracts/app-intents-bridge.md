# Contract: `AppIntentsBridge` (the single seam)

The JS bridge at `src/native/app-intents.ts` is the **only** file
in the module that touches the iOS-only `AppIntents` native
symbol. Every screen and every component imports the bridge
through the default export; tests mock the module via
`jest.mock('@/native/app-intents', …)`.

## Module surface

```ts
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type { Mood } from '@/modules/app-intents-lab/mood-store';

/** Thrown by every bridge method (other than isAvailable) on
 *  non-iOS / iOS < 16 / when the native module is absent. */
export class AppIntentsNotSupported extends Error {
  constructor(message?: string) {
    super(message ?? 'AppIntentsNotSupported');
    this.name = 'AppIntentsNotSupported';
  }
}

export interface AppIntentsBridge {
  /** True iff Platform.OS === 'ios', iOS version >= 16, and the
   *  native module resolves. */
  isAvailable(): boolean;

  /** Invoke LogMoodIntent. On non-iOS / iOS<16 / no native:
   *  rejects with AppIntentsNotSupported. */
  logMood(mood: Mood): Promise<{ ok: true; logged: Mood; timestamp: number }>;

  /** Invoke GetLastMoodIntent. Returns mood = null when the
   *  store is empty. */
  getLastMood(): Promise<{ ok: true; mood: Mood | null }>;

  /** Invoke GreetUserIntent. The Swift body is responsible for
   *  the empty-name defence (returns 'Hello, there!' for empty
   *  / whitespace name); the JS UI gates the call by disabling
   *  the Greet button when the trimmed name is empty. */
  greetUser(name: string): Promise<{ ok: true; greeting: string }>;
}

declare const bridge: AppIntentsBridge;
export default bridge;
```

## Per-platform behaviour

### iOS 16+ (with the native module present)

- `isAvailable()` returns `true`.
- `logMood(mood)` calls `native.logMood({ mood })`; on success
  resolves to `{ ok: true, logged, timestamp }`.
- `getLastMood()` calls `native.getLastMood()`; resolves to
  `{ ok: true, mood: <last|null> }`.
- `greetUser(name)` calls `native.greetUser({ name })`; resolves
  to `{ ok: true, greeting }`.
- Native errors are re-thrown as plain `Error` (or wrapped to
  `AppIntentsNotSupported` if the native module rejects with the
  documented `'NOT_SUPPORTED'` code — same pattern as
  `live-activity.ts`).

### iOS < 16, Android, Web

- `isAvailable()` returns `false`.
- `logMood`, `getLastMood`, `greetUser` each reject synchronously
  with a new `AppIntentsNotSupported` (no silent no-op — FR-011).

## Native module shape (Swift side, recorded for the TS mock)

```ts
type NativeAppIntents = {
  logMood(args: { mood: Mood }): Promise<{ logged: Mood; timestamp: number }>;
  getLastMood(): Promise<{ mood: Mood | null }>;
  greetUser(args: { name: string }): Promise<{ greeting: string }>;
};

const native = requireOptionalNativeModule<NativeAppIntents>('AppIntents');
```

## Testability

| Test file | Imports | Mocks |
|---|---|---|
| `test/unit/native/app-intents.test.ts` | `@/native/app-intents` | `react-native`'s `Platform`; `expo-modules-core`'s `requireOptionalNativeModule` to return either `null` (non-iOS) or a recorded mock (iOS) |
| `test/unit/modules/app-intents-lab/screen.test.tsx` | `@/modules/app-intents-lab/screen` | `@/native/app-intents` to a controllable bridge implementation that records calls and resolves / rejects on demand |
| `test/unit/modules/app-intents-lab/screen.{android,web}.test.tsx` | explicit-filename require | `@/native/app-intents` to a no-op bridge whose call methods all throw `AppIntentsNotSupported` (asserts the screen variants never call them) |

## Invariants asserted by tests

### `app-intents.test.ts`

| Setup | Invariant |
|---|---|
| `Platform.OS === 'web'` | `isAvailable() === false`; `logMood('happy')` rejects with `AppIntentsNotSupported`; `getLastMood()` and `greetUser('x')` likewise |
| `Platform.OS === 'android'` | same as web |
| `Platform.OS === 'ios'`, `Platform.Version === 15.5`, native = mock | `isAvailable() === false`; all three methods reject with `AppIntentsNotSupported` |
| `Platform.OS === 'ios'`, `Platform.Version === 16.0`, native = `null` | `isAvailable() === false`; all three methods reject with `AppIntentsNotSupported` |
| `Platform.OS === 'ios'`, `Platform.Version === 16.0`, native = mock | `isAvailable() === true`; each of the three methods invokes the corresponding mock method with the right arguments and resolves to its result |
| Native rejects with `Error('NOT_SUPPORTED')` | bridge re-rejects with `AppIntentsNotSupported` |
| Native rejects with any other error | bridge re-rejects with the original `Error` |

### Cross-cutting

- The bridge module is import-safe on every platform (the import
  has no side effect that throws or mounts a native view).
- `AppIntentsNotSupported` is exported and is `instanceof Error`.
- The default export is a frozen object (no monkey-patching at
  runtime) — tested by attempting a property reassignment and
  asserting it does not take effect (TS strict already enforces
  this at compile time; the runtime assertion is defence in
  depth).
