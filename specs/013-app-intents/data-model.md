# Phase 1 Data Model: App Intents Showcase

All entities are JS-side. The on-disk persistence layer is a
single AsyncStorage key (`spot.app-intents.moods`) holding a
JSON-serialised array of `MoodRecord`. The in-memory event log is
not persisted. No global stores, contexts, or networking.

## Type aliases

```ts
/** The three mood values shared between the Swift intent enum and the JS UI. */
export type Mood = 'happy' | 'neutral' | 'sad';

/** Bridge availability (the boolean returned by app-intents.isAvailable()). */
export type AppIntentsAvailability = boolean;
```

## Constants (mood-store.ts)

```ts
/** AsyncStorage key holding the JSON array of MoodRecord. */
export const MOOD_STORE_KEY = 'spot.app-intents.moods';

/** Hard cap on the number of records persisted to disk.
 *  Enforced on every `push` — older entries are truncated. */
export const MOOD_STORE_DISK_CAP = 100;

/** Default cap applied to `list()` when no `limit` argument is supplied. */
export const MOOD_STORE_DEFAULT_LIST_CAP = 100;

/** The three Mood values, in canonical order. */
export const MOODS: readonly Mood[] = ['happy', 'neutral', 'sad'] as const;

/** Default selection on first render of the mood picker (FR-020;
 *  planning resolution of NEEDS CLARIFICATION #2 — `neutral`). */
export const DEFAULT_MOOD: Mood = 'neutral';
```

## Constants (event-log.ts)

```ts
/** Capacity of the in-memory event log ring buffer (FR-022). */
export const EVENT_LOG_CAPACITY = 10;
```

## Entities

### `MoodRecord`

A single entry in the shared mood store.

```ts
export interface MoodRecord {
  /** One of the three Mood values. Lowercase, matches Swift enum rawValue. */
  readonly mood: Mood;
  /** Millisecond epoch of the moment the mood was logged. */
  readonly timestamp: number;
}
```

**Validation**:

- `mood` is one of the three documented values; the store rejects
  unknown values with a thrown `Error` from `push` (defence in
  depth — JS callers are typed; Swift-written records are typed
  via `SpotMood`).
- `timestamp` is a finite, non-negative number. The store does
  not enforce monotonicity (clock skew is the caller's
  responsibility).

### `MoodStore` (the module — `mood-store.ts`)

The AsyncStorage-backed store. Pure JS; no React. Shared by the
iOS intent path and the JS UI path.

```ts
/** Append a new record. Truncates oldest entries past MOOD_STORE_DISK_CAP. */
export function push(record: MoodRecord): Promise<void>;

/** Return entries newest-first, capped at `limit`
 *  (default MOOD_STORE_DEFAULT_LIST_CAP). On read failure resolves to []. */
export function list(opts?: { limit?: number }): Promise<readonly MoodRecord[]>;

/** Remove all records. */
export function clear(): Promise<void>;
```

**Invariants** (asserted by `mood-store.test.ts`):

- After `push(r)`, `list({ limit: 1 })` returns `[r]`
  (newest-first ordering).
- For N pushes (N ≤ 100), `list().length === N` and the array is
  in reverse-chronological order.
- For N pushes (N > 100), `list().length === 100` and the
  oldest `N − 100` entries are absent.
- `list({ limit: K })` for `K < length` returns the K most
  recent entries.
- `clear()` followed by `list()` returns `[]`.
- AsyncStorage `getItem` failure: `list()` resolves to `[]`
  (FR-016).
- AsyncStorage `setItem` failure: `push()` rejects with the
  underlying error (FR-016 — surface to caller for UI display).
- The on-disk JSON is exactly `JSON.stringify(records)` where
  `records` is the in-memory array; round-trip via
  `JSON.parse` preserves every field.

### `IntentInvocation`

A single entry in the in-memory event log. Local to the iOS
screen variant.

```ts
export type IntentName =
  | 'LogMoodIntent'
  | 'GetLastMoodIntent'
  | 'GreetUserIntent';

export type IntentStatus = 'success' | 'failure';

export interface IntentInvocation {
  /** Unique id for React keys; can be a monotonic counter. */
  readonly id: string;
  /** Millisecond epoch of when the bridge call started. */
  readonly timestamp: number;
  /** Which intent was invoked. */
  readonly intentName: IntentName;
  /** Parameters passed to the intent (or undefined if none). */
  readonly parameters: Readonly<Record<string, unknown>> | undefined;
  /** The result returned by the intent (string), or the error
   *  message on failure. */
  readonly result: string;
  /** success | failure (drives row colour / icon). */
  readonly status: IntentStatus;
}
```

### `EventLogState` and the reducer (event-log.ts)

```ts
export type EventLogState = readonly IntentInvocation[];
export const EMPTY_LOG: EventLogState = [] as const;

export type EventLogAction =
  | { type: 'append'; invocation: IntentInvocation }
  | { type: 'clear' };

export function eventLogReducer(
  state: EventLogState,
  action: EventLogAction,
): EventLogState;
```

**Invariants** (asserted by `event-log.test.ts`):

- `eventLogReducer(EMPTY_LOG, { type: 'append', invocation })`
  returns `[invocation]`.
- For N successive appends with `N <= EVENT_LOG_CAPACITY`, the
  resulting state has length `N` and is newest-first
  (most recently appended at index 0).
- For N successive appends with `N > EVENT_LOG_CAPACITY`, the
  resulting state has length exactly `EVENT_LOG_CAPACITY`; the
  most recently appended is at index 0; the oldest
  `N − EVENT_LOG_CAPACITY` invocations are absent.
