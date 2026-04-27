# Phase 0 Research: App Intents Showcase

All NEEDS CLARIFICATION items from the spec are closed in
Decision 5. The library / framework decision (the App Intents
bridging surface) is captured in Decision 1 from the live SDK 55
docs. The disjointness probe of feature 007's
`with-live-activity` plugin is captured in Decision 2.
Implementation strategy follows in Decisions 3–8.

## Decision 1: App Intents bridging surface — `expo-modules-core`'s `requireOptionalNativeModule` + a TS Expo config plugin

- **Decision**: There is no `@expo/ui` binding for App Intents,
  and Apple's `AppIntents` framework is import-safe only on
  iOS 16+. The implementation MUST therefore (a) author the four
  Swift files (`LogMoodIntent.swift`, `GetLastMoodIntent.swift`,
  `GreetUserIntent.swift`, `SpotAppShortcuts.swift`) directly
  under `native/ios/app-intents/`, (b) register them with the
  main app target via a TS Expo config plugin
  (`plugins/with-app-intents/`) that uses
  `@expo/config-plugins`'s `withXcodeProject` mod to add each
  `.swift` file to the main target's `PBXSourcesBuildPhase`, and
  (c) expose a JS-side bridge at `src/native/app-intents.ts`
  that resolves the iOS-only symbol with
  `requireOptionalNativeModule<T>('AppIntents')` — the same
  pattern feature 007's `src/native/live-activity.ts` uses for
  `requireOptionalNativeModule<T>('LiveActivityDemo')`.
- **Verification**: Inspected `src/native/live-activity.ts`
  (this branch, lines 27–34) — confirms `requireOptionalNativeModule`
  is the project-canonical resolver for iOS-only Expo modules and
  resolves to `null` on Android / Web / iOS without the prebuild,
  so the bridge file is import-safe everywhere. Inspected
  `plugins/with-live-activity/add-widget-extension.ts` — confirms
  `withXcodeProject` from `@expo/config-plugins` is the
  project-canonical mod for adding source files to a target's
  compile sources. No additional npm dependency is required for
  either side.
- **Rationale**: The bridge pattern matches feature 007 exactly,
  so reviewers reading the new bridge can pattern-match against
  the existing one; the TS plugin pattern matches feature 007 as
  well, with the simplification that this feature does not need a
  new Xcode target (intents are added to the main app target,
  not to a Widget Extension), which avoids touching every
  Xcode-project region `with-live-activity` writes to (see
  Decision 2). Apple's docs for App Intents explicitly state that
  intents declared in the main app target are automatically
  surfaced to Siri / Shortcuts / Spotlight without per-target
  Info.plist additions; an `AppShortcutsProvider` declared at
  module scope is the only registration surface required.
- **Alternatives considered**:
  - Use `@expo/ui` to model the intents — rejected: `@expo/ui` is
    a SwiftUI bindings package and exposes no App Intents
    primitives.
  - Add a separate Xcode target (e.g. an `AppIntentsExtension`)
    — rejected: App Intents declared in the main app target are
    sufficient for Siri / Shortcuts / Spotlight per Apple docs;
    a separate target would inflate plugin complexity and
    increase the surface area that could collide with feature 007.
  - Skip the TS bridge and have the screen call native methods
    via `requireNativeModule` directly — rejected: that would
    push the iOS-version gating into every call site and
    duplicate the platform-checking that the bridge encapsulates
    in one place (FR-010 / FR-011).

### Swift body sketch (recorded so the implement phase doesn't have to derive it)

