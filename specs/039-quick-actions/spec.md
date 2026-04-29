# Feature Specification: Quick Actions Module

**Feature Branch**: `039-quick-actions`
**Feature Number**: 039
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 9+ educational module showcasing **iOS Home Screen Quick Actions** — long-pressing the app icon on the Home Screen reveals up to 4 dynamic shortcuts that deep-link into the app via `expo-router`. Adds a "Quick Actions" card to the 006 iOS Showcase registry (`id: 'quick-actions-lab'`, `platforms: ['ios','android','web']`, `minIOS: '9.0'`). The screen presents: an Explainer card, a static actions list (read-only reference of `UIApplicationShortcutItems` injected by the config plugin), a Dynamic Actions Manager (add/remove/reorder runtime shortcuts subject to the iOS 4-item total cap including statics), a Last Invoked Action card (action type id, userInfo payload, timestamp), and a Reset button (clears dynamic, leaves statics). Config plugin `plugins/with-quick-actions/` injects `UIApplicationShortcutItems` (4 defaults) into Info.plist via `withInfoPlist`. Branch parent is `038-contacts`. Additive only: registry +1 entry, `app.json` `plugins` +1 entry (29 → 30).

---

## Quick Actions Reality Check (READ FIRST)

iOS Home Screen Quick Actions are governed by a few platform invariants that shape every design decision in this spec:

1. **Hard cap of 4 items total**. iOS displays at most **4 shortcut items** when the user long-presses the app icon. This 4 is a **combined total** of static (Info.plist `UIApplicationShortcutItems`) + dynamic (`UIApplication.shared.shortcutItems`) entries. Static items are shown first; dynamic items fill the remaining slots in order.
2. **No runtime permission**. Quick Actions require **no usage description** in Info.plist beyond the `UIApplicationShortcutItems` array itself. There is no permission prompt and no `Info.plist` `NSUsageDescription` key.
3. **Static actions are immutable at runtime**. Items defined under `UIApplicationShortcutItems` in Info.plist cannot be removed, reordered, or modified by the app at runtime — they are baked into the binary. Apps may **only mutate** the dynamic list via `UIApplication.shared.shortcutItems`.
4. **Cold-launch vs. warm-launch invocation**. When the user picks a quick action, iOS either (a) launches the app from terminated state passing the shortcut in `UIApplicationLaunchOptionsShortcutItemKey`, or (b) calls `application(_:performActionFor:completionHandler:)` on a backgrounded app. The community library `expo-quick-actions` exposes a single normalized event/listener surface for both paths.
5. **Hardware/OS gating**. Quick Actions on iOS work on **iOS 9+** and on **all modern iPhones** (the legacy 3D Touch dependency was removed when Haptic Touch replaced 3D Touch in iOS 13). The `minIOS: '9.0'` claim is conservative and accurate.
6. **Cross-platform**. Android has its own App Shortcuts API (`ShortcutManager`) which the `expo-quick-actions` library partially supports; this module **does not** demonstrate Android shortcuts beyond what the library supports automatically — the Android variant renders an `IOSOnlyBanner`. Web has no equivalent and renders an `IOSOnlyBanner`.

The 4-item cap and the static/dynamic split are repeated in the on-screen Explainer card, in `quickstart.md`, and in the Assumptions section below. The Dynamic Actions Manager UI MUST clamp the dynamic count to `max(0, 4 - staticCount)` so that adding a 5th item is impossible.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Long-press the app icon and see the 4 default static actions (Priority: P1)

A developer studying the spot iOS showcase builds the app to a physical iOS 9+ device (or simulator with Home Screen access). They press and hold the app icon on the Home Screen, and within ~0.5s a context menu appears showing **4 default shortcut items** matching what the config plugin injected into Info.plist:

1. **Open Liquid Glass** (subtitle "Material playground", icon `drop.fill`)
2. **Open Sensors** (subtitle "Motion & device data", icon `gauge`)
3. **Open Audio Lab** (subtitle "Recording demo", icon `mic.fill`)
4. **Add Mood: Happy** (subtitle "Quick journal entry", icon `face.smiling`)

