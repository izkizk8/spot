# Feature Specification: NSUserActivity / Handoff / Continuity Module

**Feature Branch**: `040-handoff-continuity`
**Feature Number**: 040
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 8+ educational module showcasing **NSUserActivity** as the unifying primitive behind three Apple platform features — **Handoff** (continue an in-progress activity on a nearby Apple device signed into the same iCloud account), **state restoration** (restoring the user's last context after a relaunch), and **Spotlight indexing reuse** (the same `NSUserActivity` is what was indexed in feature 031). Adds a "Handoff & Continuity" card to the 006 iOS Showcase registry (`id: 'handoff-lab'`, `platforms: ['ios','android','web']`, `minIOS: '8.0'`). The screen presents an Explainer card, an Activity Composer (form for activity type / title / webpage URL / userInfo / required keys / eligibility toggles + "Become current"), a Current Activity card (shows the live current activity or empty state, with "Resign"), an Incoming Activity Log (last 10 continuation events received from another device), Setup Instructions (how to test across iCloud-signed-in devices), and a Universal Links section that explains the relation to associated domains and explicitly defers Universal Links to a follow-up spec. Native side is a thin Swift bridge `native/ios/handoff/HandoffBridge.swift` wrapping `setCurrent` / `resignCurrent` / `getCurrent`, plus `HandoffActivityHandler.swift` hooked into the AppDelegate `application(_:continue:restorationHandler:)` callback that forwards continuation events to JS. JS bridge `src/native/handoff.ts` exposes `isAvailable`, the lifecycle methods, and a continuation listener; non-iOS platforms throw `HandoffNotSupported`. Config plugin `plugins/with-handoff/` adds the new activity type to `NSUserActivityTypes` by **union-merging** with the array already populated by feature 031's `with-spotlight` plugin (it must NOT overwrite). Branch parent is `039-quick-actions`. Additive only: registry +1 entry, `app.json` `plugins` +1 entry (30 → 31).

---

## Handoff & Continuity Reality Check (READ FIRST)

`NSUserActivity` is one of the most under-explained primitives in Apple's stack. It is simultaneously the API for Handoff, state restoration, Spotlight content indexing, Siri intents donation, and (since iOS 12) shortcut prediction. The following platform invariants shape every design decision in this spec:

1. **Handoff requires four runtime conditions** that the developer cannot fake from inside the app: (a) **both devices are signed into the same iCloud account**, (b) **Bluetooth is on** on both devices and they are within Bluetooth range (~10 m), (c) **Handoff is enabled** in System Settings → General → AirPlay & Handoff (or Handoff in older iOS), and (d) **both devices are awake** (lock screen counts on iOS, Mac must not be fully asleep). The Explainer card and Setup Instructions MUST list all four; failing any one yields a silent no-op rather than a user-visible error.
2. **The activity type string is the contract**. Two devices can only continue an activity if they both register the **same reverse-DNS activity type** in their Info.plist `NSUserActivityTypes` array. The module's default activity type is `com.izkizk8.spot.activity.handoff-demo`. The user can override it in the composer, but if they pick a type that is not in `NSUserActivityTypes` the OS will refuse to broadcast it (no error — it just doesn't appear on the other device).
3. **`NSUserActivityTypes` is a shared resource**. Feature 031 (`with-spotlight`) already populates this array with `'spot.showcase.activity'`. Feature 040's plugin MUST **union-merge** rather than overwrite — running both plugins (in either order) MUST produce an array containing both entries, with no duplicates. The plugin is idempotent: running it twice is a no-op past the first invocation.
4. **Eligibility flags are independent**. `isEligibleForHandoff`, `isEligibleForSearch` (Spotlight), and `isEligibleForPrediction` (Siri suggestions, iOS 12+) are independent booleans. The composer surfaces all three so the educational point — "the same NSUserActivity drives multiple Apple features depending on which flags you flip" — is concrete. `isEligibleForPublicIndexing` is **not** surfaced (out of scope; relevant only for web-search indexing of public content).
5. **Required keys is for Handoff payload contracts**. `requiredUserInfoKeys` is a `Set<String>` declaring which `userInfo` keys are essential for the receiving side to continue the activity. The module auto-populates this from the keys present in the `userInfo` editor, but the user can prune it. If a required key is missing on receipt, the OS may decline to deliver the continuation.
6. **`becomeCurrent` is mutually exclusive**. Only one `NSUserActivity` may be the app's current activity at a time. Calling `setCurrent` with a new activity implicitly resigns the previous one. The Current Activity card reflects this — there is at most one active row.
7. **State restoration requires opt-in**. iOS state restoration is governed by the legacy `UIStateRestoring` protocol on UIKit views/controllers and, in modern apps, by `NSUserActivity` carrying enough `userInfo` to reconstruct the screen. This module **demonstrates** the NSUserActivity-based path conceptually but does NOT actually wire restoration into the app's navigation stack — the educational artifact is the API surface, not a real restoration scenario. The Explainer card calls this out.
8. **Universal Links are related but separate**. From iOS 12+ an `NSUserActivity` with `activityType == NSUserActivityTypeBrowsingWeb` and a `webpageURL` becomes a Universal Link continuation candidate (and the receiving device can open the URL even without the app installed, falling back to Safari). Universal Links also require Associated Domains entitlement and an `apple-app-site-association` file hosted on the developer's domain. Feature 040 explains this relationship but **defers** the actual Universal Links implementation (entitlement, AASA file, route handling) to a future spec.
9. **iOS 8+ availability**. NSUserActivity ships in iOS 8. Handoff specifically was the headline iOS 8 / OS X 10.10 feature. The `minIOS: '8.0'` claim is conservative and accurate. Spotlight integration via `NSUserActivity` arrives in iOS 9; prediction in iOS 12. None of those gates block the iOS 8 baseline because the **flags simply have no effect** on older OS versions — they don't crash.
10. **No runtime permission**. `NSUserActivity` requires no usage description in Info.plist beyond `NSUserActivityTypes` itself. There is no permission prompt and no `*UsageDescription` key.