```swift
// LogMoodIntent.swift
import AppIntents
import Foundation

@available(iOS 16.0, *)
enum SpotMood: String, AppEnum {
  case happy, neutral, sad
  static var typeDisplayRepresentation: TypeDisplayRepresentation { "Mood" }
  static var caseDisplayRepresentations: [SpotMood: DisplayRepresentation] = [
    .happy: "Happy", .neutral: "Neutral", .sad: "Sad",
  ]
}

@available(iOS 16.0, *)
struct LogMoodIntent: AppIntent {
  static var title: LocalizedStringResource = "Log mood"
  static var description: IntentDescription? = "Logs a mood entry to Spot."

  @Parameter(title: "Mood") var mood: SpotMood

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let ts = Int(Date().timeIntervalSince1970 * 1000)
    try await MoodStoreBridge.push(mood: mood.rawValue, timestamp: ts)
    Self.suggestedInvocationPhrase = "Log my mood"  // donation
    return .result(dialog: "Logged \(mood.rawValue) at \(format(ts))")
  }
}
```

The `MoodStoreBridge.push` static helper is a small Swift wrapper
that reads the `spot.app-intents.moods` AsyncStorage key (via the
`@react-native-async-storage/async-storage` iOS native module's
file backing — `RNCAsyncStorage` writes to a single `.manifest`
file under the app's Documents directory which the Swift side can
read with `FileManager`), appends the new record, truncates to
100 entries, and writes back. This keeps both paths writing to
the same on-disk file, so the JS-side `mood-store.ts` reading
through AsyncStorage and the Swift-side intent writing through
`MoodStoreBridge` end up sharing one source of truth (FR-013).