**Why this priority**: This is the headline feature — the static Info.plist shortcuts are visible immediately after install with zero runtime configuration, and they validate the config plugin end-to-end. Without P1, no part of the module ships value.

**Independent Test**: Build and install the app on iOS 9+. From the Home Screen long-press the icon. Verify exactly the 4 items above appear, in order, with the documented titles, subtitles, and SF Symbol glyphs.

**Acceptance Scenarios**:

1. **Given** the app is freshly installed on iOS 9+ and has not yet launched, **When** the user long-presses the app icon on the Home Screen, **Then** iOS displays exactly 4 quick-action rows with the titles "Open Liquid Glass", "Open Sensors", "Open Audio Lab", "Add Mood: Happy" in that order.
2. **Given** the quick-action menu is open, **When** the user picks "Open Liquid Glass", **Then** the app launches (or foregrounds) and `expo-router` navigates to `/modules/liquid-glass-playground`.
3. **Given** the quick-action menu is open, **When** the user picks "Add Mood: Happy", **Then** the app launches (or foregrounds), navigates to `/modules/app-intents-lab`, and the Last Invoked Action card on the Quick Actions Lab screen records `{ type: 'add-mood-happy', userInfo: { route: '/modules/app-intents-lab', mood: 'happy' }, timestamp: <ISO> }`.

---

### User Story 2 — Open the Quick Actions Lab screen and inspect the static actions (Priority: P1)

The developer opens the Spot showcase, taps the "Quick Actions" card in the modules grid, and lands on the Quick Actions Lab screen. They see:

- An **Explainer card** describing what Home Screen Quick Actions are, the 4-item cap, the static-vs-dynamic distinction, and a one-line "How to test: long-press the app icon on the Home Screen".
- A **Static Actions list** (read-only) showing the 4 default actions with title, subtitle, SF Symbol icon, and the `userInfo.route` deep-link target. The list is non-interactive and labeled "Defined in Info.plist (read-only)".

**Why this priority**: The educational artifact must explain itself before any interaction. P1 because it grounds every other story in context.

**Independent Test**: Open the Quick Actions Lab screen. Verify the Explainer card text mentions the 4-item cap and the long-press gesture. Verify the Static Actions list renders 4 rows matching the config plugin defaults, with no edit/delete affordances.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Quick Actions Lab screen, **When** the screen renders, **Then** the Explainer card is visible at the top with prose describing Quick Actions, the 4-item cap, and the static/dynamic split, and a "How to test" hint.
2. **Given** the screen renders, **When** the StaticActionsList component mounts, **Then** it renders exactly 4 ActionRow children sourced from `default-actions.ts`, each showing title, subtitle, SF Symbol icon, and `userInfo.route`.
3. **Given** the StaticActionsList renders, **When** the user attempts to interact with a row (tap, long-press, swipe), **Then** the row does NOT show edit, delete, or reorder controls — it is purely informational.

---

### User Story 3 — Add and remove dynamic actions at runtime (Priority: P1)

The developer scrolls to the **Dynamic Actions Manager** card. It currently shows "0 of 0 dynamic actions" (because 4 statics already fill the cap). They tap "Add dynamic action", a small form appears (title, subtitle, SF Symbol name, route), they fill in `{ title: 'My Action', subtitle: 'Test', icon: 'star.fill', route: '/modules/haptics-playground' }` and tap Save. The system rejects the add with a banner "Cannot add: iOS allows max 4 actions total (4 static + 0 dynamic)". They then remove a static? — no, statics are immutable. They first reduce statics by editing app.json (out of band) and rebuilding — out of scope for runtime. Within the running session, they can only add dynamic actions when `staticCount + dynamicCount < 4`.

To make Story 3 testable in isolation, the demo provides a **"Simulate fewer statics" toggle** in the Dynamic Actions Manager that virtually reduces the static count for UI testing purposes (it does NOT change Info.plist; it only affects the dynamic-add validation logic and the displayed count). When the toggle is set to "Pretend 2 statics", the user can add up to 2 dynamic actions.

After adding two dynamic actions, the developer reorders them via up/down arrows on each row, removes one via a destructive button (with confirm), and verifies `UIApplication.shared.shortcutItems` (read back via `expo-quick-actions.getItems()` or equivalent) reflects the change.

