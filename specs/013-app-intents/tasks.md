---
description: "Task list — App Intents Showcase (spec 013)"
---

# Tasks: App Intents Showcase

**Input**: Design documents from `/specs/013-app-intents/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test-first is REQUIRED (Constitution V; plan.md § Constitution Check). Every JS/TS implementation task is preceded by — or paired with — its unit-test task. The Swift intent bodies and the `AppShortcutsProvider` are verified manually on device per `quickstart.md` (Constitution V exemption: native bodies are not Jest-reachable on the Windows host; the TS bridge contract that wraps them is fully unit-tested via mocks).

**Test file inventory** (matches plan.md § Project Structure): 1 manifest + 1 mood-store + 1 event-log + 1 bridge + 5 components + 3 screen variants + 1 plugin = **13 test files**.

## Format: `[ID] [P?] [Story?] Description`

- **[P]** — Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]** — Maps to user stories from spec.md
  - **US1** = Self-test the three intents from inside the app on iOS (P1)
  - **US2** = See the mood history persist across screen reloads (P1)
  - **US3** = Trigger the intents from Shortcuts and see them in the in-app log (P1)
  - **US4** = Cross-platform fallback on Android, Web, and iOS < 16 (P2)
- All paths are repo-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold module + native + plugin + test folders. **No new npm dependencies** — `expo-modules-core`, `@expo/config-plugins`, and `@react-native-async-storage/async-storage` are already installed (plan.md § Technical Context). Per SC-010 the only edit outside the new directories is the registry wiring in Phase 9.

- [X] T001 [P] Create empty module folders `src/modules/app-intents-lab/`, `src/modules/app-intents-lab/components/` and matching test folders `test/unit/modules/app-intents-lab/`, `test/unit/modules/app-intents-lab/components/`. Acceptance: directories exist; `git status` shows them tracked (with `.gitkeep` if your tooling drops empty dirs); nothing else changed.
- [X] T002 [P] Create empty native + plugin folders `native/ios/app-intents/`, `plugins/with-app-intents/`, and the matching test folder `test/unit/plugins/with-app-intents/`. Acceptance: directories exist; nothing else changed.
- [X] T003 [P] Confirm no new npm deps are required: run `pnpm list expo-modules-core @expo/config-plugins @react-native-async-storage/async-storage` and verify each resolves to an SDK 55–compatible version (already pinned by features 006 / 007). Do NOT add any package.json entries (plan.md § Technical Context, SC-010, FR-042). Acceptance: `git diff -- package.json pnpm-lock.yaml` is empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Land the four pure-JS / type-root modules every UI surface and the Swift bridge depend on — `mood-store.ts` (the shared source of truth between iOS intents and the JS UI), `event-log.ts` (ring-buffer reducer), `src/native/app-intents.ts` (the single iOS-only seam), and the manifest types reused from `@/modules/types`. Each test is written FIRST and MUST FAIL before its implementation lands.

**⚠️ CRITICAL**: No US-tagged task may begin until this phase is green. The mood store is the shared source of truth between iOS intents and the JS UI; the bridge is the only seam where the iOS-only `AppIntents` symbol is touched.

### Mood store (cross-platform; shared by iOS intents and JS UI — `contracts/mood-store.md`)

- [X] T004 Write `test/unit/modules/app-intents-lab/mood-store.test.ts` per `contracts/mood-store.md` § "Invariants asserted by `mood-store.test.ts`". Cover (one `describe` per group):
  - **Constants**: `MOOD_STORE_KEY === 'spot.app-intents.moods'`, `MOOD_STORE_DISK_CAP === 100`, `MOOD_STORE_DEFAULT_LIST_CAP === 100`, `MOODS` deep-equals `['happy','neutral','sad']`, `DEFAULT_MOOD === 'neutral'`.
  - **`push(record)`**: round-trip via `list({ limit: 1 })`; N≤100 successive pushes → `list().length === N` newest-first; 101 pushes → `list().length === 100`, oldest absent, newest at index 0; `setItem` rejection re-rejects to caller (FR-016).
  - **`list(opts?)`**: empty → `[]`; `limit: 0` → `[]`; `limit: K < length` returns K most recent; default limit applies cap of 100; `getItem` rejection resolves to `[]` (FR-016, no propagation); unparseable JSON resolves to `[]` (defence-in-depth).
  - **`clear()`**: post-clear `list()` returns `[]`; no-op on empty store; `removeItem` rejection re-rejects.
  - **Round-trip**: stored JSON parses to expected `MoodRecord[]` shape; timestamps preserved.

  At top-of-file `jest.mock('@react-native-async-storage/async-storage', …)` per `contracts/mood-store.md` § "Mock used by all dependent tests". Acceptance: file exists; `pnpm test --testPathPattern app-intents-lab/mood-store.test` FAILS — `mood-store` module missing.
- [X] T005 Implement `src/modules/app-intents-lab/mood-store.ts` per `contracts/mood-store.md` § "Public surface" and `data-model.md` § "Constants (mood-store.ts)". Pure module — no React. Export `Mood`, `MoodRecord`, `MOOD_STORE_KEY`, `MOOD_STORE_DISK_CAP`, `MOOD_STORE_DEFAULT_LIST_CAP`, `MOODS`, `DEFAULT_MOOD`, `push`, `list`, `clear`. Internal layout: AsyncStorage holds JSON-stringified array in **insertion order (oldest first)**; `list()` reverses then slices to `limit`; `push` reads → appends → `slice(-MOOD_STORE_DISK_CAP)` → writes. Catch `getItem` rejection in `list` and resolve to `[]`; catch JSON parse errors and resolve to `[]`; let `setItem` and `removeItem` rejections propagate. No `any`. Acceptance: T004 passes.

### Event log (iOS-only ring-buffer reducer)

- [X] T006 [P] Write `test/unit/modules/app-intents-lab/event-log.test.ts` per `data-model.md` § "Invariants asserted by `event-log.test.ts`". Cover: append on empty → `[invocation]`; N≤10 appends → length N newest-first; N>10 appends → length exactly `EVENT_LOG_CAPACITY`, newest at index 0, oldest evicted; `clear` returns `EMPTY_LOG`; unrecognised action returns the same state reference (identity-stable). Acceptance: file exists; FAILS — `event-log` module missing.
- [X] T007 [P] Implement `src/modules/app-intents-lab/event-log.ts` per `data-model.md` § "Constants (event-log.ts)" and § "EventLogState and the reducer". Export `EVENT_LOG_CAPACITY = 10`, `IntentName`, `IntentStatus`, `IntentInvocation`, `EventLogState`, `EMPTY_LOG`, `EventLogAction`, `eventLogReducer`. Pure module; identity-stable on unknown actions. Acceptance: T006 passes.

### App Intents bridge (the single iOS seam — `contracts/app-intents-bridge.md`)

- [X] T008 Write `test/unit/native/app-intents.test.ts` per `contracts/app-intents-bridge.md` § "Invariants asserted by tests". For each row in the per-platform table, `jest.mock('react-native', …)` to control `Platform.OS` / `Platform.Version` and `jest.mock('expo-modules-core', () => ({ requireOptionalNativeModule: jest.fn() }))` so the test pins the native return per scenario. Cover: web → `isAvailable() === false` and all three methods reject with `AppIntentsNotSupported`; android → same; iOS 15.5 → same; iOS 16 + `null` native → same; iOS 16 + mock native → `isAvailable() === true` and each method invokes its native counterpart with the right argument shape; native rejecting with `Error('NOT_SUPPORTED')` → bridge re-rejects with `AppIntentsNotSupported`; native rejecting with any other Error → bridge re-rejects with the original. Cross-cutting: bridge module imports without throwing on every platform; `AppIntentsNotSupported` is exported and `instanceof Error`; default export object is frozen (property reassignment does not take effect at runtime). Acceptance: file exists; FAILS — bridge module missing.
- [X] T009 Implement `src/native/app-intents.ts` per `contracts/app-intents-bridge.md` § "Module surface" and § "Native module shape". Export `AppIntentsNotSupported` (Error subclass with `name = 'AppIntentsNotSupported'`), `AppIntentsBridge` interface, default export `bridge` (frozen via `Object.freeze`). Use `requireOptionalNativeModule<NativeAppIntents>('AppIntents')`. `isAvailable()` returns `Platform.OS === 'ios' && parseFloat(String(Platform.Version)) >= 16 && native != null`. Each call method: if `!isAvailable()` → reject with new `AppIntentsNotSupported`; else delegate to `native.<fn>(args)` and re-shape the result to `{ ok: true, … }`; on native rejection, if message/code is `'NOT_SUPPORTED'` re-reject as `AppIntentsNotSupported`, otherwise rethrow original Error. Mirrors the `live-activity.ts` pattern. No `any`. Acceptance: T008 passes.

### Manifest types sanity (no implementation yet — manifest impl lands in Phase 9)

- [X] T010 [P] Write `test/unit/modules/app-intents-lab/manifest.test.ts` per `contracts/module-manifest.md` § "Invariants enforced by tests". Assert `id` matches `/^[a-z][a-z0-9-]*$/` AND equals `'app-intents-lab'`; `platforms` includes ios/android/web; `minIOS === '16.0'`; `title`, `description`, `icon.ios`, `icon.fallback` non-empty; `typeof manifest.render === 'function'`; `import { MODULES } from '@/modules/registry'; expect(MODULES).toContain(manifest)` (the registry-inclusion assertion will fail until Phase 9 / T035 lands — that is intentional). Acceptance: file exists; FAILS — manifest module missing.

**Checkpoint**: `mood-store.ts`, `event-log.ts`, `src/native/app-intents.ts` are green. All US phases (which depend on these types) may now begin in parallel.

---

## Phase 3: User Story 1 — Self-test the three intents from inside the app on iOS (Priority: P1) 🎯 MVP

**Goal**: A user opens the App Intents Lab on iOS 16+, sees the self-test panel with mood picker + Log mood / Get last mood / Greet user buttons, fires each intent through the JS bridge, and sees the result line + a fresh entry in the in-memory event log (cap 10).

**Independent Test**: RNTL render of `<AppIntentsLabScreen />` resolved as `screen.tsx` with `@/native/app-intents` mocked to a recording bridge. Assert (a) no "iOS 16+ only" banner, (b) mood picker defaults to `'neutral'`, (c) tapping Log mood with `happy` calls `bridge.logMood('happy')` and prepends a `LogMoodIntent` row to the event log, (d) Get last mood likewise, (e) Greet user with name "Ada" calls `bridge.greetUser('Ada')` and the row appears.

### Tests for User Story 1 (write FIRST, must FAIL before implementation)

- [X] T011 [P] [US1] Write `test/unit/modules/app-intents-lab/components/MoodLogger.test.tsx`. Render `<MoodLogger value="neutral" onChange={fn} onLog={logFn} />`. Assert three options labelled `Happy`, `Neutral`, `Sad` are present (use `getByA11yLabel(/Mood: …/)` or testIDs); the `Neutral` option reads as selected (`accessibilityState.selected`); fire press on `Happy`; assert `fn` called with `'happy'`. Press `Log mood` button; assert `logFn` called once. Acceptance: FAILS — component missing.
- [X] T012 [P] [US1] Write `test/unit/modules/app-intents-lab/components/IntentEventLog.test.tsx`. Render `<IntentEventLog log={[…]} />` with three pre-built `IntentInvocation` entries newest-first. Assert all three render; assert intent name, parameter summary, result string, and a formatted timestamp are visible per row; assert `status: 'failure'` rows pick up the failure styling (testID or accessibilityLabel `Status: failure`). Render with an empty log; assert an empty-state placeholder ("No intent invocations yet") is visible. Render with 10 entries; assert all 10 render; render with 11 (defence-in-depth — caller is responsible for the cap); assert the component does NOT independently truncate (the cap is in the reducer, T007). Acceptance: FAILS — component missing.
- [X] T013 [P] [US1] Write `test/unit/modules/app-intents-lab/components/GreetForm.test.tsx`. Render `<GreetForm value="" onChange={onChange} onGreet={onGreet} />`. Assert the Greet button is disabled (`accessibilityState.disabled === true`). Update value to `'   '`; assert still disabled (`name.trim().length === 0`). Update value to `'  Ada  '`; assert enabled; press Greet; assert `onGreet` called with `'Ada'` (trimmed). Type into the field; assert `onChange` fires with the typed string. Acceptance: FAILS — component missing.
- [X] T014 [P] [US1] Write `test/unit/modules/app-intents-lab/screen.test.tsx` (iOS variant). At top-of-file `jest.mock('@/native/app-intents', () => ({ default: { isAvailable: () => true, logMood: jest.fn().mockResolvedValue({ ok: true, logged: 'happy', timestamp: 1 }), getLastMood: jest.fn().mockResolvedValue({ ok: true, mood: 'happy' }), greetUser: jest.fn().mockResolvedValue({ ok: true, greeting: 'Hello, Ada!' }) }, AppIntentsNotSupported: class extends Error {} }))` and `jest.mock('@/modules/app-intents-lab/mood-store', …)` to a controllable in-memory store. Render the default-resolved `./screen` and assert: (a) `queryByText(/iOS 16/)` returns `null` (no banner), (b) the mood picker defaults to `Neutral`, (c) the three buttons are visible, (d) press Log mood → `bridge.logMood('neutral')` called once, result line text "Logged neutral at …" visible, event log row with intent name `LogMoodIntent` and parameters `{ mood: 'neutral' }` visible at index 0, (e) press Get last mood → `bridge.getLastMood()` called, result line "Last mood: happy", new event-log row at index 0 with intent name `GetLastMoodIntent`, (f) type `Ada`, press Greet user → `bridge.greetUser('Ada')` called, result "Hello, Ada!", new event-log row, (g) fire any of the three buttons 12 times in succession; assert event log shows exactly 10 entries newest-first (FR-022, SC-003). Acceptance: FAILS — screen missing.

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement `src/modules/app-intents-lab/components/MoodLogger.tsx`. Themed mood picker: three `Pressable`s in a `ThemedView` row labelled `Happy` / `Neutral` / `Sad` plus a primary "Log mood" `Pressable` button. Props: `{ value: Mood; onChange: (next: Mood) => void; onLog: () => void; logLabel?: string }`. `accessibilityLabel` per option is `"Mood: <label>"`; `accessibilityState.selected` reflects `value`; the Log button has `accessibilityRole: 'button'` with label `"Log mood"`. `StyleSheet.create`, `Spacing` only; no inline style objects defined outside StyleSheet; no `any`. Acceptance: T011 passes.
- [X] T016 [P] [US1] Implement `src/modules/app-intents-lab/components/IntentEventLog.tsx`. Newest-first `FlatList` (or themed `ScrollView` map for ≤10 rows) over `IntentInvocation[]`. Each row renders intent name, formatted timestamp (`HH:MM:SS`), parameter summary (`JSON.stringify(parameters)` or `none`), and result string; `status === 'failure'` rows pick up an `accessibilityLabel` suffix `"Status: failure"` and a destructive theme color via `useTheme()`. Empty-state row: themed text "No intent invocations yet". Per FR-035, the row's `accessibilityLabel` is the concatenation `"<intent> with <params> at <time>: <result>"`. `StyleSheet.create`, `Spacing`, themed primitives only. Acceptance: T012 passes.
- [X] T017 [P] [US1] Implement `src/modules/app-intents-lab/components/GreetForm.tsx`. `ThemedView` containing a labelled `TextInput` and a "Greet user" `Pressable`. Props: `{ value: string; onChange: (v: string) => void; onGreet: (trimmedName: string) => void; greetLabel?: string }`. Greet button is `disabled` and `accessibilityState.disabled` is `true` whenever `value.trim().length === 0`; on press, calls `onGreet(value.trim())`. `accessibilityLabel` on the button is `"Greet user"`; on the field, `"Name"`. `StyleSheet.create`, `Spacing`, themed primitives only. Acceptance: T013 passes.
- [X] T018 [US1] Implement `src/modules/app-intents-lab/screen.tsx` (iOS variant) per `data-model.md` § "ScreenState" and § "Relationships". Composes (top→bottom): `<ThemedView>` root → self-test panel `<MoodLogger value={mood} onChange={setMood} onLog={onLogMood} />` + `<Pressable onPress={onGetLastMood}>Get last mood</Pressable>` + `<GreetForm value={name} onChange={setName} onGreet={onGreetUser} />` + `<ResultLine text={lastResult} />` (a small inline `ThemedText` row) → `<IntentEventLog log={log} />` → `<MoodHistory history={history.slice(0, 20)} />` (component lands in US2; import as a forward reference and pass empty `history={[]}` until US2's T021/T022 land — see Dependencies) → `<ShortcutsGuideCard onOpenShortcuts={openShortcuts} />` (component lands in US3; same forward-reference pattern). State per `data-model.md` § "ScreenState"; reducer for `log` is `eventLogReducer`. Each intent handler awaits the bridge call and dispatches `{ type: 'append', invocation }` with `status: 'success'` or `'failure'` (catching the bridge rejection); on `LogMoodIntent` success, refresh history via `mood-store.list({ limit: 20 })`. Does NOT render any "iOS 16+ only" banner (FR-018(a)). `StyleSheet.create`, `Spacing`, `ThemedText`, `ThemedView` only; no `Platform.OS` (handled via file split, FR-031). Default-export `AppIntentsLabScreen`. Acceptance: T014 passes; the `MoodHistory` and `ShortcutsGuideCard` imports compile because their stub files exist (or land via T022 / T026 first). NOTE: per ordering, prefer landing T022 + T026 stubs before T018; see Dependencies section.

**Checkpoint**: On iOS 16+, the self-test panel fires each intent through the JS bridge and the in-memory event log records each invocation newest-first capped at 10. The persistent Mood History list and the Shortcuts integration card land in US2 and US3 respectively. Fallback variants land in US4.

---

## Phase 4: User Story 2 — See the mood history persist across screen reloads (Priority: P1)

**Goal**: Below the self-test panel on iOS (and below the JS Mood Logger on the fallback), a "Mood History" list shows the last 20 logged moods, newest-first, refreshed after every successful Log mood and on AppState foreground; data persists across screen unmount/remount via `mood-store.ts`.

**Independent Test**: RNTL render of `<MoodHistory />` with a fixture of 22 records; assert exactly 20 render newest-first. Mount the iOS `screen.tsx` with the bridge mocked to succeed and the mood-store mocked to a recording in-memory backend; press Log mood; assert `mood-store.push` called with `{ mood: 'neutral', timestamp: <recent> }` and the new entry appears at the top of the rendered Mood History list within the same render pass. Unmount and remount the screen; assert the list still reflects the underlying store (FR-013, FR-026, FR-033).

### Tests for User Story 2 (write FIRST)

- [X] T019 [P] [US2] Write `test/unit/modules/app-intents-lab/components/MoodHistory.test.tsx`. Render `<MoodHistory history={[r1, r2, r3]} />` with `r1` being the newest. Assert all three render in newest-first order; assert each row shows the mood label and a formatted timestamp; render with an empty `history`; assert an empty-state row "No moods logged yet" is visible. Render with 22 entries; assert the component renders all entries it receives (cap is the caller's responsibility — `screen.tsx` slices to 20). Acceptance: FAILS — component missing.
- [X] T020 [US2] Extend `test/unit/modules/app-intents-lab/screen.test.tsx` with a new `describe('Mood History (US2)')` block. Mock `@/modules/app-intents-lab/mood-store` to a controllable backend with a `__setHistory(records)` test hook. Render the screen; press Log mood with `happy`; assert `mood-store.push` called once with `{ mood: 'happy', timestamp: expect.any(Number) }`; assert `mood-store.list({ limit: 20 })` called after the push resolves; assert the new entry appears at index 0 of the rendered Mood History list (testID `mood-history-row-0` or by visible mood label + timestamp). Pre-seed the store with 22 entries; mount the screen; assert exactly 20 rows render. Simulate `AppState.addEventListener('change', listener)` firing with `'active'`; assert `mood-store.list({ limit: 20 })` is called again (FR-033). Unmount and remount; assert no React state-update warnings post-unmount (FR-032). Acceptance: FAILS — Mood History wiring missing in `screen.tsx`.

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement `src/modules/app-intents-lab/components/MoodHistory.tsx`. Themed list (FlatList for >20 rows; ScrollView+map otherwise). Props: `{ history: readonly MoodRecord[] }`. Each row: `<ThemedView>` with `<ThemedText>` showing the mood label (Title-cased) and a timestamp formatted as `MMM d, HH:mm`. Empty state: "No moods logged yet". `accessibilityLabel` per row: `"<Mood> at <time>"`. `StyleSheet.create`, `Spacing`, themed primitives only. Acceptance: T019 passes.
- [X] T022 [US2] Wire `MoodHistory` into `src/modules/app-intents-lab/screen.tsx`: replace the empty-array forward reference from T018 with a real `history` state slice initialised from `mood-store.list({ limit: 20 })` on mount; refresh after every successful `LogMoodIntent`; subscribe to `AppState`'s `change` event and refresh on `'active'` (FR-033); unsubscribe on unmount and guard the post-unmount setState (FR-032 — use a `mountedRef` or `AbortController` pattern). Acceptance: T020 passes; T014 still passes.

**Checkpoint**: On iOS 16+, every Log mood (whether from the self-test button, Siri, or Shortcuts on a subsequent foreground) appears at the top of the persistent Mood History list within the same render pass. The list survives screen unmount/remount.

---

## Phase 5: User Story 3 — Trigger the intents from Shortcuts and see them in the in-app log (Priority: P1)

**Goal**: A "Shortcuts integration guide" card with numbered steps and a primary "Open Shortcuts" button is visible at the bottom of the iOS screen; tapping it deep-links into Apple's Shortcuts app via `Linking.openURL('shortcuts://')`. Following the steps, the user invokes Log mood from Shortcuts and on returning to Spot sees the new entry at the top of Mood History.

**Independent Test**: RNTL render of `<ShortcutsGuideCard />` with a mocked `Linking`; assert the numbered steps and Open Shortcuts button are present; press the button; assert `Linking.openURL('shortcuts://')` was called once. Manual on-device verification per `quickstart.md` §2 confirms the three intents appear under the Spot app in Shortcuts and Log mood from Shortcuts surfaces in Mood History.

### Tests for User Story 3 (write FIRST)

- [X] T023 [P] [US3] Write `test/unit/modules/app-intents-lab/components/ShortcutsGuideCard.test.tsx`. At top-of-file `jest.mock('react-native', () => ({ ...jest.requireActual('react-native'), Linking: { openURL: jest.fn().mockResolvedValue(true) } }))`. Render `<ShortcutsGuideCard onOpenShortcuts={fn} />`. Assert: a heading "Shortcuts integration guide" (or equivalent) is present; a numbered step list (≥3 items) is visible naming `Log mood`, `Get last mood`, `Greet user` somewhere in the body; a primary "Open Shortcuts" button is present with `accessibilityLabel` "Open Shortcuts app" (FR-034). Press the button; assert `fn` called once. Render with `onOpenShortcuts` calling the actual `Linking.openURL('shortcuts://')`; press; assert `Linking.openURL` called with `'shortcuts://'` (FR-028). Mock `Linking.openURL` to reject; press; assert no crash; component surfaces an error state (testID `shortcuts-error` or visible text). Acceptance: FAILS — component missing.

### Implementation for User Story 3

- [X] T024 [P] [US3] Implement `src/modules/app-intents-lab/components/ShortcutsGuideCard.tsx`. Themed card: heading + numbered step list (`1. Open Shortcuts. 2. Find "Spot" in the app actions list. 3. Run "Log mood" with a mood. 4. Return to Spot — your entry appears in Mood History.`) + primary "Open Shortcuts" `Pressable`. Props: `{ onOpenShortcuts?: () => void | Promise<void> }`. If `onOpenShortcuts` is omitted, the button calls `Linking.openURL('shortcuts://')` directly and catches rejection into an inline error message. `StyleSheet.create`, `Spacing`, themed primitives only. Acceptance: T023 passes.
- [X] T025 [US3] Wire `ShortcutsGuideCard` into `src/modules/app-intents-lab/screen.tsx`: replace the forward reference from T018 with a real `<ShortcutsGuideCard onOpenShortcuts={openShortcuts} />` where `openShortcuts` calls `Linking.openURL('shortcuts://')` and surfaces failure into `lastResult`. Acceptance: T014 still passes; manual verification on device per `quickstart.md` §2 deferred to T038.

**Checkpoint**: On iOS 16+ the screen surfaces the Shortcuts integration card; the deep-link works in JS; on-device verification of the system Shortcuts surface is deferred to manual quickstart steps.

---

## Phase 6: User Story 4 — Cross-platform fallback on Android, Web, and iOS < 16 (Priority: P2)

**Goal**: On Android, Web, and iOS < 16, the screen renders an "App Intents are iOS 16+ only" banner, a JS-only Mood Logger panel writing to the same `mood-store.ts`, an inline Greet form returning the greeting in pure JS, and the same Mood History list. The event log, the Get last mood button, and the Shortcuts integration card are NOT shown.

**Independent Test**: RNTL render of the explicit-filename `require('./screen.android').default` (and `./screen.web.default`) with `@/modules/app-intents-lab/mood-store` mocked. Assert the banner is present; assert the JS Mood Logger writes to the store on Log; assert the inline Greet form returns "Hello, <name>!" in JS without invoking any native module; assert no `IntentEventLog`, no `Get last mood` button, and no `ShortcutsGuideCard` are rendered. Per FR-031, the iOS-only `app-intents` bridge symbol MUST NOT be evaluated at module load time on these variants — verified by NOT mocking `@/native/app-intents` in these tests (the file is import-safe; if the variant accidentally calls a bridge method, the test asserts `AppIntentsNotSupported` is thrown).

### Tests for User Story 4 (write FIRST)

- [X] T026 [P] [US4] Write `test/unit/modules/app-intents-lab/screen.android.test.tsx`. Use the explicit-filename pattern: `const Screen = require('@/modules/app-intents-lab/screen.android').default;` (so the iOS variant is never resolved on the Windows host — pattern established by features 006/011/012, plan.md § Testing). At top-of-file `jest.mock('@/modules/app-intents-lab/mood-store', …)` to a controllable backend; do NOT mock `@/native/app-intents` (assert import-safety). Render `<Screen />`. Assert: (a) banner text "App Intents are iOS 16+ only" is visible (FR-019(a), FR-036), (b) `<MoodLogger />` is rendered, (c) `<GreetForm />` is rendered, (d) `<MoodHistory />` is rendered, (e) `queryByText('Get last mood')` returns `null` (FR-019), (f) the `IntentEventLog` is NOT rendered (no `Recent intent invocations` text) (FR-019), (g) the `ShortcutsGuideCard` is NOT rendered. Press Log on `mood='happy'`; assert `mood-store.push` called once with `{ mood: 'happy', timestamp: expect.any(Number) }`; assert the new entry appears at the top of Mood History (FR-024, FR-026). Type `Mae` in the name field; press Greet; assert an inline result line `"Hello, Mae!"` is visible (pure JS — no native bridge call) (FR-019(c)). Acceptance: FAILS — `screen.android.tsx` missing.
- [X] T027 [P] [US4] Write `test/unit/modules/app-intents-lab/screen.web.test.tsx`. Identical structure to T026 but using `require('@/modules/app-intents-lab/screen.web').default`. Assert the same banner / Mood Logger / Greet form / Mood History composition; assert the event log, the Get last mood button, and the Shortcuts card are absent. Acceptance: FAILS — `screen.web.tsx` missing.

### Implementation for User Story 4

- [X] T028 [P] [US4] Implement `src/modules/app-intents-lab/screen.android.tsx` per `data-model.md` § "Relationships" — Android variant. Composes `<ThemedView>` root → `<Banner text="App Intents are iOS 16+ only" />` (themed informational banner; reuse `ThemedText` + a themed background color via `useTheme()`) → `<MoodLogger value={mood} onChange={setMood} onLog={onLogMoodJS} />` (calls `mood-store.push({ mood, timestamp: Date.now() })` on tap, refreshes history) → `<GreetForm value={name} onChange={setName} onGreet={onGreetUserJS} />` (returns `"Hello, ${name.trim()}!"` into `lastResult` in pure JS) → `<ResultLine text={lastResult} />` → `<MoodHistory history={history.slice(0, 20)} />`. Does NOT import `@/native/app-intents` and does NOT render `IntentEventLog` / Get last mood button / `ShortcutsGuideCard` (FR-019, FR-031). State init mirrors `screen.tsx` minus the iOS-only `log` and `available` slices. AppState foreground refresh applies (FR-033). Default-export `AppIntentsLabScreen`. Acceptance: T026 passes.
- [X] T029 [P] [US4] Implement `src/modules/app-intents-lab/screen.web.tsx` — Web variant. Identical composition to T028 (banner + JS Mood Logger + inline Greet + Mood History). Default-export `AppIntentsLabScreen`. Acceptance: T027 passes.

**Checkpoint**: Android, Web, and iOS < 16 render a coherent fallback path that exercises the same shared `mood-store.ts` as the iOS path, with no iOS-only symbols evaluated at load time (FR-031).

---

## Phase 7: Native Swift sources (on-device verification only)

**Purpose**: Land the four Swift files that the `with-app-intents` plugin (Phase 8) wires into the main app target. These files are NOT unit-tested on the Windows host (Constitution V exemption: native bodies are not Jest-reachable). They MUST compile under EAS Build / `npx expo run:ios` so the dev client surfaces the three intents to Siri / Shortcuts / Spotlight. Behavioural verification is per `quickstart.md` §1, §2, §6.

- [X] T030 [P] Implement `native/ios/app-intents/LogMoodIntent.swift` per plan.md § Project Structure and `data-model.md` § "MoodRecord". Defines a `SpotMood` enum (`happy`, `neutral`, `sad`) conforming to `AppEnum` with `caseDisplayRepresentations` mapping to capitalised display labels (`Happy`, `Neutral`, `Sad`); a `LogMoodIntent: AppIntent` with `static var title: LocalizedStringResource = "Log mood"`, `@Parameter(title: "Mood") var mood: SpotMood`, and a `func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String>` body that writes a `MoodRecord` `{ mood: mood.rawValue, timestamp: Date().timeIntervalSince1970 * 1000 }` to the same `spot.app-intents.moods` AsyncStorage key the JS `mood-store.ts` reads from (per `contracts/mood-store.md` § "Cross-platform behaviour" and `research.md` Decision 1; if the underlying AsyncStorage file format proves unreadable from Swift, write to the documented parallel JSON file fallback), donates itself via `IntentDonationManager`, and returns `.result(value: "Logged \(mood.rawValue) at \(formattedTime)", dialog: "Logged \(mood.rawValue) at \(formattedTime)")`. Includes the iOS-bridge module entry exposing `logMood`, `getLastMood`, and `greetUser` to JS via `expo-modules-core` (registered as the native module name `'AppIntents'` per `contracts/app-intents-bridge.md`). Acceptance: file compiles under `xcodebuild` / EAS Build; on-device verification deferred to `quickstart.md` §1.
- [X] T031 [P] Implement `native/ios/app-intents/GetLastMoodIntent.swift`. `GetLastMoodIntent: AppIntent` with `static var title: LocalizedStringResource = "Get last mood"`, no parameters, and a `perform()` body that reads the same shared store, returns the most recent record's mood (or `nil` → "No moods logged yet"), and returns `.result(value: lastMood, dialog: "Last mood: \(lastMood)")`. Acceptance: file compiles; on-device verification deferred to `quickstart.md` §1.
- [X] T032 [P] Implement `native/ios/app-intents/GreetUserIntent.swift`. `GreetUserIntent: AppIntent` with `static var title: LocalizedStringResource = "Greet user"`, `@Parameter(title: "Name") var name: String`, and a `perform()` body that defends against empty / whitespace input from Siri/Shortcuts (returns `"Hello, there!"` per planning resolution #1) and otherwise returns `"Hello, \(name.trimmingCharacters(in: .whitespaces))!"`; result type `.result(value: greeting, dialog: greeting)`. Acceptance: file compiles; on-device verification deferred to `quickstart.md` §1, §2.
- [X] T033 [P] Implement `native/ios/app-intents/SpotAppShortcuts.swift`. A single `AppShortcutsProvider` exposing all three intents with one Apple-recommended `AppShortcutPhrase` each (e.g. `"Log my mood with \(.applicationName)"`, `"Ask \(.applicationName) for my last mood"`, `"Greet me with \(.applicationName)"`). Acceptance: file compiles; on-device verification deferred to `quickstart.md` §2.

---

## Phase 8: `with-app-intents` Expo config plugin

**Purpose**: Register the four Swift files (T030–T033) with the main app target's compile sources at `expo prebuild` time. Plugin MUST be additive and idempotent (FR-030, SC-011) and MUST NOT touch any region of the Xcode project that feature 007's `with-live-activity` plugin writes to (research.md Decision 2; verified live on disk before any plugin code is written).

### Test FIRST

- [X] T034 Write `test/unit/plugins/with-app-intents/index.test.ts` per plan.md § "Library decision". Build a fixture `pbxproj` string seeded with the state `with-live-activity` would leave behind (the `LiveActivityDemoWidget` target plus the four widget Swift file refs and the `NSSupportsLiveActivities` Info.plist key). `jest.mock` `@expo/config-plugins`'s `withXcodeProject` to a synchronous pass-through that hands the test the in-memory project. Apply `withAppIntents` once; assert: (a) the four Swift files (`LogMoodIntent.swift`, `GetLastMoodIntent.swift`, `GreetUserIntent.swift`, `SpotAppShortcuts.swift`) appear in the **main app target**'s compile sources, (b) no other target was added or modified, (c) `Info.plist` was not touched, (d) every region the live-activity plugin wrote to (the `LiveActivityDemoWidget` target ref, its file refs, the `NSSupportsLiveActivities` key) is byte-identical to the input fixture (FR-030, SC-011 — disjointness probe). Apply `withAppIntents` a SECOND time; assert: (e) no duplicate file refs added (idempotency — `quickstart.md` §0), (f) the project string is byte-identical to the post-first-run state. Acceptance: file exists; FAILS — plugin missing.

### Implementation

- [X] T035 [P] Implement `plugins/with-app-intents/package.json` mirroring `plugins/with-live-activity/package.json`: `{ "name": "with-app-intents", "main": "index.ts" }` (no other fields needed; Expo auto-discovers via `app.json` `plugins` array). Acceptance: file lands; `npx expo config --type prebuild` resolves the plugin without error.
- [X] T036 [P] Implement `plugins/with-app-intents/index.ts` and `plugins/with-app-intents/add-app-intents-sources.ts`. `index.ts` exports a default `ConfigPlugin<void>` that composes `withAppIntentsSources`. `add-app-intents-sources.ts` exports `withAppIntentsSources: ConfigPlugin<void>` using `withXcodeProject` to: locate the main app target by name (read from `config.modRequest.projectName`), enumerate the four Swift files under `native/ios/app-intents/` relative to repo root, and for each file: skip if a file ref with the same path already exists (idempotency), otherwise add the file ref via `pbxproj.addSourceFile(relPath, { target: mainTargetUuid })`. Does NOT add a target; does NOT touch `Info.plist`; does NOT touch any region the `with-live-activity` plugin writes to. No `any`. Acceptance: T034 passes.
- [X] T037 Edit `app.json` to register the plugin in the `expo.plugins` array. Append `"./plugins/with-app-intents"` after the existing `"./plugins/with-live-activity"` entry (one added line). This is the **documented exception** in SC-010 (per `quickstart.md` §9): if Expo auto-discovery from `plugins/with-app-intents/package.json` proves sufficient on this Expo SDK 55 build, prefer that path and revert the `app.json` edit; verify with the additive-only diff in `quickstart.md` §9 before opening the PR. Acceptance: `npx expo prebuild --clean` runs both `with-live-activity` and `with-app-intents`; the four Swift files appear in `ios/spot.xcodeproj/project.pbxproj` under the main app target (verified by the `grep` checks in `quickstart.md` §0); the live-activity widget extension remains intact.

---

## Phase 9: Manifest & registry wiring

**Purpose**: Land the module manifest and surface the module in the spec 006 grid via the one-import-one-entry contract (FR-039, SC-010, `contracts/module-manifest.md` § "Registry edit").

- [X] T038 Implement `src/modules/app-intents-lab/index.tsx` per `contracts/module-manifest.md` § "Concrete shape". Default-export `ModuleManifest` `{ id: 'app-intents-lab', title: 'App Intents Lab', description: 'Demo of Apple App Intents on iOS 16+; JS-only mood logger fallback.', icon: { ios: 'square.and.arrow.up.on.square', fallback: '🎙️' }, platforms: ['ios','android','web'], minIOS: '16.0', render: () => <AppIntentsLabScreen /> }`. Imports `AppIntentsLabScreen` from `./screen` (the bundler picks the right platform variant). The exact SF Symbol name MAY be revised at implement time per `data-model.md` § "ModuleManifest" if the chosen one is not available pre-iOS 17 (safe alternatives: `'mic.fill'`, `'wand.and.stars'`, `'app.badge'`). The `MODULES.toContain(manifest)` assertion in T010 will FAIL until T039 lands — that is intentional. Acceptance: T010 passes EXCEPT the `MODULES.toContain` case (which passes after T039).
- [X] T039 Edit `src/modules/registry.ts`: add ONE import `import appIntentsLab from './app-intents-lab';` (after the `swiftChartsLab` import) and append ONE entry `appIntentsLab,` to the `MODULES` array (after the `swiftChartsLab,` entry). No other shell file modified. Acceptance: the global `test/unit/modules/manifest.test.ts` invariants suite still passes; `test/unit/modules/registry.test.ts` reports the new module appearing in source order; T010's `MODULES.toContain(manifest)` case now passes; `git diff src/modules/registry.ts` is exactly +2 lines (1 import + 1 entry).

---

## Phase 10: Polish & Quality Gate

- [X] T040 Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and iterate until all four are green with zero new warnings (FR-043, SC-012). Acceptance: each command exits 0; `pnpm test --testPathPattern app-intents-lab` reports all module test files green; `pnpm test --testPathPattern native/app-intents` and `pnpm test --testPathPattern plugins/with-app-intents` likewise; full suite still green. `pnpm check` (the aggregate script) green.
- [X] T041 [P] Cleanup pass on `src/modules/app-intents-lab/`, `src/native/app-intents.ts`, and `plugins/with-app-intents/`: confirm no `Platform.OS` outside the implicit file-split (FR-031 / Constitution III); no inline style objects defined outside `StyleSheet.create` (Constitution IV); no `any` (Constitution VI); no unused exports; all imports use the `@/` alias (Constitution III/IV/VI). Run `pnpm lint --max-warnings 0` and `pnpm typecheck` again. Acceptance: zero warnings/errors; diff is whitespace-only or trivial naming fixes.
- [X] T042 [P] Documentation touch-ups: cross-link `specs/013-app-intents/quickstart.md` from `README.md` "Modules" list (if such a list exists; otherwise skip silently); confirm `.github/copilot-instructions.md` SPECKIT block points at this feature's plan if it tracks active features; ensure `specs/013-app-intents/checklists/` (if populated) is referenced from `plan.md`. Acceptance: links resolve; no other docs modified.
- [X] T043 [P] Additive-only invariant probe (SC-010, FR-039 / `quickstart.md` §9): run `git diff --stat main..HEAD -- ':!src/modules/app-intents-lab/' ':!src/native/app-intents.ts' ':!plugins/with-app-intents/' ':!native/ios/app-intents/' ':!test/unit/modules/app-intents-lab/' ':!test/unit/native/app-intents.test.ts' ':!test/unit/plugins/with-app-intents/' ':!specs/013-app-intents/'` and verify the only file outside the module / native / plugin / test / spec directories with diffs is `src/modules/registry.ts` (exactly +2 lines from T039) and — only if the auto-discovery path is insufficient — `app.json` (the +1 line from T037, the documented SC-010 exception). Acceptance: diff matches the expected additive-only shape.
- [X] T044 Final commit on `013-app-intents` summarising the feature; then run `quickstart.md` §1–§10 on at least one iPhone running iOS 16+, one Android device, and one desktop web browser tab. Record any deviations as follow-ups in the PR description. Acceptance: commit pushed; smoke matrix recorded; SC-001 (three intents fired in <60 s on iOS 16+), SC-002 (each invocation produces same-pass result + log row), SC-003 (event log capped at 10), SC-004 (Log mood → Mood History same-pass), SC-005 (three intents listed under Spot in Shortcuts), SC-006 (Open Shortcuts deep-link works), SC-007 (no missing-iOS-symbol errors on Android/Web), SC-010 (additive-only diff), SC-011 (`with-app-intents` and `with-live-activity` coexist — `quickstart.md` §0 grep checks), SC-012 (`pnpm check` green) confirmed live.

---

## Dependencies & Execution Order

### Phase order

1. **Phase 1 Setup** (T001–T003) — all `[P]`.
2. **Phase 2 Foundational** (T004–T010) — depends on Phase 1. Ordering inside the phase: `T004 → T005`, `T006 ‖ T007`, `T008 → T009`, `T010` (manifest test, fails on `MODULES.toContain` until T039). **Blocks all US phases.**
3. **Phase 3 US1** (T011–T018) — depends on Phase 2. Tests `T011 ‖ T012 ‖ T013 ‖ T014` first; impls `T015 ‖ T016 ‖ T017`; then `T018` (screen) which transitively imports `MoodHistory` (T021) and `ShortcutsGuideCard` (T024) — write minimal stubs OR sequence T021 + T024 before T018; recommended path is T021 + T024 stubs first, then `T018`.
4. **Phase 4 US2** (T019–T022) — depends on Phase 3. `T019` first; `T021` lands the component; `T020` extends `screen.test.tsx`; `T022` wires it into `screen.tsx`.
5. **Phase 5 US3** (T023–T025) — depends on Phase 3. `T023` first; `T024` impls; `T025` wires into `screen.tsx`. May land in parallel with Phase 4 if the two `screen.tsx` edits are coordinated.
6. **Phase 6 US4** (T026–T029) — depends on Phase 2 only (each fallback variant is self-contained against `mood-store.ts` + the components from Phases 3–5). `T026 ‖ T027` first; then `T028 ‖ T029`. Components `MoodLogger`, `MoodHistory`, `GreetForm` (T015 / T021 / T017) MUST already exist; the variants do NOT import `IntentEventLog` (T016) or `ShortcutsGuideCard` (T024).
7. **Phase 7 Native Swift** (T030–T033) — depends only on the contract defined in `contracts/app-intents-bridge.md` and `contracts/mood-store.md`. May start in parallel with any phase from US1 onward; verified on device after T040 / T044.
8. **Phase 8 Plugin** (T034–T037) — `T034` first; then `T035 ‖ T036`; then `T037`. Independent of Phases 3–7 (the plugin operates on a fixture pbxproj). T037 (the `app.json` edit, if needed) lands last in the phase.
9. **Phase 9 Manifest & registry** (T038–T039) — depends on T018 + T028 + T029 (the `render` callable resolves to all three platform variants). `T038 → T039`. T039 satisfies T010's last failing case.
10. **Phase 10 Polish** (T040–T044) — T040 depends on everything above; T041 ‖ T042 ‖ T043 alongside T040; T044 last.

### Parallelisable sets

- **Setup**: `T001 ‖ T002 ‖ T003`.
- **Foundational tests + impls**: `T004 → T005`; in parallel `T006 → T007`; in parallel `T008 → T009`; `T010` standalone.
- **US1 tests**: `T011 ‖ T012 ‖ T013 ‖ T014`.
- **US1 component impls**: `T015 ‖ T016 ‖ T017` (then T018 once MoodHistory/ShortcutsGuideCard stubs exist).
- **US4 tests**: `T026 ‖ T027`; impls `T028 ‖ T029`.
- **Native Swift**: `T030 ‖ T031 ‖ T032 ‖ T033` (independent files).
- **Plugin**: `T035 ‖ T036` after `T034`.
- **Polish**: `T041 ‖ T042 ‖ T043` alongside `T040`.

### Cross-cutting concerns

- **`screen.tsx` is touched by T018, T022, T025** (US1, US2, US3 each add a region). Coordinate edits or sequence the three.
- **`screen.test.tsx` is touched by T014 and T020** (US1 + US2). Coordinate edits or sequence.
- **`MoodLogger`, `MoodHistory`, `GreetForm` are shared between iOS (`screen.tsx`) and the fallback variants (`screen.android.tsx`, `screen.web.tsx`)** — the iOS-only `IntentEventLog` and `ShortcutsGuideCard` are NOT imported by the fallback variants (FR-031).
- **`mood-store.ts` is the single shared source of truth** between the iOS Swift intent path (T030 writes through it) and every JS path (T015, T018, T028, T029 read/write it). Changes to its public surface require updating both sides.
- **Plugin disjointness from `with-live-activity` is asserted by T034**. Any change to `with-live-activity` that alters its pbxproj footprint requires re-running T034 and updating its fixture.

---

## MVP scope & incremental delivery

- **MVP** = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 7 (Swift) + Phase 8 (plugin) + Phase 9 (registry) + Phase 10 polish. This delivers the self-test panel firing real Swift intents through the JS bridge on iOS 16+, with the in-memory event log; the persistent Mood History list, Shortcuts integration card, and cross-platform fallback are deferred to subsequent increments.
- **Increment 2** = Phase 4 (US2 — Mood History persistence). Required for the MVP's "Get last mood" call to be credible across screen unmounts.
- **Increment 3** = Phase 5 (US3 — Shortcuts integration card). Headline beat for the showcase; required to demonstrate the intents are visible system-wide.
- **Increment 4** = Phase 6 (US4 — cross-platform fallback). Required for Constitution Principle I (Cross-Platform Parity); ships the Android / Web / iOS < 16 path.

---

## Format validation

All 44 tasks above follow the strict checklist format `- [X] [TaskID] [P?] [Story?] Description with file path`:

- Setup tasks (T001–T003): no `[Story]` label.
- Foundational tasks (T004–T010): no `[Story]` label.
- US1 tasks (T011–T018): all carry `[US1]`.
- US2 tasks (T019–T022): all carry `[US2]`.
- US3 tasks (T023–T025): all carry `[US3]`.
- US4 tasks (T026–T029): all carry `[US4]`.
- Native Swift tasks (T030–T033): no `[Story]` label (cross-cutting infra).
- Plugin tasks (T034–T037): no `[Story]` label.
- Manifest & registry tasks (T038–T039): no `[Story]` label.
- Polish tasks (T040–T044): no `[Story]` label.

Every task includes one or more concrete file paths and an Acceptance criterion. Tests precede their corresponding implementation tasks (TDD-friendly ordering per Constitution V).