The four runtime conditions, the activity-type contract, and the union-merge requirement on `NSUserActivityTypes` are repeated in the on-screen Explainer card, in the Setup Instructions card, and in the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open the Handoff & Continuity Lab and read the Explainer (Priority: P1)

A developer studying the spot iOS showcase opens the modules grid, taps the "Handoff & Continuity" card, and lands on the lab screen. The first card on the screen is the **Explainer**, which describes:

- What `NSUserActivity` is (a unifying primitive behind Handoff, state restoration, Spotlight, and prediction).
- The four runtime conditions Handoff requires (same iCloud account on both devices; Bluetooth on and in range; Handoff enabled in Settings; both devices awake).
- The state-restoration use case (an activity carrying enough userInfo to reconstruct the last screen).
- A pointer to feature 031 (Spotlight) for the search-eligibility branch and to the Universal Links section below for the web-link branch.

**Why this priority**: The educational artifact must explain itself before any interaction. P1 because it grounds every other story.

**Independent Test**: Open the Handoff & Continuity Lab screen. Verify the Explainer card text references `NSUserActivity`, lists all four Handoff runtime conditions, and mentions state restoration plus Spotlight reuse.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Handoff & Continuity Lab screen, **When** the screen renders, **Then** the Explainer card is the first child of the scroll container and its body text contains the substrings "NSUserActivity", "Handoff", "iCloud", "Bluetooth", "state restoration", and "Spotlight".
2. **Given** the Explainer card renders, **When** the user reads it on iOS 8-11, **Then** copy clarifies that prediction (`isEligibleForPrediction`) only takes effect on iOS 12+ — older OSes ignore the flag rather than crashing.

---

### User Story 2 — Compose an activity and become current (Priority: P1)

The developer scrolls to the **Activity Composer** card, which is a form with the following fields:

| Field                         | Default                                              | Notes                                                                |
|-------------------------------|------------------------------------------------------|----------------------------------------------------------------------|
| Activity type                 | `com.izkizk8.spot.activity.handoff-demo`             | Reverse-DNS string; must be in `NSUserActivityTypes`.                |
| Title                         | `"Handoff demo activity"`                            | Surfaced on the receiving device's Handoff hint banner / icon badge. |
| Webpage URL                   | `https://example.com/spot/handoff-demo`              | Optional; required for Universal Links continuation.                 |
| userInfo (key/value rows)     | `screen` = `"handoff-lab"`, `note` = `"hello"`       | Free-form; rendered by `KeyValueEditor` component.                   |
| Required keys                 | Auto-populated from userInfo keys, user-pruneable    | `Set<string>`; missing keys block continuation on receipt.           |
| `isEligibleForHandoff`        | `true`                                               | Toggle.                                                              |
| `isEligibleForSearch`         | `false`                                              | Toggle (Spotlight; this is what 031 demonstrates fully).             |
| `isEligibleForPrediction`     | `false`                                              | Toggle (iOS 12+ only; ignored on older OSes).                        |

The user fills in the fields (or leaves defaults), taps **"Become current"**, and the bridge invokes `setCurrent(definition)`. The Current Activity card immediately reflects the new live activity.

**Why this priority**: Composing an activity and making it current is the runtime entry point — without it, no other feature in the lab fires. P1.

**Independent Test**: Open the Activity Composer, accept all defaults, tap "Become current". Verify the Current Activity card now shows the same `activityType`, `title`, `userInfo`, and eligibility flags. Verify `setCurrent` was invoked exactly once with the composed `ActivityDefinition`.

**Acceptance Scenarios**:

1. **Given** the composer renders with default values, **When** the user taps "Become current", **Then** `handoff.setCurrent(definition)` is invoked once with `activityType: 'com.izkizk8.spot.activity.handoff-demo'`, the documented default `userInfo`, `requiredUserInfoKeys: ['screen','note']`, and the documented eligibility defaults.
2. **Given** the user toggles `isEligibleForHandoff = false` before tapping "Become current", **When** the activity becomes current, **Then** the Current Activity card shows the toggle as off and the bridge call carries `isEligibleForHandoff: false`.
3. **Given** the user adds a userInfo row `{ key: 'extra', value: '42' }`, **When** the form re-renders, **Then** the Required keys list auto-includes `'extra'` (user can untick it).
4. **Given** the user supplies an empty activity type or a non-reverse-DNS string, **When** they tap "Become current", **Then** the Save button is disabled and an inline validation error reads "Activity type must be a non-empty reverse-DNS string (e.g., com.example.activity)".
5. **Given** the user supplies a webpage URL that fails URL parsing, **When** they tap "Become current", **Then** the form blocks save with an inline error "Webpage URL must be a valid http(s) URL or empty".

---

### User Story 3 — Inspect the Current Activity and resign it (Priority: P1)

After Story 2, the developer scrolls to the **Current Activity** card. It now shows a single row summarising the live activity: type, title, webpage URL (if any), userInfo (formatted as a JSON block), required keys (as chips), and the three eligibility flags (as labelled toggles, read-only here). A destructive **"Resign"** button at the bottom of the card invokes `resignCurrent()`. After resigning, the card flips to its empty state ("No current activity").

**Why this priority**: Lifecycle observability is core to the educational value. P1.

**Independent Test**: Become current per Story 2 → verify the Current Activity card renders the live activity. Tap Resign → verify `resignCurrent` is called once and the card flips to the empty state. Become current again → verify the card re-populates.

**Acceptance Scenarios**:

1. **Given** an activity has been made current, **When** the Current Activity card renders, **Then** it displays exactly one row with the same `activityType`, `title`, `webpageURL`, formatted `userInfo`, required keys chips, and three eligibility flag rows.
2. **Given** no activity has been made current this session, **When** the screen renders, **Then** the Current Activity card shows an empty state "No current activity".
3. **Given** an activity is current, **When** the user taps "Resign", **Then** `handoff.resignCurrent()` is invoked once, the card flips to the empty state within one render, and the Resign button is hidden until a new activity becomes current.
4. **Given** the user calls "Become current" twice in a row with different definitions, **When** the second call resolves, **Then** the Current Activity card reflects only the second definition (mutual-exclusion per Reality Check #6).

---

### User Story 4 — Receive a continuation event from another device (Priority: P1)

The developer follows the **Setup Instructions** card to ensure their iPhone and another iCloud-signed-in Apple device (iPad or Mac) are properly configured. They run the spot app on Device A, become current with the default activity, then walk to Device B (running the same spot build) where iOS surfaces a Handoff hint on the lock screen / app switcher / Mac Dock. They tap the hint, the spot app launches on Device B, the AppDelegate receives `application(_:continue:restorationHandler:)`, and `HandoffActivityHandler.swift` forwards the event to JS. The JS hook `useHandoffActivity` records the event in the **Incoming Activity Log** card — the user navigates to the lab on Device B and sees a single row at the top of the log listing the activity type, title, userInfo, required keys, and a `receivedAt` ISO timestamp.

**Why this priority**: Receiving the continuation is the headline outcome of the whole module. P1.

**Independent Test (JS-pure)**: With a mocked native bridge, dispatch a synthesised continuation event through the listener. Verify the hook prepends the event to the log array and that the log renders the new row at the top with the documented fields.

**Acceptance Scenarios**:

1. **Given** the lab screen is mounted, **When** the native bridge fires a continuation event with `{ activityType, title, userInfo, requiredUserInfoKeys }`, **Then** the Incoming Log prepends a new row containing those fields plus a `receivedAt` ISO timestamp generated client-side at receipt.
2. **Given** the log is empty, **When** the screen first renders, **Then** the IncomingLog card shows an empty state "No incoming continuations yet — see Setup Instructions to test across devices".
3. **Given** the log already contains 10 entries, **When** an 11th event arrives, **Then** the oldest entry is dropped and the newest entry is prepended (FIFO truncation at exactly 10 entries).
4. **Given** an event arrives with a malformed payload (missing `activityType`), **When** the listener fires, **Then** the hook discards the event without throwing, optionally `console.warn`s in dev only, and the log is unchanged.

---

### User Story 5 — Read the Setup Instructions for cross-device testing (Priority: P2)

The developer scrolls to the **Setup Instructions** card. It contains a numbered list of preconditions and steps the user must satisfy outside the app:

1. Sign both devices into the same iCloud account.
2. Enable **Handoff** in Settings → General → AirPlay & Handoff (iOS 13+) / General → Handoff (older).
3. Turn on Bluetooth on both devices and bring them within ~10 m of each other.
4. Wake both devices (lock-screen counts on iOS).
5. Install the same spot build (matching `NSUserActivityTypes`) on both devices.
6. On Device A, compose and "Become current" with the default activity.
7. On Device B, look for the Handoff hint on the lock screen, app switcher, or Mac Dock.
8. Tap the hint → Device B launches the spot app, navigates to the lab, and the Incoming Log gains a new row.

**Why this priority**: Without this card the headline scenario can't be reproduced by readers without combing Apple's docs. P2 because Stories 1-4 still deliver an MVP.

**Independent Test**: Open the lab screen. Verify the Setup Instructions card renders all 8 numbered steps in order with the documented copy, and is scrollable / readable on iPhone SE (~320 px width).

**Acceptance Scenarios**:

1. **Given** the screen renders, **When** the SetupInstructions component mounts, **Then** it renders 8 ordered list items in the order documented above.
2. **Given** the device width is <360 px, **When** the card lays out, **Then** the list items wrap rather than truncating; no item is clipped.

---

### User Story 6 — Read the Universal Links explainer (Priority: P2)

The developer scrolls to the **Universal Links** card. It explains:

- The relationship: Universal Links are an `NSUserActivity` with `activityType == NSUserActivityTypeBrowsingWeb` and a `webpageURL`, delivered to `application(_:continue:restorationHandler:)` when the user taps a matching link from another app or device.
- The extra requirements: Associated Domains entitlement (`applinks:`), an `apple-app-site-association` file hosted at `https://example.com/.well-known/apple-app-site-association`, and a path-pattern match.
- The deferral: Wiring those bits is out of scope for feature 040 and is **deferred to a follow-up spec**. The card includes a clearly worded "Deferred to follow-up spec" pill and explicitly does not include a runtime test path for Universal Links.

**Why this priority**: Without explicit deferral, readers expect the lab to demonstrate Universal Links end-to-end. P2 to set expectations.

**Independent Test**: Open the lab screen. Verify the Universal Links card renders the relationship copy, the requirements list, and the "Deferred to follow-up spec" pill. Verify there is **no** "Try it" button or interactive runtime call to the Universal Links handler.

**Acceptance Scenarios**:

1. **Given** the lab screen renders, **When** the UniversalLinks section mounts, **Then** it displays the explainer prose, a bulleted list of the three extra requirements (Associated Domains entitlement, AASA file, path patterns), and a visually distinct "Deferred to follow-up spec" pill.
2. **Given** the card renders, **When** the user inspects the card, **Then** there is no actionable button or input — the card is purely documentary.

---

### User Story 7 — Cross-platform graceful degradation (Priority: P3)

A developer running the showcase on Android opens the module and sees an `IOSOnlyBanner` explaining that NSUserActivity / Handoff is iOS-only. The composer, current activity card, and incoming log are replaced with a single iOS-only placeholder (or rendered in disabled state). The same applies on web. The module remains **registered** for `['ios','android','web']` so the card stays visible across platforms. Any accidental call into `src/native/handoff.ts` on Android or web throws `HandoffNotSupported` — the screen MUST NOT make any such call.

**Why this priority**: Cross-platform visibility is required by registry conventions, but the feature is iOS-focused. P3.

**Independent Test**: Render `screen.android.tsx` and `screen.web.tsx` in JS-pure tests. Verify the IOSOnlyBanner is shown, no interactive composer / log / current-activity controls are rendered, and the JS bridge module is not imported at module-evaluation time.

**Acceptance Scenarios**:

1. **Given** the app runs on Android, **When** the user opens the module, **Then** an `IOSOnlyBanner` is shown at the top, the composer / current-activity / incoming-log cards are replaced with an iOS-only placeholder, and no `handoff.*` runtime calls fire.
2. **Given** the app runs on web, **When** the user opens the module, **Then** the same IOSOnlyBanner is shown, no native bridge calls fire, and the bundle does not eagerly evaluate any native-only module path.
3. **Given** any code path on Android or web invokes `setCurrent`, `resignCurrent`, or `getCurrent`, **When** the call is made, **Then** the bridge throws `HandoffNotSupported` with an explanatory message.

---

### Edge Cases

1. **Empty userInfo with required keys**: If the user sets a required key that is not present in userInfo, the composer disables Save with an inline error "Required key 'X' is not in userInfo".
2. **Activity-type collision with feature 031**: The composer accepts any reverse-DNS string. If the user types `'spot.showcase.activity'` (the 031 type), the lab still works — both types are present in `NSUserActivityTypes` because the plugin union-merges. The Current Activity card renders the chosen type verbatim.
3. **`NSUserActivityTypes` missing entirely (defensive)**: The plugin MUST handle the case where prior plugins did not populate `NSUserActivityTypes` at all — initialising it as a fresh array containing only the demo activity type, rather than throwing.
4. **`NSUserActivityTypes` not an array (corrupt prior state)**: If a prior plugin somehow wrote `NSUserActivityTypes` as a non-array value, the with-handoff plugin MUST treat it as if missing (replace with a fresh array containing the demo type) and emit a warning at plugin run time. This is a defensive backstop, not an expected scenario.
5. **Incoming event arrives while the screen is unmounted**: The hook MUST tear down its listener on unmount to avoid setState-on-unmounted warnings; remounting the screen yields a fresh empty log (the log is screen-scoped, not app-scoped).
6. **`getCurrent` race after `setCurrent`**: The Current Activity card derives its state from a hook-managed mirror written synchronously after `setCurrent` resolves; it does NOT poll the native side via `getCurrent`. `getCurrent` is exposed for completeness and for one-off debugging, but the UI does not depend on its real-time value.
7. **Resign while no activity is current**: Tapping Resign in the empty state is impossible because the button is hidden. If `resignCurrent` is called programmatically with no current activity, the bridge no-ops without throwing.
8. **Continuation event with a `requiredUserInfoKeys` Set vs Array**: The native side may surface required keys as either a Set-like or array-like structure; the JS bridge MUST normalise to `string[]` before the hook sees it, so the log row formatting is consistent.
9. **Plugin order with 031**: Running `with-spotlight` then `with-handoff` MUST yield the same `NSUserActivityTypes` contents (in either order) as running `with-handoff` then `with-spotlight`. Both orders are tested in the plugin's coexistence test.
10. **Prediction flag on iOS 8-11**: `isEligibleForPrediction = true` is forwarded to the bridge regardless of OS version. On iOS <12 the OS silently ignores it. The Composer copy notes this; the bridge does NOT pre-filter by OS version (the API is forward-compatible).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register a new module entry `handoffLab` in `src/modules/registry.ts` with `id: 'handoff-lab'`, `platforms: ['ios','android','web']`, and `minIOS: '8.0'`.
- **FR-002**: The system MUST add a config plugin entry `./plugins/with-handoff` to `app.json` `plugins` (taking the count from 30 to 31).
- **FR-003**: The config plugin `plugins/with-handoff/` MUST union-merge the activity type `'com.izkizk8.spot.activity.handoff-demo'` into Info.plist `NSUserActivityTypes` via `withInfoPlist`, preserving every prior entry verbatim and in source order. It MUST NOT overwrite or reorder prior entries.
- **FR-004**: The plugin MUST be idempotent: running it twice on the same Info.plist MUST produce byte-identical output past the first invocation.
- **FR-005**: The plugin MUST coexist with feature 031's `with-spotlight` plugin in either order — running `[with-spotlight, with-handoff]` and `[with-handoff, with-spotlight]` MUST both produce a final `NSUserActivityTypes` array that contains both `'spot.showcase.activity'` and `'com.izkizk8.spot.activity.handoff-demo'` with no duplicates.
- **FR-006**: The plugin MUST defensively handle the case where `NSUserActivityTypes` is missing or non-array, initialising it as a fresh array containing only the demo activity type, without throwing.
- **FR-007**: Native bridge `native/ios/handoff/HandoffBridge.swift` MUST expose `setCurrent(definition)`, `resignCurrent()`, and `getCurrent()` to JS, and `native/ios/handoff/HandoffActivityHandler.swift` MUST hook the AppDelegate `application(_:continue:restorationHandler:)` callback and forward continuation events to JS via the bridge's listener channel.
- **FR-008**: JS bridge `src/native/handoff.ts` MUST export `isAvailable: boolean`, `setCurrent(definition)`, `resignCurrent()`, `getCurrent()`, and a continuation listener (`addContinuationListener(cb)` returning an unsubscribe function). On non-iOS platforms every method MUST throw `HandoffNotSupported` (with an explanatory message), and `isAvailable` MUST be `false`.
- **FR-009**: The Handoff & Continuity Lab screen MUST render the ExplainerCard, ActivityComposer, CurrentActivityCard, IncomingLog, SetupInstructions, and UniversalLinks section in that vertical order on iOS.
- **FR-010**: The ActivityComposer MUST validate (a) `activityType` is a non-empty reverse-DNS string, (b) `webpageURL` is empty or a valid http(s) URL, (c) every entry in `requiredUserInfoKeys` is present as a key in `userInfo`. The Save / "Become current" button MUST be disabled when any validation fails, with inline errors describing each failure.
- **FR-011**: The KeyValueEditor component MUST allow adding, editing, and removing userInfo rows; auto-populate `requiredUserInfoKeys` with each new key (the user MAY untick keys); and reject duplicate keys with an inline error.
- **FR-012**: The "Become current" button MUST invoke `handoff.setCurrent(definition)` exactly once per tap; the hook MUST mirror the latest definition into a `currentActivity` state slice synchronously on resolve so the CurrentActivityCard can render without polling.
- **FR-013**: The "Resign" button on the CurrentActivityCard MUST invoke `handoff.resignCurrent()` exactly once per tap; the hook MUST clear the `currentActivity` state slice on resolve.
- **FR-014**: The `useHandoffActivity` hook MUST subscribe to continuation events on mount via `addContinuationListener`, prepend each event (with a client-generated `receivedAt` ISO timestamp) into a `log` slice, and truncate `log` to the last **10** entries (FIFO drop). On unmount the hook MUST unsubscribe.
- **FR-015**: The hook MUST discard malformed continuation events (missing `activityType`) without throwing, emit a `console.warn` in dev only (`__DEV__ === true`), and leave the log unchanged.
- **FR-016**: The IncomingLog component MUST render up to 10 rows, newest first, each showing `activityType`, `title`, formatted `userInfo`, required-keys chips, and `receivedAt` (ISO 8601, local timezone). When empty it MUST show the empty-state copy from Story 4 AS#2.
- **FR-017**: The SetupInstructions component MUST render exactly the 8 numbered steps documented in Story 5, in the documented order.
- **FR-018**: The UniversalLinks section MUST render the explainer copy, the bulleted requirements list, and the "Deferred to follow-up spec" pill, with no interactive controls.
- **FR-019**: On Android and web, the module MUST render an `IOSOnlyBanner`, MUST NOT invoke any `handoff.*` runtime API, and the screen variant files (`screen.android.tsx`, `screen.web.tsx`) MUST NOT eagerly import the iOS-only bridge at module-evaluation time.
- **FR-020**: All native-bridge access MUST be wrapped behind `useHandoffActivity` and the thin `src/native/handoff.ts` module so tests can mock the bridge at the import boundary.
- **FR-021**: The module MUST contain ZERO `eslint-disable` directives.
- **FR-022**: The module MUST follow project conventions — `ThemedText` / `ThemedView`, `Spacing` scale, single quotes, `StyleSheet.create` only, no inline styles outside trivial flex/layout shims.
- **FR-023**: The change MUST be additive only — the registry gains 1 entry and `app.json` plugins gains 1 entry; no existing module files or plugin files (other than the documented plugin-count assertion bump) may be modified.
- **FR-024**: The `activity-types.ts` file under `src/modules/handoff-lab/` MUST export the canonical activity-type constant `HANDOFF_DEMO_ACTIVITY_TYPE = 'com.izkizk8.spot.activity.handoff-demo'` and any helpers, and this constant MUST be the single source of truth shared between the plugin and the runtime composer defaults.

### Key Entities

- **ActivityDefinition**: `{ activityType: string; title: string; webpageURL?: string; userInfo: Record<string, string>; requiredUserInfoKeys: string[]; isEligibleForHandoff: boolean; isEligibleForSearch: boolean; isEligibleForPrediction: boolean }` — the contract shape used by the composer, the JS bridge, and the native bridge.
- **ContinuationEvent**: `{ activityType: string; title: string; webpageURL?: string; userInfo: Record<string, unknown>; requiredUserInfoKeys: string[]; receivedAt: string }` — payload prepended into the IncomingLog. `receivedAt` is generated client-side at receipt (ISO 8601).
- **HookState**: `{ currentActivity: ActivityDefinition | null; log: ContinuationEvent[] (length ≤ 10); isAvailable: boolean }` — the slice exposed by `useHandoffActivity`.
- **ComposerFormState**: local form state mirroring `ActivityDefinition` plus per-field validation errors; not exported.

---

## Success Criteria

1. **Activity composition works**: Users can edit every documented field in the composer, see live validation errors, and tap "Become current" to push the definition through the bridge with byte-accurate fidelity (every field of `ActivityDefinition` is forwarded).
2. **Lifecycle observability**: After "Become current", the Current Activity card reflects the live activity within one render. After "Resign", it flips to empty state within one render. Mutual exclusion holds — only one row ever shows.
3. **Incoming log truncates at 10**: Synthesised continuation events arrive in order, the log prepends each, and the 11th event evicts the oldest. Malformed events are dropped silently in production / warned in dev.
4. **Plugin union-merges with 031**: After running both `with-spotlight` and `with-handoff` (in either order), Info.plist `NSUserActivityTypes` contains both `'spot.showcase.activity'` and `'com.izkizk8.spot.activity.handoff-demo'`, with no duplicates and prior order preserved. Idempotent — running either plugin twice is a no-op past the first run.
5. **Plugin coexists with all prior plugins**: Adding `with-handoff` to the plugin chain alongside the existing 30 entries does not perturb their output (every prior plugin's modResults remains byte-identical).
6. **Cross-platform**: Android and web render the IOSOnlyBanner, make zero native calls, and never import the iOS-only bridge at evaluation time.
7. **Plugin count**: `app.json` plugins array goes from 30 to 31 entries; the existing plugin-count assertion in `test/unit/plugins/with-mapkit/index.test.ts` is bumped from 30 to 31.
8. **Test coverage (JS-pure)**: Unit tests cover `activity-types`, `useHandoffActivity` (initial state, log truncation at exactly 10, error paths for malformed events, unmount unsubscribes), every component (ExplainerCard, ActivityComposer, KeyValueEditor, CurrentActivityCard, IncomingLog, SetupInstructions, IOSOnlyBanner / UniversalLinks section), every screen variant (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`), the manifest, the JS bridge contract on iOS and non-iOS, and the plugin (idempotency, union-merge with 031 in both orders, defensive handling of missing/non-array `NSUserActivityTypes`, plugin-count assertion). Native bridges are mocked at the import boundary; **no native runtime is required to run the suite**.
9. **Quality gate**: `pnpm check` passes green (typecheck, lint, format, tests) before commit. ZERO `eslint-disable` directives in new files.
10. **Constitution v1.1.0**: All constitution rules are satisfied — additive registry change, no rewrites of prior modules, conventions adhered to, test-pyramid intact (all new tests JS-pure unit tests).

---

## Out of Scope

1. **Universal Links runtime support**: The Associated Domains entitlement, `apple-app-site-association` hosting, path-pattern routing, and the actual `application(_:continue:)` branch for `NSUserActivityTypeBrowsingWeb` are **deferred to a follow-up spec**. Feature 040 only documents the relationship via the UniversalLinks explainer card.
2. **State restoration wiring into navigation**: The module documents the `NSUserActivity` → state-restoration relationship but does NOT wire activity payloads into `expo-router` navigation restoration. No persisted activity-driven launch behaviour is added.
3. **Spotlight reuse runtime**: Spotlight indexing of the demo activity (`isEligibleForSearch = true` taking effect end-to-end) is feature 031's territory. Feature 040 surfaces the toggle and forwards the flag, but does NOT add new Spotlight queries or assertions beyond what 031 already covers.
4. **Siri / `INIntent` donation**: `isEligibleForPrediction` is forwarded as a flag for educational purposes; no `INInteraction.donate(...)` integration is added.
5. **`NSUserActivityTypeBrowsingWeb` continuation flow**: Touching this would entangle Universal Links — explicitly deferred per (1).
6. **Watch / iPad-specific Handoff UX**: The module targets iPhone-first. Apple Watch handoff and iPad split-screen continuation behaviours are not addressed.
7. **AppleScript / shortcuts integration**: Out of scope; this module is strictly about `NSUserActivity` lifecycle.
8. **Localized titles**: The composer's default title is an English literal. No `InfoPlist.strings` localisation is added.
9. **Persistence of the Incoming Log across app launches**: The log is screen-scoped and resets on remount; no AsyncStorage persistence is added.
10. **End-to-end device-pair integration tests**: Verifying continuation across two physical devices requires a manual procedure (covered by Setup Instructions). Automated cross-device tests are not in scope.

---

## Assumptions

1. **AppDelegate continuation hook is available**: The Expo / React Native runtime exposes the AppDelegate `application(_:continue:restorationHandler:)` extension point such that `HandoffActivityHandler.swift` can register a handler at app launch. If this requires an Expo Modules `AppDelegateSubscriber` or `expo-modules-core` lifecycle hook, the plan/research phase will document the exact mechanism.
2. **No new permission**: `NSUserActivity` requires no `Info.plist` `*UsageDescription` key; only `NSUserActivityTypes` array entries. Confirmed in Reality Check #10.
3. **iOS 8+ deployment target**: The project's deployment target is at or above iOS 8. Eligibility flags introduced in later OSes (`isEligibleForSearch` iOS 9, `isEligibleForPrediction` iOS 12) are forward-compatible — the OS silently ignores unrecognised flags rather than crashing.
4. **Reverse-DNS activity-type validation**: The composer enforces a non-empty reverse-DNS-shaped string (`/^[a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/i` or equivalent) at the form layer. Apple does not strictly require the format but the convention is universal and aligns with 031.
5. **Plugin-count assertion location**: The project-wide plugin-count guard lives in `test/unit/plugins/with-mapkit/index.test.ts` (asserting 30 plugins after feature 039). This spec assumes that file is the right place to bump 30 → 31; the plan/tasks phase will confirm.
6. **Mocking strategy**: All `src/native/handoff.ts` imports are mocked at the boundary in tests (`jest.mock('@/src/native/handoff', ...)` or path-equivalent). No native runtime is required to run the test suite.
7. **`KeyValueEditor` is reusable but new**: Although several prior modules feature key/value editors, this module ships its own `KeyValueEditor` to avoid coupling. If a future refactor consolidates these, that's a separate spec.
8. **`receivedAt` is client-generated**: The native side does not stamp `receivedAt` — the JS hook stamps it at the moment the listener fires. This is sufficient for the educational artifact; sub-second skew between native delivery and JS receipt is acceptable.
9. **Reset / clear-log button is NOT included**: The Incoming Log is screen-scoped and clears on unmount. An explicit "Clear log" button is intentionally omitted to keep the surface minimal; this is a deliberate scope choice, not an oversight.
10. **The default activity type is namespaced under `com.izkizk8.spot.*`**: Reverse-DNS namespaced under the project owner so it never collides with third-party app types or with `'spot.showcase.activity'` from feature 031.

---

## Dependencies

1. **`expo-modules-core`** (already present): For native module / AppDelegate-subscriber wiring of `HandoffBridge.swift` and `HandoffActivityHandler.swift`.
2. **`@expo/config-plugins`**: For `plugins/with-handoff/index.ts` (`withInfoPlist`).
3. **Project conventions**: `ThemedText`, `ThemedView`, `Spacing` scale, `IOSOnlyBanner` (already present from prior modules — re-used or re-exported).
4. **Jest + @testing-library/react-native**: For unit tests.
5. **Existing module 006 registry**: `src/modules/registry.ts` — extended with one entry.
6. **Existing plugin-count test**: `test/unit/plugins/with-mapkit/index.test.ts` — bumped from 30 to 31.
7. **Feature 031 (`with-spotlight`)**: Coexists with this plugin; the union-merge contract on `NSUserActivityTypes` directly references 031's entry `'spot.showcase.activity'`.

---

## Rollout Plan

**Phase 1: Scaffolding**

- Create `src/modules/handoff-lab/` with:
  - `index.tsx` (manifest)
  - `activity-types.ts` (export `HANDOFF_DEMO_ACTIVITY_TYPE`)
  - `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`
  - `hooks/useHandoffActivity.ts`
  - `components/`: `ExplainerCard.tsx`, `ActivityComposer.tsx`, `KeyValueEditor.tsx`, `CurrentActivityCard.tsx`, `IncomingLog.tsx`, `SetupInstructions.tsx`, `IOSOnlyBanner.tsx` (or re-export from shared), `UniversalLinksSection.tsx`.
- Create `src/native/handoff.ts` (JS bridge with non-iOS stubs throwing `HandoffNotSupported`).
- Create `native/ios/handoff/HandoffBridge.swift` and `native/ios/handoff/HandoffActivityHandler.swift`.
- Create `plugins/with-handoff/` with `index.ts` (and a pure-helper file mirroring 031's pattern if helpful) and an adjacent test file.

**Phase 2: TDD Implementation**

- Write `activity-types.test.ts` → implement constants.
- Write `useHandoffActivity.test.tsx` (initial state, log truncation at exactly 10 entries with FIFO eviction, malformed-event drop with dev-only warn, unmount unsubscribes, setCurrent / resignCurrent mirror) → implement hook.
- Write tests for each component → implement components.
- Write tests for each screen variant → implement screens.
- Write tests for the JS bridge — verifying iOS path delegates to the native module, non-iOS path throws `HandoffNotSupported`, `isAvailable === (Platform.OS === 'ios')` semantics → implement JS bridge.
- Write tests for the plugin — idempotency, union-merge with 031 in both orders, defensive handling of missing / non-array `NSUserActivityTypes`, coexistence with all 30 prior plugins (modResults of every prior plugin is byte-identical when chained together) — and bump the plugin-count assertion in `test/unit/plugins/with-mapkit/index.test.ts` from 30 to 31 → implement plugin.
- Write a manifest test asserting registration shape (`id`, `platforms`, `minIOS`).

**Phase 3: Integration**

- Append `handoffLab` entry to `src/modules/registry.ts`.
- Append `./plugins/with-handoff` to `app.json` `plugins` array (30 → 31).
- Run `pnpm check` (typecheck, lint, format, tests) — all green.

**Phase 4: Verification**

- Verify zero `eslint-disable` directives across new files.
- Verify additive-only diff: only `src/modules/registry.ts` (+1 entry +1 import), `app.json` (+1 plugin entry), `test/unit/plugins/with-mapkit/index.test.ts` (30 → 31 numeric bump and adjacent comment), and `.github/copilot-instructions.md` SPECKIT block bump.
- Verify constitution v1.1.0 compliance.
- Generate summary report.

---

## Open Questions *(none — approved autonomously)*

All design decisions follow the structures established in features 031 (Spotlight, the union-merge precedent for `NSUserActivityTypes`), 036 (PassKit, native bridge structure with non-iOS throw stubs), and 039 (Quick Actions, registry / plugin-count conventions). Universal Links runtime support is explicitly deferred to a follow-up spec; this is an in-scope decision, not an open question.

---

**End of Specification**