**Why this priority**: Dynamic actions are the runtime-mutable half of the API and the part most apps actually ship. P1 because runtime mutation is the educational core.

**Independent Test**: Open the Dynamic Actions Manager. Toggle "Pretend 2 statics". Add two dynamic actions with distinct titles. Verify both appear in the dynamic list and that `getItems()` returns them in order. Reorder via the up/down arrows and verify order. Remove one and verify it disappears and `getItems()` reflects 1 entry.

**Acceptance Scenarios**:

1. **Given** the manager shows `staticCount = 4` and `dynamicCount = 0`, **When** the user taps "Add dynamic action", **Then** a banner reads "Cannot add: max 4 actions total (4 static + 0 dynamic)" and no form is opened.
2. **Given** the user toggles "Pretend 2 statics" so effective `staticCount = 2`, **When** the user taps "Add dynamic action" twice and saves both with valid input, **Then** the dynamic list shows 2 rows and `setItems()` (or library equivalent) is invoked with those 2 items.
3. **Given** 2 dynamic actions exist, **When** the user taps the up arrow on the second row, **Then** the row order swaps in the UI and `setItems()` is invoked with the new ordering.
4. **Given** 2 dynamic actions exist, **When** the user taps the destructive remove button on a row and confirms, **Then** the row is removed and `setItems()` is invoked with 1 item; cancelling the prompt MUST NOT mutate state.
5. **Given** the user toggles "Pretend 2 statics" and the dynamic list already has 2 entries, **When** the user taps "Add dynamic action", **Then** the cap message appears and no form is opened (clamp `dynamicCount <= 4 - effectiveStaticCount`).

---

### User Story 4 — Last Invoked Action card surfaces the launch payload (Priority: P2)

The developer terminates the app, long-presses the icon, picks "Add Mood: Happy", and the app cold-launches into `/modules/app-intents-lab`. They navigate to the Quick Actions Lab screen and see the **Last Invoked Action** card displaying `{ type: 'add-mood-happy', userInfo: { route: '/modules/app-intents-lab', mood: 'happy' }, timestamp: '2026-04-30T14:07:22.114Z' }`. They long-press the icon again, pick "Open Sensors", and after the app foregrounds the card updates to reflect the new invocation.

**Why this priority**: Surfacing the payload is essential for debugging deep-link flows and is part of the educational value. P2 because Stories 1-3 already deliver an MVP; this is observability sugar.

**Independent Test**: Cold-launch the app via "Add Mood: Happy". Navigate to the Lab screen and verify the Last Invoked Action card shows the documented payload. Background the app, long-press, pick a different action, foreground the app, verify the card updates within 1 second.

**Acceptance Scenarios**:

1. **Given** the app cold-launches via a quick action, **When** the Quick Actions Lab screen first renders, **Then** the Last Invoked Action card displays `type`, `userInfo` (as a formatted JSON block), and `timestamp` (ISO 8601, local timezone).
2. **Given** the app is in the foreground on the Lab screen, **When** the user backgrounds the app, long-presses the icon, and picks a different action, **Then** the card updates with the new invocation within 1 second of foregrounding.
3. **Given** the app has never been launched via a quick action this session, **When** the Lab screen renders, **Then** the card shows an empty state "No quick action invoked this session".
4. **Given** the action is `add-mood-happy`, **When** the screen handles the invocation, **Then** in addition to navigating to `/modules/app-intents-lab`, the module logs `{ mood: 'happy', source: 'quick-action' }` (e.g., to console or a session-scoped log array) so the App Intents Lab can demonstrate the cross-module side-effect.

---

### User Story 5 — Reset to defaults (Priority: P2)

The developer has accumulated a few dynamic actions and wants a clean slate. They tap **"Restore default static actions only"**. A confirmation prompt appears: "This will remove all dynamic actions. Static actions in Info.plist are unaffected. Continue?" They confirm and the dynamic list clears.

**Why this priority**: Reset is a usability convenience that matters for educational repeat-testing but is not blocking. P2.