- `eventLogReducer(state, { type: 'clear' })` returns
  `EMPTY_LOG`.
- For an unrecognised action, `eventLogReducer` returns the
  same `state` reference (no copy, identity-stable).

### `ScreenState` (held in `screen.tsx` and variants)

Lives inside `AppIntentsLabScreen` and its platform variants.

| Field | Type | Variant | Notes |
|---|---|---|---|
| `mood` | `Mood` | all | Defaults to `DEFAULT_MOOD` (`'neutral'`) (FR-020). |
| `name` | `string` | all | Greet input value. |
| `lastResult` | `string \| null` | all | Most recent visible result line. |
| `history` | `readonly MoodRecord[]` | all | Refreshed on mount, after every successful Log mood, on AppState foreground (FR-026, FR-033). |
| `log` | `EventLogState` | iOS only | Ring buffer cap 10 (FR-022). |
| `available` | `boolean` | iOS only | Cached `bridge.isAvailable()` value; lets the screen render the gating banner if it reads `false` at mount despite being on the iOS variant. |

**Transitions** (every transition produces a new state slice; the
`history` array is never mutated in place):

```text
init                 → { mood: DEFAULT_MOOD, name: '', lastResult: null,
                         history: <read from store>, log: [],
                         available: bridge.isAvailable() }
mood picker tap      → { …prev, mood: tapped }
name field change    → { …prev, name: typed }
Log mood tap (iOS)   → bridge.logMood(mood)
                       → on success:  refresh history; lastResult = `Logged ${mood} at …`;
                                      log = append { LogMoodIntent, { mood }, success }
                       → on failure:  lastResult = error message;
                                      log = append { LogMoodIntent, { mood }, failure }
Get last mood tap (iOS) → bridge.getLastMood()
                       → on success:  lastResult = result; log = append { GetLastMoodIntent, undefined, success }
                       → on failure:  lastResult = error; log = append { GetLastMoodIntent, undefined, failure }
Greet tap (iOS)      → bridge.greetUser(name.trim())
                       → on success:  lastResult = greeting; log = append { GreetUserIntent, { name }, success }
                       → on failure:  lastResult = error; log = append { GreetUserIntent, { name }, failure }
JS Mood Logger Log tap (fallback)
                     → moodStore.push({ mood, timestamp: Date.now() })
                       → on success:  refresh history
                       → on failure:  lastResult = error message
JS Greet tap (fallback)
                     → lastResult = `Hello, ${name.trim()}!`   // pure JS
AppState → 'active'  → refresh history (FR-033)
unmount              → state discarded; no persistence (FR-022, FR-032)
```

### `AppIntentsBridge` (the seam — see `contracts/app-intents-bridge.md`)

```ts
export class AppIntentsNotSupported extends Error {
  constructor(message?: string) { super(message ?? 'AppIntentsNotSupported'); }
}

export interface AppIntentsBridge {
  isAvailable(): boolean;
  logMood(mood: Mood): Promise<{ ok: true; logged: Mood; timestamp: number }>;
  getLastMood(): Promise<{ ok: true; mood: Mood | null }>;
  greetUser(name: string): Promise<{ ok: true; greeting: string }>;
}

declare const bridge: AppIntentsBridge;
export default bridge;
```

The default export is a single `bridge` instance. Tests mock the
module via `jest.mock('@/native/app-intents', …)` so screen tests
don't have to instantiate `requireOptionalNativeModule`.

### `ModuleManifest` (re-uses `@/modules/types`)

```ts
{
  id: 'app-intents-lab',
  title: 'App Intents Lab',
  description: 'Demo of Apple App Intents on iOS 16+; JS-only mood logger fallback.',
  icon: { ios: 'square.and.arrow.up.on.square', fallback: '🎙️' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <AppIntentsLabScreen />,
}
```

The exact SF Symbol name MAY be revised at implement time if the
chosen one is not available pre-iOS 17; safe alternatives include
`'mic.fill'`, `'wand.and.stars'`, or `'app.badge'`. The fallback
glyph is for the Modules grid card on Android / Web.

## Relationships

```text
AppIntentsLabScreen (one of screen.tsx / .android.tsx / .web.tsx)
│
├── (iOS only) <Header title="App Intents Lab" />
├── (android & web only) <Banner />  "App Intents are iOS 16+ only"
│
├── (iOS only)  Self-test panel
│   ├── <MoodLogger value={mood} onChange={setMood} onLog={onLogMood} />
│   ├── <Button title="Get last mood" onPress={onGetLastMood} />
│   ├── <GreetForm value={name} onChange={setName} onGreet={onGreetUser} />
│   └── <ResultLine text={lastResult} />
│
├── (iOS only)  <IntentEventLog log={log} />
│
├── (all)       <MoodHistory history={history.slice(0, 20)} />
│
├── (android & web only)  JS Mood Logger panel
│   ├── <MoodLogger value={mood} onChange={setMood} onLog={onLogMoodJS} />
│   └── <GreetForm value={name} onChange={setName} onGreet={onGreetUserJS} />
│
└── (iOS only)  <ShortcutsGuideCard onOpenShortcuts={openShortcuts} />
```

## Memory budget

- `MoodRecord` is `{ mood: string, timestamp: number }` ≈ 40 B
  per entry (small string + 8 B number). Capped at 100 on disk
  → ~4 KiB persisted; UI reads at most 20 → ~0.8 KiB retained.
- `IntentInvocation` ≈ 200 B per entry (id, timestamp, name,
  parameters object, result string, status). Capped at 10
  → ~2 KiB retained per screen lifetime.
- The shared `mood-store` reads return immutable `readonly`
  arrays — React reconciliation is cheap (length 20).
- No memory growth with run time.