If during the implement phase the AsyncStorage manifest file
proves harder to read from Swift than expected (e.g. the iOS
native module's storage format changes between SDK versions), the
documented fallback is to write to a parallel JSON file at
`Documents/spot-app-intents-moods.json` and have the JS-side
`mood-store.ts` read both files (the parallel file taking
precedence) on `list()` — same on-screen behaviour, slightly
more code. The TS contract for the mood store
(`contracts/mood-store.md`) is unchanged either way.

## Decision 2: `with-app-intents` plugin coexists with `with-live-activity` (disjointness proof)

- **Decision**: The `with-app-intents` Expo config plugin writes
  to a strict subset of the Xcode project regions that
  `with-live-activity` writes to, and to a strictly disjoint set
  of repo paths. Specifically:
  - **Repo paths**: `with-app-intents` reads / adds files under
    `native/ios/app-intents/` (4 Swift files); `with-live-activity`
    reads files under `ios-widget/` at the repo root. Disjoint.
  - **Xcode targets**: `with-app-intents` adds files to the
    **main app target** only (no new target).
    `with-live-activity` creates a new `LiveActivityDemoWidget`
    target, adds files to it, and adds an "Embed App Extensions"
    build phase plus a target dependency from main → widget. The
    `with-app-intents` plugin does not enumerate, modify, remove,
    or re-create the widget target or the embed phase.
  - **Info.plist**: `with-live-activity` sets
    `NSSupportsLiveActivities = true` via `withInfoPlist`.
    `with-app-intents` does NOT modify `Info.plist` at all (App
    Intents declared in the main app target are auto-discovered
    by the system; no plist key is required).
  - **PBX groups**: `with-live-activity` adds a `LiveActivityDemoWidget`
    PBXGroup at the project's main group level. `with-app-intents`
    adds a separate `AppIntents` PBXGroup at the main group level
    (or, idempotently, finds and reuses a same-named group it
    created on a previous run). No overlap.
  - **Order**: order does not matter — both plugins are
    idempotent on first or subsequent runs.
- **Verification**: Inspected
  `plugins/with-live-activity/index.ts`,
  `plugins/with-live-activity/add-widget-extension.ts`, and
  `plugins/with-live-activity/set-info-plist.ts` (this branch).
  Confirmed:
  - `index.ts` composes `withLiveActivityInfoPlist` then
    `withLiveActivityWidgetExtension`. No reference to App
    Intents, no reference to the main app target's compile
    sources beyond the `SHARED_FILES` it adds for the widget.
  - `add-widget-extension.ts` calls `project.addTarget(...)` with
    `WIDGET_TARGET_NAME = 'LiveActivityDemoWidget'` (a name
    `with-app-intents` will never use) and adds files via
    `project.addFile(...)` with `sourceTree: 'SOURCE_ROOT'` and
    `path` prefixed with `../ios-widget/` (a directory
    `with-app-intents` does not touch). The mod also adds the
    `LiveActivityDemoModule.swift` file to the main app target's
    compile sources — `with-app-intents` adds different files
    (`LogMoodIntent.swift`, `GetLastMoodIntent.swift`,
    `GreetUserIntent.swift`, `SpotAppShortcuts.swift`) under a
    different group.
  - `set-info-plist.ts` only flips `NSSupportsLiveActivities`;
    `with-app-intents` does not call `withInfoPlist`.
- **Rationale**: Direct file inspection is the strongest evidence
  of disjointness short of running both plugins against a fixture
  Xcode project at test time — which is exactly what
  `plugins/with-app-intents/index.test.ts` does (FR-030, SC-011).
  The fixture asserts that running `with-app-intents` over a
  project state pre-populated with what `with-live-activity`
  produces leaves the live-activity target, embed phase, target
  dependency, info-plist key, and `LiveActivityDemoWidget`
  PBXGroup all bit-for-bit identical.
- **Open risk**: If a future revision of `with-live-activity`
  starts adding files to a PBXGroup named `AppIntents` (the
  group `with-app-intents` will reuse), the two plugins would
  conflict. The risk is low (no current plan to do so) and would
  surface in `plugins/with-live-activity/index.test.ts` as a
  failure if either plugin tried to re-enumerate the other's
  artifacts. Documented here so that a future change to either
  plugin re-runs the disjointness probe.

## Decision 3: State shape and update flow

- **Decision**: All on-screen state is `useState` / `useReducer`
  local to the screen (FR-040). The five slices:

  ```ts
  // iOS variant (screen.tsx) — all five slices
  const [mood, setMood] = useState<Mood>('neutral');               // FR-020
  const [name, setName] = useState<string>('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly MoodRecord[]>([]); // FR-025
  const [log, dispatch] = useReducer(eventLogReducer, EMPTY_LOG);  // FR-022, ring buffer cap 10

  // Android / Web variants (screen.android.tsx, screen.web.tsx) —
  // same shape but no `log` (no event log on the fallback),
  // and `lastResult` only tracks the JS-only Greet inline result.
  ```

  The `mood-store` is read on mount (`useEffect(() => { ... }, [])`)
  and after every successful Log mood / JS Mood Logger write to
  refresh `history` (FR-026, FR-033). The screen registers an
  `AppState` change listener so a foreground transition triggers
  a re-read (FR-033) — covers the "Siri / Shortcuts wrote while
  backgrounded" case in the Edge Cases section.
- **Rationale**: Fits FR-040 (no new global stores or contexts).
  The reducer for the event log is the minimum-viable encoding
  of the ring-buffer behaviour and is testable as a pure
  function (`event-log.test.ts`).
- **Alternatives considered**:
  - One `useReducer` for everything — rejected: overengineered;
    five flat slices and no cross-slice invariants.
  - Lift `history` into a context so other future modules can
    subscribe — rejected by FR-040 and Out of Scope (no new
    global state).

## Decision 4: Test strategy

- **Decision**: Jest + `@testing-library/react-native`. Three
  layers of mocking, applied per test (mirroring features 011,
  012, and the bridge pattern from 007):
  1. **`mood-store.test.ts`**: pure JS — mocks
     `@react-native-async-storage/async-storage` to a small
     `Map<string,string>`-backed implementation that can be made
     to throw on `getItem` / `setItem` to cover FR-016. Asserts
     `push` appends, `list({ limit })` returns newest-first up
     to `limit`, `list()` defaults to 100, `clear()` empties,
     storage on disk is exactly the JSON of the array, the cap
     truncates the oldest entries on `push`, read failures
     resolve to `[]`, write failures throw.
  2. **`event-log.test.ts`**: pure reducer — asserts the empty
     state, append-prepend semantics, ring-buffer eviction at
     capacity 10, and that the reducer returns the same
     reference for unrecognised actions.
  3. **`native/app-intents.test.ts`**: bridge contract —
     under `Platform.OS === 'web'` and `'android'`, all four
     methods other than `isAvailable()` throw
     `AppIntentsNotSupported`; under `'ios'` with the mocked
     native module present, calls delegate to it with the right
     argument shapes and return its result; `isAvailable()`
     returns `true` only when iOS 16+ and the mocked module is
     non-null. Uses the same `Platform.OS` / `Platform.Version`
     mocking style established by `live-activity.test.ts`.
  4. **`plugins/with-app-intents/index.test.ts`**: instantiates
     a fixture `expo-config-plugins` config object, runs
     `with-live-activity` over it (to seed the live-activity
     state), then runs `with-app-intents` over the result.
     Asserts the four Swift files are added to the main app
     target's compile sources, the `AppIntents` PBXGroup is
     created, no `Info.plist` key was added, and the
     live-activity target / embed phase / target dependency /
     `NSSupportsLiveActivities` key / `LiveActivityDemoWidget`
     group are all bit-for-bit identical to the seeded state.
     Re-runs `with-app-intents` a second time; asserts the
     project state is bit-for-bit identical to the first run
     (idempotency, FR-030 / SC-011).
  5. **Component tests**: each of `MoodLogger`, `MoodHistory`,
     `IntentEventLog`, `GreetForm`, `ShortcutsGuideCard` gets a
     dedicated test file asserting prop wiring, accessibility
     labels per FR-034 / FR-035 / FR-036, and the per-component
     invariants documented in `data-model.md` and the contracts.
  6. **Screen integration tests**: `screen.test.tsx` mocks
     `@/native/app-intents` to a controllable bridge and asserts
     the iOS variant composes self-test panel + event log +
     Shortcuts card without a banner, that pressing the three
     buttons appends entries to the event log and refreshes the
     Mood History list. `screen.android.test.tsx` and
     `screen.web.test.tsx` use the explicit-filename require
     pattern and assert the banner + JS Mood Logger + Greet
     form + Mood History composition; assert the iOS-only
     IntentEventLog and ShortcutsGuideCard are NOT rendered;
     assert that calling the bridge from the fallback path
     would throw `AppIntentsNotSupported` (the screen variants
     never call the bridge so this is a contract assertion on
     the bridge mock).
  7. **`manifest.test.ts`**: `id === 'app-intents-lab'`,
     `platforms === ['ios','android','web']`, `minIOS === '16.0'`,
     `render` is a function, manifest is included in `MODULES`
     from `@/modules/registry`.
- **Coverage of FR-031** (no iOS-only symbol evaluated at module
  load on non-iOS): enforced statically by
  `requireOptionalNativeModule` (which resolves to `null` on
  Android / Web / iOS without the prebuild) and verified at
  test time by `screen.android.test.tsx` and `screen.web.test.tsx`
  rendering cleanly without any iOS-bridge mock setup; if the
  bridge file's import had any iOS-only side effect, the fallback
  variants would crash on import.
- **No native runtime is invoked.** Jest runs on the Windows
  host. Manual on-device verification of the Swift intents,
  Siri donation, Shortcuts surfacing, and the
  `Linking.openURL('shortcuts://')` path is in `quickstart.md`
  (Constitution Principle V's "manual verification" allowance
  for platform-only behaviour).

## Decision 5: Resolved [NEEDS CLARIFICATION] markers

Three markers in `spec.md` are closed here per the planning
instructions:

1. **Empty-name behaviour for `GreetUserIntent` (FR-008,
   Edge Cases)**: the Greet button is **disabled** whenever the
   name input is empty or whitespace-only
   (`name.trim().length === 0`). No default substitution by the
   JS UI. Identical disable rule on iOS and on the fallback. The
   Swift `GreetUserIntent` body, which the JS UI cannot gate
   when invoked from Siri or Shortcuts, defends itself by
   returning `'Hello, there!'` for any empty / whitespace name
   reaching it from the system. Tests in `GreetForm.test.tsx`
   and `screen.{android,web}.test.tsx` assert the JS-side
   disable rule; the Swift-side defence is documented in
   `quickstart.md` step 3 ("Run Greet from Shortcuts with the
   name field blank — verify the response is 'Hello, there!'").
2. **Default mood selection on first render (FR-020)**:
   **`neutral`**. Encoded as the initial value of the
   `useState<Mood>('neutral')` slice in `screen.tsx`,
   `screen.android.tsx`, and `screen.web.tsx`. Tested by
   `MoodLogger.test.tsx` (default selection assertion) and
   `screen.{*,android,web}.test.tsx` (renders with neutral
   pre-selected).
3. **Mood store hard cap (FR-013, FR-014, FR-015)**: **100
   entries** on disk; `push` truncates oldest entries past 100;
   `list()` without `limit` returns at most 100. Encoded as
   `MOOD_STORE_DISK_CAP = 100` and `MOOD_STORE_DEFAULT_LIST_CAP =
   100` in `mood-store.ts`. Tested by `mood-store.test.ts`
   ("pushing 101 entries leaves length 100, oldest evicted";
   "list() returns at most 100").

## Decision 6: Mood enum and the JS / Swift name agreement

- **Decision**: The mood enum is exactly three lowercase string
  values: `'happy'`, `'neutral'`, `'sad'`. This is the
  representation used in:
  - The JS `Mood` type alias.
  - The on-disk `MoodRecord.mood` field (so a Swift-written
    record can be read by JS and vice versa).
  - The Swift `SpotMood` enum's `rawValue` (lowercase to match
    the JS side; `caseDisplayRepresentations` provides the
    capitalised user-facing labels for Shortcuts / Siri).
- **Rationale**: A single shared serialisation format is the
  minimum-viable contract between the two paths writing to the
  same store. Using lowercase rawValues on the Swift side
  matches the JS side without per-write translation.
- **Alternatives considered**:
  - Capitalised on Swift, lowercase on JS, with translation at
    the bridge — rejected: introduces a translation layer with
    no upside; the user-facing label can be set independently
    via `caseDisplayRepresentations`.

## Decision 7: Shortcuts deep-link URL scheme

- **Decision**: `shortcuts://` (the documented Apple URL scheme
  for the Shortcuts app, available on iOS 13+; on iOS 16+
  it is universally present). The "Open Shortcuts" button
  calls `Linking.openURL('shortcuts://')` and surfaces a
  user-visible error if the call rejects (FR-028). On the
  iOS Simulator without Shortcuts installed, `Linking.openURL`
  rejects synchronously; the error path is exercised by
  `ShortcutsGuideCard.test.tsx`.
- **Rationale**: The only Apple-blessed deep link to the
  Shortcuts app; matches the spec Assumptions ("Apple's
  Shortcuts app exposes a URL scheme reachable via React
  Native's `Linking.openURL` (e.g. `shortcuts://`)").
- **Alternatives considered**:
  - A deep link to a specific intent inside Shortcuts via a
    `shortcuts://run-shortcut?name=...` URL — rejected: the spec
    only requires opening Shortcuts to the app actions list, not
    invoking a specific shortcut from JS.

## Decision 8: Quality gates

- **Decision**: `pnpm check` (defined as `pnpm format:check &&
  pnpm lint && pnpm typecheck && pnpm test`) must pass with no
  warnings introduced (SC-012 / FR-043).
- **Rationale**: Single project-wide gate, no new tooling.
- **Alternatives considered**: a module-scoped gate — rejected;
  the project canonical gate is `pnpm check`.

## Open items

None. The library decision is documented above (matches feature
007's bridge pattern); the disjointness probe of feature 007's
plugin is documented above (direct file inspection); all
NEEDS CLARIFICATION items are closed; all API uncertainties are
pinned to the live SDK 55 docs and to the existing project code.
If implement-phase discovery reveals a behavior contradicting any
decision above (e.g. AsyncStorage's iOS storage format proves
unreadable from Swift), back-patch this file and the spec per the
constitution's spec back-patching workflow before the affected
task is marked done.