**Independent Test**: Add 1+ dynamic actions. Tap the Reset button. Confirm. Verify the dynamic list is empty and `getItems()` returns `[]`. Verify the static list is unchanged.

**Acceptance Scenarios**:

1. **Given** the dynamic list has 1+ entries, **When** the user taps "Restore default static actions only" and confirms, **Then** `setItems([])` is invoked and the dynamic list renders empty.
2. **Given** the prompt is shown, **When** the user cancels, **Then** no mutation occurs and the dynamic list is unchanged.
3. **Given** the dynamic list is already empty, **When** the user taps the reset button, **Then** the button is either disabled or the confirm prompt shows but the no-op is clean.

---

### User Story 6 — Routing from a quick action invocation (Priority: P1)

When the user picks a quick action — static or dynamic — the app routes via `expo-router` to the `userInfo.route` value. For the 4 defaults, the routes are:

| Action title           | Route                                 |
|------------------------|---------------------------------------|
| Open Liquid Glass      | `/modules/liquid-glass-playground`    |
| Open Sensors           | `/modules/sensors-playground`         |
| Open Audio Lab         | `/modules/audio-lab`                  |
| Add Mood: Happy        | `/modules/app-intents-lab`            |

Routing happens at app launch (cold) or on `expo-quick-actions` action listener fire (warm). The app uses a single `useQuickActions` hook centralized in the lab module that subscribes to invocations and calls `router.navigate(userInfo.route)` for any action with a `userInfo.route` string. Actions without a recognized route fall through to a no-op (with a console warning in dev).

**Why this priority**: Without routing, quick actions are inert. P1.

**Independent Test**: For each of the 4 defaults, cold-launch via long-press → verify the app lands on the correct route. Then warm-launch via long-press while app is backgrounded → verify the route changes correctly.

**Acceptance Scenarios**:

1. **Given** the app is terminated, **When** the user picks "Open Sensors" from the Home Screen menu, **Then** the app cold-launches and `router.replace('/modules/sensors-playground')` is invoked once.
2. **Given** the app is backgrounded on the Modules grid, **When** the user picks "Open Audio Lab", **Then** the app foregrounds and `router.navigate('/modules/audio-lab')` is invoked.
3. **Given** a dynamic action with `userInfo.route = '/modules/haptics-playground'` is invoked, **When** the listener fires, **Then** `router.navigate('/modules/haptics-playground')` is invoked.
4. **Given** an action fires with no `userInfo.route` or an unrecognized one, **When** the listener fires, **Then** no navigation occurs and (in dev only) a `console.warn` is emitted with the action's `type`.

---

### User Story 7 — Cross-platform graceful degradation (Priority: P3)

A developer running the showcase on Android opens the Quick Actions Lab module and sees an `IOSOnlyBanner` explaining that Home Screen Quick Actions in this lab are an iOS-only educational artifact. All interactive cards are disabled. The same applies on web. The module is still **registered** for `['ios','android','web']` so the card remains visible across platforms.

**Why this priority**: Cross-platform visibility is required by the registry conventions, but the feature itself is iOS-focused. P3.

**Independent Test**: Run the app on Android — verify the IOSOnlyBanner is shown and all interactive controls are disabled. Run on web — same.

**Acceptance Scenarios**:

1. **Given** the app runs on Android, **When** the user opens the module, **Then** an `IOSOnlyBanner` is shown at the top of the screen, the StaticActionsList and DynamicActionsManager render in disabled state (or are replaced by a single "iOS only" placeholder), and no `expo-quick-actions` runtime calls fire.
2. **Given** the app runs on web, **When** the user opens the module, **Then** the same `IOSOnlyBanner` is shown and no native bridge calls fire.

---

### Edge Cases

1. **Cap exceeded by upstream config drift**: If a future Info.plist has more than 4 static items (e.g., a misconfiguration), the Static list MUST still render all of them but the Dynamic Actions Manager MUST treat `effectiveStaticCount = min(staticCount, 4)` for the cap math, and the Explainer must surface a warning ribbon "iOS will only display 4; review Info.plist".
2. **Cold-launch payload lost**: If the OS supplies the launch options dictionary but `expo-quick-actions.initial()` returns null (race condition), the Last Invoked Action card MUST show the empty state, not throw.
3. **SF Symbol missing on older iOS**: Some SF Symbols are iOS-version-gated. The defaults chosen (`drop.fill`, `gauge`, `mic.fill`, `face.smiling`) are all available on iOS 13+. On iOS 9-12 these may render as a placeholder; the module accepts this gracefully (no crash).
4. **Dynamic action with empty title**: The Add form MUST validate that `title` is non-empty before enabling Save; an empty title is rejected with an inline error.
5. **Reorder past list bounds**: The up arrow on the first row and the down arrow on the last row MUST be disabled (not just no-op) so the affordance is honest.
6. **Library returns undefined `userInfo`**: If a quick action carries no `userInfo` object, the routing layer MUST fall through to the no-op (per Story 6 AS#4) and log in dev only.
7. **Reset while listener mid-fire**: If the user hits Reset while a quick action is being processed, the navigation completes but the dynamic list clears post-navigation — Reset MUST NOT cancel an in-flight `router.navigate()`.
8. **App launched from icon (no quick action)**: The Last Invoked Action card MUST show "No quick action invoked this session" and `expo-quick-actions.initial()` MUST not crash when there is no launch shortcut.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register a new module entry `quickActionsLab` in `src/data/moduleRegistry.ts` with `id: 'quick-actions-lab'`, `platforms: ['ios','android','web']`, and `minIOS: '9.0'`.
- **FR-002**: The system MUST add a config plugin entry `./plugins/with-quick-actions` to `app.json` `plugins` (taking the count from 29 to 30).
- **FR-003**: The config plugin MUST inject 4 `UIApplicationShortcutItems` entries into Info.plist via `withInfoPlist`, matching the routes and metadata described in Story 6, idempotently (running the plugin twice MUST produce identical Info.plist output).
- **FR-004**: The Quick Actions Lab screen MUST render the Explainer, StaticActionsList, DynamicActionsManager, LastInvokedCard, and Reset button in that vertical order on iOS.
- **FR-005**: The StaticActionsList MUST render 4 read-only rows sourced from `default-actions.ts` (the same source-of-truth used by the config plugin).
- **FR-006**: The DynamicActionsManager MUST allow adding, removing, and reordering dynamic items, and MUST clamp `dynamicCount` to `max(0, 4 - effectiveStaticCount)`.
- **FR-007**: The DynamicActionsManager MUST display a "Pretend N statics" toggle (1, 2, 3, or 4) for testing the cap-clamp logic in isolation without rebuilding the binary.
- **FR-008**: The `useQuickActions` hook MUST subscribe to action invocations (cold and warm) via the chosen native bridge and MUST navigate via `expo-router` to the `userInfo.route` value when present, no-op otherwise.
- **FR-009**: The `add-mood-happy` action MUST, in addition to routing to `/modules/app-intents-lab`, log `{ mood: 'happy', source: 'quick-action', timestamp: <ISO> }` to a session-scoped store consumable by App Intents Lab.
- **FR-010**: The LastInvokedCard MUST display `type`, `userInfo` (formatted), and `timestamp` for the most recent invocation in this session, or an empty state otherwise.
- **FR-011**: The Reset button MUST clear all dynamic items via the bridge's `setItems([])` (or equivalent) after a confirmation prompt; statics MUST be untouched.
- **FR-012**: On Android and web, the module MUST render an `IOSOnlyBanner` and MUST NOT invoke any `expo-quick-actions` runtime API.
- **FR-013**: All bridge access MUST be wrapped behind `useQuickActions` and a thin `default-actions.ts` so tests can mock the bridge at the import boundary.
- **FR-014**: The module MUST contain ZERO `eslint-disable` directives.
- **FR-015**: The module MUST follow project conventions — `ThemedText` / `ThemedView`, `Spacing` scale, single quotes, `StyleSheet.create` only.
- **FR-016**: The change MUST be additive only — the registry gains 1 entry and `app.json` plugins gains 1 entry; no existing entries may be modified.

### Key Entities

- **QuickActionDefinition**: `{ type: string, title: string, subtitle?: string, iconName: string, userInfo: { route: string, [k: string]: unknown } }` — shape used for both static (Info.plist) and dynamic items. Single source of truth in `default-actions.ts`.
- **InvocationEvent**: `{ type: string, userInfo: Record<string, unknown>, timestamp: string }` — the payload surfaced by `LastInvokedCard`.
- **ManagerState**: `{ effectiveStaticCount: number (1..4), dynamicItems: QuickActionDefinition[] }` — local-only state of the Dynamic Actions Manager UI.

---

## Success Criteria

1. **Static actions visible**: Long-pressing the app icon on iOS 9+ reveals exactly the 4 documented quick actions in the documented order.
2. **Routing**: Each of the 4 defaults deep-links to the documented route via `expo-router`, in both cold-launch and warm-launch paths.
3. **Dynamic management**: Users can add, reorder, and remove dynamic actions; the 4-total cap is never violated; the "Pretend N statics" toggle correctly drives the clamp.
4. **Last invoked card**: Cold and warm invocations are reflected in the card within 1 second of the screen rendering or app foregrounding.
5. **Reset**: Reset clears the dynamic list without disturbing statics.
6. **Cross-platform**: Android and web render the `IOSOnlyBanner` and make no native calls.
7. **Plugin idempotency**: Running `with-quick-actions` twice produces byte-identical Info.plist output.
8. **Plugin count**: `app.json` plugins array goes from 29 to 30 entries; the existing plugin-count assertion in `plugins/with-mapkit/index.test.ts` is bumped from 29 to 30.
9. **Test coverage**: Unit tests cover `default-actions`, `useQuickActions`, every component, every screen variant (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`), the manifest, and the plugin (idempotency + plugin-count). All native bridges are mocked at the import boundary. No `eslint-disable` directives.
10. **Quality gate**: `pnpm check` passes green (typecheck, lint, format, tests) before commit.
11. **Constitution v1.1.0**: All constitution rules are satisfied — additive registry change, no rewrites of prior modules, conventions adhered to.

---

## Out of Scope

1. **Android App Shortcuts**: This module does not demonstrate Android `ShortcutManager` directly — Android renders the IOSOnlyBanner. Whatever Android support `expo-quick-actions` provides automatically is incidental, not validated by this module.
2. **3D Touch detection**: The module does not branch on 3D Touch vs Haptic Touch hardware; iOS handles the gesture transparently.
3. **Localized titles/subtitles**: Static titles are English literals in Info.plist. No `InfoPlist.strings` localization is added.
4. **Action icons from custom assets**: Only SF Symbols (system) and template images are supported; no bundled custom-icon asset is added in this iteration.
5. **Persistence of dynamic actions across launches**: iOS itself persists `UIApplication.shared.shortcutItems` between launches; the lab does not add any extra persistence layer (e.g., AsyncStorage).
6. **Notification-style action handling**: This module is strictly Home Screen quick actions. It does not duplicate Notification action handling (which is iOS UNNotification territory and out of scope).
7. **Watch / iPad multitasking shortcuts**: The module targets iPhone Home Screen only. iPad Slide Over and watchOS shortcuts are not addressed.

---

## Assumptions

1. **`expo-quick-actions` availability**: The community library `expo-quick-actions` is installable via `npx expo install expo-quick-actions` and exposes a stable surface for `setItems`, `getItems`, `initial()` (initial action at cold-launch), and an event listener (`addListener` or hook). If the library is unavailable or unstable at plan time, the research phase will document a fallback to a thin Swift bridge wrapping `UIApplication.shared.shortcutItems` and `application(_:performActionFor:completionHandler:)` in the AppDelegate.
2. **No new permission**: Quick Actions require no `Info.plist` `*UsageDescription` key; only the `UIApplicationShortcutItems` array is added.
3. **Config plugin runs at prebuild**: `plugins/with-quick-actions/` runs in the standard `withInfoPlist` modifier chain alongside the existing 29 plugins; no ordering constraints are introduced.
4. **iOS 9+ targets**: The project's deployment target is at or above iOS 9. SF Symbol availability on iOS 9-12 is partial; defaults render as placeholders if missing — this is acceptable.
5. **`expo-router` is the navigation source of truth**: The hook routes via the singleton `router` import from `expo-router`. There is no integration with React Navigation directly.
6. **No native code changes by hand**: The module is fully JS/TS plus a JS-only config plugin. Even if the fallback Swift bridge is needed, that is decided in `research.md` during plan phase, not in this spec.
7. **Mocking strategy**: All `expo-quick-actions` imports are mocked at the boundary in tests (`jest.mock('expo-quick-actions', ...)`). No native runtime is required to run the test suite.
8. **Plugin-count assertion location**: The existing project-wide plugin-count guard lives in `plugins/with-mapkit/index.test.ts` (asserting 29 plugins after 038). This spec assumes that file is the right place to bump 29 → 30; the plan/tasks phase will confirm the file path.
9. **Cross-module logging for `add-mood-happy`**: The session-scoped log written by the `add-mood-happy` action is a lightweight in-memory store (e.g., a Zustand store, a singleton, or `globalThis` dev hook) — the exact mechanism is decided in `plan.md`, not `spec.md`. The contract (FR-009) is what matters here.
10. **Reset confirm prompt**: An OS-native `Alert.alert` confirm dialog is sufficient — no custom modal is required.

---

## Dependencies

1. **`expo-quick-actions`** (community): Primary runtime bridge. Provides `setItems`, `getItems`, `initial()`, and an action listener. Installed via `npx expo install expo-quick-actions`.
2. **`expo-router`**: For `router.navigate` / `router.replace` deep-linking on action invocation.
3. **`@expo/config-plugins`**: For the `plugins/with-quick-actions/` config plugin (`withInfoPlist`).
4. **Project conventions**: `ThemedText`, `ThemedView`, `Spacing` scale, `IOSOnlyBanner` (already present from prior modules).
5. **Jest + @testing-library/react-native**: For unit tests.
6. **Existing module 006 registry**: `src/data/moduleRegistry.ts` — extended with one entry.
7. **Existing plugin-count test**: `plugins/with-mapkit/index.test.ts` — bumped from 29 to 30.

---

## Rollout Plan

**Phase 1: Scaffolding**
- Create `src/modules/quick-actions-lab/` with `index.tsx` (manifest), `default-actions.ts`, `hooks/useQuickActions.ts`, `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`, and component stubs: `ExplainerCard`, `StaticActionsList`, `DynamicActionsManager`, `ActionRow`, `LastInvokedCard`, `IOSOnlyBanner` (re-export or co-located).
- Create `plugins/with-quick-actions/` with `index.ts` and `index.test.ts`.
- Add `expo-quick-actions` to `package.json` (do not run `pnpm install` until after commit).

**Phase 2: TDD Implementation**
- Write tests for `default-actions.test.ts` → implement defaults.
- Write tests for `useQuickActions.test.tsx` → implement hook (cold-launch handling via `initial()`, listener subscription, route dispatch, mood-happy log side-effect, no-op for unknown actions).
- Write tests for each component → implement components.
- Write tests for each screen variant → implement screens.
- Write tests for the plugin (idempotency, exact `UIApplicationShortcutItems` shape) and bump the plugin-count assertion in `with-mapkit/index.test.ts` from 29 to 30 → implement plugin.
- Write a manifest test asserting registration shape.

**Phase 3: Integration**
- Append `quickActionsLab` entry to `src/data/moduleRegistry.ts`.
- Append `./plugins/with-quick-actions` to `app.json` `plugins` array (29 → 30).
- Run `pnpm check` (typecheck, lint, format, tests) — all green.

**Phase 4: Verification**
- Verify zero `eslint-disable` directives across new files.
- Verify additive-only diff (no edits to prior module files except the registry append, the `app.json` plugins append, and the plugin-count assertion bump).
- Verify constitution v1.1.0 compliance.
- Generate summary report.

---

## Open Questions *(none — approved autonomously)*

All design decisions follow the prior 038 Contacts module structure and the project conventions. The choice between `expo-quick-actions` and a hand-written Swift bridge is deferred to `research.md` in the plan phase per the feature description; this spec is library-choice-agnostic at the contract level.

---

**End of Specification**
