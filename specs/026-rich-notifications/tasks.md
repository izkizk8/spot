---
description: "Task list for feature 026: Notifications Lab Module (Rich Local Notifications)"
---

# Tasks: Notifications Lab Module

**Input**: Design documents from `/specs/026-rich-notifications/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: REQUIRED — every constant table, hook, component, screen variant, plugin, and manifest has an explicit unit test (plan §Test Strategy, spec FR-NL-020, Constitution Principle V).

**Organization**: Tasks are grouped by the plan's Implementation Phases (0–6). The plan defines no separate user-story phases — the single screen composes six cards that span FR-NL-005 → FR-NL-019, all delivered together as one shippable module. Per-task fields mirror the conventions of `specs/025-core-location/tasks.md` (T-numbering, [P] markers, exact file paths, RED→GREEN test pairing, dependencies).

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- All file paths are absolute repository-relative paths under the worktree root `C:\Users\izkizk8\spot-026-notifications`
- Colocated test convention: tests live under `src/modules/notifications-lab/__tests__/` (matches the plan's §Project Structure file tree and every prior in-tree module from 010 onward); the plugin test lives under `plugins/with-rich-notifications/index.test.ts`.

---

## Phase 1: Setup (Plan Phase 0 — Shared Infrastructure)

**Purpose**: Install the new dependency, drop the bundled assets, scaffold the module + plugin directories. No business logic yet.

- [ ] T001 Install `expo-notifications` via SDK-aligned resolver: run `npx expo install expo-notifications` in the repo root so `package.json` and `pnpm-lock.yaml` pick the SDK 55 selection (plan §Technical Context, §Dependency Table, NFR-NL-003). Do NOT hand-edit the version range. Verify `expo-task-manager` (added by 025) and `expo-location` (added by 024) are unchanged.
- [ ] T002 [P] Create the module directory tree at `src/modules/notifications-lab/` with empty placeholder subdirs `components/`, `hooks/`, `__tests__/`, `__tests__/hooks/`, and `__tests__/components/`. Do not create any source files yet — subsequent tasks own them.
- [ ] T003 [P] Create the plugin directory at `plugins/with-rich-notifications/` with `package.json` containing `{ "name": "with-rich-notifications", "version": "0.0.0", "main": "index.ts", "types": "index.ts" }`. Plugin source file (`index.ts`) is created in T013. Plugin test file (`index.test.ts`) is created in T011.
- [ ] T004 [P] Place the four bundled assets under `assets/notifications/` per plan §Project Structure: `sample-1.png` (PNG, ≤ 100 KB), `sample-2.png` (PNG, ≤ 100 KB), `sample-3.jpg` (JPEG, ≤ 100 KB), and `sample-sound.caf` (Core Audio Format, ≤ 30 KB, < 30 s — see R8). Do NOT modify any prior assets dir.
- [ ] T005 **Checkpoint commit**: `chore(026): install expo-notifications, scaffold module/plugin dirs, drop bundled assets`.

---

## Phase 2: Foundational (Test Mocks + Setup Wiring)

**Purpose**: Install the `expo-notifications` mock at the import boundary and wire it through `test/setup.ts`. MUST complete before any test in Phases 3–6 can run.

**⚠️ CRITICAL**: No subsequent test task can start until Phase 2 is complete.

- [ ] T006 Create `test/__mocks__/expo-notifications.ts` exposing the full surface listed in plan §Project Structure → `test/__mocks__/`: `getPermissionsAsync`, `requestPermissionsAsync`, `setNotificationCategoriesAsync`, `scheduleNotificationAsync`, `cancelScheduledNotificationAsync`, `cancelAllScheduledNotificationsAsync`, `getAllScheduledNotificationsAsync`, `getPresentedNotificationsAsync`, `dismissNotificationAsync`, `dismissAllNotificationsAsync`, `addNotificationReceivedListener`, `addNotificationResponseReceivedListener`, `getLastNotificationResponseAsync`, `setNotificationChannelAsync`, plus the `AndroidImportance` enum. Each function is a `jest.fn()`. Expose test-only helpers `__triggerReceived(notification)`, `__triggerResponse(response)`, `__setPermissionsMock(state)`, `__setScheduledMock(list)`, `__setPresentedMock(list)`, `__setLastResponseMock(response | null)`, `__reset()`. Pure JS, no native imports. (plan §Mocks)
- [ ] T007 Extend `test/setup.ts` by adding ONE new `jest.mock('expo-notifications', () => jest.requireActual('./__mocks__/expo-notifications'))` line directly next to the existing `expo-location` and `expo-task-manager` mock entries. Do NOT touch the `expo-modules-core` block (see comment at `test/setup.ts:87-90` carried forward from 024 / 025). Do NOT modify any other mock. Diff must be exactly +1 functional line plus any necessary import shuffle.
- [ ] T008 Verify the empty-feature baseline is green by running `pnpm check` from the repo root. The new mock exists but is not yet referenced by any source file; the only delta from main is `package.json` / `pnpm-lock.yaml` (T001), the four asset files (T004), `test/__mocks__/expo-notifications.ts` (T006), and the +1 line in `test/setup.ts` (T007). Zero new failures permitted (plan §Phase 0 exit gate).
- [ ] T009 **Checkpoint commit**: `feat(026): foundational expo-notifications mock + test/setup.ts wiring`.

**Checkpoint**: Foundation ready — Phase 3 (plugin) and Phase 4 (catalogs + hook) may now begin.

---

## Phase 3: Plugin (Plan Phase 1 — `with-rich-notifications`)

**Purpose**: Build the config plugin and append it to `app.json`'s `plugins` array. Plugin idempotency, Info.plist coexistence, the `expo-notifications` block registration, and the Android default-channel `<meta-data>` declaration are unit-tested.

### Tests for Plugin (write FIRST, ensure they FAIL)

- [ ] T010 Write `plugins/with-rich-notifications/index.test.ts` covering all 9 plan §Test Strategy → "Plugin test" cases. Initially the test file targets cases **1, 2, 3, 4, 9** (the cases that do NOT depend on `app.json` containing `'./plugins/with-rich-notifications'` yet — those are cases 7 and 8 and are revisited in T020):
  1. Adds `NSUserNotificationsUsageDescription` with the documented copy when absent; leaves it unchanged on re-run (idempotent guard).
  2. Registers the `expo-notifications` plugin block exactly once even when run twice (dedupe by plugin name; assert against `config.plugins` length and contents).
  3. Adds the Android `<meta-data>` `expo.modules.notifications.default_notification_channel_id = 'spot.default'` exactly once even when run twice.
  4. Idempotent: running twice produces a structurally equal `ExpoConfig` (deep-equal assertion).
  5. Coexists with 014's `with-home-widgets`: folding 014's plugin then `withRichNotifications` over a baseline config leaves 014's widget Info.plist entries intact and adds `NSUserNotificationsUsageDescription`.
  6. Coexists with 025's `with-core-location`: folding `withCoreLocation` then `withRichNotifications` leaves the two location-usage description keys and `'location'` in `UIBackgroundModes` intact and adds the notifications entries.
  9. Emits no `console.warn` calls on a baseline config (spy on `console.warn`; assert call count is 0).

  Each case must FAIL initially because `plugins/with-rich-notifications/index.ts` does not yet exist. (plan §Test Strategy → Plugin test)

### Implementation for Plugin

- [ ] T011 Implement `plugins/with-rich-notifications/index.ts` per plan §Plugin Contract: chained `withInfoPlist` → `withPlugins` → `withAndroidManifest`. Constants `USAGE_KEY = 'NSUserNotificationsUsageDescription'`, `USAGE_COPY` from plan §Plugin Contract verbatim, `ANDROID_CHANNEL_ID = 'spot.default'`, `ANDROID_CHANNEL_NAME = 'Default'`. Idempotent guards: `mod.modResults[USAGE_KEY] !== USAGE_COPY` for the Info.plist write, dedupe-by-name inside `withPlugins`, and `app['meta-data'].some(...)` for the channel id `<meta-data>`. Default export `withRichNotifications`. Make T010 cases 1, 2, 3, 4, 9 pass. (depends on T003)
- [ ] T012 Append `'./plugins/with-rich-notifications'` to the `plugins` array in `app.json` per plan §`app.json` Update — Exact Change. Insertion position: immediately after `'./plugins/with-core-location'` and before the inline `["expo-sensors", { ... }]` configured-array entry. Diff MUST be exactly +1 array entry. No other plugin entry may be modified or removed. (FR-NL-002, plan §`app.json` Update)
- [ ] T013 Re-run `plugins/with-rich-notifications/index.test.ts` cases 5 and 6 from T010 to confirm coexistence with 014's `with-home-widgets` and 025's `with-core-location` is wired correctly now that `T011` is implemented. (Cases 7 and 8 are deferred to T020.)
- [ ] T014 Run `npx expo prebuild --clean` once locally as a smoke check (NFR-NL-004) to confirm the plugin chain resolves without throwing on a real Expo config. Do not commit any prebuild artifacts. Note the result in the implementation PR description but do not gate the phase on it (plan §Phase 1, not part of CI).
- [ ] T015 **Checkpoint commit**: `feat(026): with-rich-notifications plugin + app.json plugins +1 entry`.

**Checkpoint**: Plugin is functional and idempotency-tested. The `app.json` change is in place; the plugin is included in every prebuild from now on.

---

## Phase 4: Catalogs + Hook (Plan Phase 2)

**Purpose**: Constant tables (`categories.ts`, `interruption-levels.ts`, `bundled-attachments.ts`), the `types.ts` entities file, and the `useNotificationCenter` hook that owns every `Notifications.*` API surface this module touches.

### Tests for Catalogs + Hook (write FIRST, ensure they FAIL)

- [ ] T016 [P] Write `src/modules/notifications-lab/__tests__/categories.test.ts` covering plan §Test Strategy → `categories.test.ts`: exactly 3 entries with ids `'yes-no' | 'snooze-done' | 'reply-text'`; `yes-no` actions are `yes` (`foreground: true`) and `no` (`destructive: true`); `snooze-done` actions are `snooze` (`foreground: false`) and `done` (`foreground: true`); `reply-text` actions are `reply` with `input.placeholder === 'Reply…'` and `input.buttonTitle === 'Send'`, plus `dismiss` (`destructive: true`); all action ids within a category are unique; `DEFAULT_CATEGORY_ID === null`. Test MUST fail (file not yet created).
- [ ] T017 [P] Write `src/modules/notifications-lab/__tests__/interruption-levels.test.ts` covering plan §Test Strategy → `interruption-levels.test.ts`: exactly 4 entries in the documented order (`passive`, `active`, `time-sensitive`, `critical`); `passive` and `active` have `requiresEntitlement === false` and fall back to themselves; `time-sensitive` and `critical` have `requiresEntitlement === true` and `fallbackLevel === 'active'`; `time-sensitive`'s `copy` mentions "time-sensitive" entitlement; `critical`'s `copy` mentions "Critical Alerts"; `DEFAULT_INTERRUPTION_LEVEL === 'active'`. Test MUST fail.
- [ ] T018 [P] Write `src/modules/notifications-lab/__tests__/bundled-attachments.test.ts` covering plan §Test Strategy → `bundled-attachments.test.ts`: exactly 3 entries with unique ids `sample-1`, `sample-2`, `sample-3`; each `requireAsset` is a number (RN module id) ≠ 0; `mimeType ∈ {'image/png','image/jpeg'}` and matches the per-entry value (`sample-1` and `sample-2` are PNG, `sample-3` is JPEG); `DEFAULT_ATTACHMENT_ID === null`. Test MUST fail.

### Implementation for Catalogs

- [ ] T019 [P] Implement `src/modules/notifications-lab/categories.ts` per plan §Architecture → Constant tables (`categories.ts`): export `CategoryId`, `CategoryAction`, `CategoryDefinition`, `CATEGORIES`, `DEFAULT_CATEGORY_ID`. All copy verbatim from the plan code block. Make T016 pass.
- [ ] T020 [P] Implement `src/modules/notifications-lab/interruption-levels.ts` per plan §Architecture → Constant tables (`interruption-levels.ts`): export `InterruptionLevel`, `InterruptionLevelMeta`, `INTERRUPTION_LEVELS`, `DEFAULT_INTERRUPTION_LEVEL`. The `copy` strings for `time-sensitive` and `critical` use the verbatim text from the plan code block. Make T017 pass.
- [ ] T021 [P] Implement `src/modules/notifications-lab/bundled-attachments.ts` per plan §Architecture → Constant tables (`bundled-attachments.ts`): export `BundledAttachment`, `BUNDLED_ATTACHMENTS`, `DEFAULT_ATTACHMENT_ID`. Each entry uses `require()` against `@/assets/notifications/sample-{1,2,3}.{png,png,jpg}`. Make T018 pass. (depends on T004)

### Shared types (entities)

- [ ] T022 Create `src/modules/notifications-lab/types.ts` exporting `PermissionsState`, `TriggerSpec`, `ComposeDraft`, `PendingNotification`, `DeliveredNotification`, `NotificationEvent` per plan §Architecture → Entities. Type-only file; no runtime exports. Re-exports `CategoryId` from `./categories` and `InterruptionLevel` from `./interruption-levels` so consumers import a single type module.

### Tests for the hook (write FIRST, ensure they FAIL)

- [x] T023 Write `src/modules/notifications-lab/__tests__/hooks/useNotificationCenter.test.tsx` covering every behavior listed in plan §Test Strategy → "Hook test — `useNotificationCenter.test.tsx`":
  - **Mount**: registers categories exactly once across remount-mount-remount (module-scope `__categoriesRegistered` flag); attaches both listeners exactly once; consults `getLastNotificationResponseAsync()` and replays a non-null result into the event log as an `action-response`.
  - **`request()`**: calls `requestPermissionsAsync` with `allowAlert/allowBadge/allowSound: true`; success maps `permissions.status === 'authorized'`. **`request({ provisional: true })`**: passes `allowProvisional: true` and surfaces `permissions.status === 'provisional'`.
  - **Permission-path branches**: each of `denied`, `notDetermined`, `provisional`, `authorized`, `ephemeral` round-trips through `__setPermissionsMock` to the expected `PermissionsState` shape.
  - **`schedule()` per trigger kind** (assert against the `scheduleNotificationAsync` call args): `Immediate` → `trigger === null`; `In N seconds` → `{ seconds: N, repeats: false }`; `At specific time` → `{ date }`; `Daily at time` → `{ hour, minute, repeats: true }`; `On region entry` → trigger object includes a region with `identifier` matching `/^spot-geofence-[0-9a-f-]{36}$/`, `notifyOnEnter: true`, `notifyOnExit: false`, the supplied radius/lat/lng.
  - **`schedule()` with attachment**: `content.attachments[0].url` is the resolved asset URI (mock `Image.resolveAssetSource` to return a deterministic path).
  - **`cancel(id)`** → `cancelScheduledNotificationAsync(id)` then `refresh`. **`cancelAll()`** → `cancelAllScheduledNotificationsAsync`. **`remove(id)`** → `dismissNotificationAsync(id)`. **`clearAll()`** → `dismissAllNotificationsAsync`.
  - **`__triggerReceived`** appends a `received` event; **`__triggerResponse`** appends an `action-response` with `actionIdentifier` and `textInput` correctly extracted; iOS `UNNotificationDismissActionIdentifier` appends a `dismissed` event.
  - **Event-log cap (FR-NL-018)**: pushing 21 events evicts the oldest; `events.length === 20`.
  - **Listener cleanup**: unmount calls `.remove()` on every subscription returned by `add*Listener`.
  - **mountedRef**: pushing an event after unmount does not warn about `setState` after unmount.
  - **Android branch** (`Platform.OS === 'android'` mocked): mount calls `setNotificationChannelAsync('spot.default', { name: 'Default', importance: AndroidImportance.DEFAULT })` exactly once across remount-mount-remount (module-scope `__defaultChannelRegistered` flag); `schedule()` includes `content.channelId === 'spot.default'` (FR-NL-015).
  - **`invokeAction()`**: synthesises an `action-response` event without invoking any `Notifications.*` API (assert zero mock calls during the action).
  - **Quota error on region trigger** (R7): `startGeofencingAsync` rejecting with a quota-shaped error surfaces a non-blocking `error` on the hook with the documented copy substring `'Geofence quota reached'`.
  - **Cold-launch replay one-shot** (R6): module-scope memo prevents re-replaying on remount.

  Test MUST fail (hook not yet created).

### Implementation for the hook

- [x] T024 Implement `src/modules/notifications-lab/hooks/useNotificationCenter.ts` per plan §Architecture → `useNotificationCenter` and §Trigger Translation (FR-NL-014):
  - State shape `UseNotificationCenter` exactly as documented in plan §Architecture.
  - **Mount**: idempotent `setNotificationCategoriesAsync(CATEGORIES)` guarded by module-scope `__categoriesRegistered`; on Android, idempotent `setNotificationChannelAsync('spot.default', ...)` guarded by `__defaultChannelRegistered`; attach `addNotificationReceivedListener` + `addNotificationResponseReceivedListener`; one-shot replay of `getLastNotificationResponseAsync()` memoised on `__lastResponseReplayed`.
  - **`request({ provisional? })`** → `requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true, allowCriticalAlerts: false, allowProvisional: !!provisional, provideAppNotificationSettings: true } })`; map result to `PermissionsState`.
  - **`schedule(draft)`** → translate `draft.trigger` per the §Trigger Translation table; build `NotificationContentInput` with `title`, `subtitle`, `body`, `sound` (mapped from `soundId`), `badge`, `categoryIdentifier` (when set), `interruptionLevel` (iOS only), `threadIdentifier`; if `draft.attachmentId` is set, resolve via `Image.resolveAssetSource(BUNDLED_ATTACHMENTS[i].requireAsset).uri` and pass as `attachments[0]`; on Android, set `channelId: 'spot.default'`; for `on-region-entry` synth a `spot-geofence-${uuid}` identifier; call `scheduleNotificationAsync({ content, trigger })`; on success call `refresh()` and return the identifier; on quota error surface the documented inline error.
  - **`cancel`/`cancelAll`/`remove`/`clearAll`** → thin wrappers, each followed by `refresh()`.
  - **`refresh()`** → `Promise.all([getAllScheduledNotificationsAsync(), getPresentedNotificationsAsync()])`; project results; call `setState` only when `mountedRef.current === true`.
  - **Event ingestion** → push into a FIFO log capped at 20 (FR-NL-018); map `UNNotificationDismissActionIdentifier` to a `dismissed` kind; map other responses to `action-response` with `actionIdentifier` and `userText`.
  - **`invokeAction(args)`** → push a synthetic `action-response` event; do NOT call any `Notifications.*` API.
  - **Unmount** → `.remove()` every subscription; `mountedRef.current = false`.
  - **Errors** → captured into `error`.

  Make T023 pass. (depends on T019, T020, T021, T022)
- [x] T025 **Checkpoint commit**: `feat(026): catalogs (categories/interruption-levels/bundled-attachments) + types + useNotificationCenter hook`.

**Checkpoint**: Phase 2 (plan) is complete — every constant table and the single hook are green. Components in Phase 5 may now begin in parallel.

---

## Phase 5: Components (Plan Phase 3)

**Purpose**: The 9 leaf components — each takes its data through props (the hook is wired by the screen variant in Phase 6). This keeps each component test pure and deterministic.

### Tests for Components (write FIRST, ensure they FAIL)

- [x] T026 [P] Write `src/modules/notifications-lab/__tests__/components/PermissionsCard.test.tsx` per plan §Test Strategy → `PermissionsCard`: status pill renders the current status string for all 5 statuses (`notDetermined`, `provisional`, `authorized`, `denied`, `ephemeral`); per-setting indicators (`alerts`, `sounds`, `badges`, `criticalAlerts`, `timeSensitive`) reflect the booleans; `timeSensitive` indicator reads `'n/a'` when the prop is `null`; Request button calls `onRequest()`; "Request provisional" calls `onRequest({ provisional: true })`; Open Settings link calls `Linking.openSettings()` (mocked at the import boundary). Test MUST fail.
- [x] T027 [P] Write `src/modules/notifications-lab/__tests__/components/ComposeForm.test.tsx` per plan §Test Strategy → `ComposeForm`: every required field is present (title, subtitle, body, attachment, threadId, sound, interruption-level segmented control, badge stepper, category, trigger); submit button reads `'Schedule'` and is disabled when `permissionStatus ∈ {'denied','notDetermined'}` with "Permission required" copy; remains enabled when `provisional` with quiet-delivery note; selecting `time-sensitive` or `critical` shows the inline entitlement notice (R1, R2 copy); submission with empty `title` is rejected (validation copy renders); badge stepper clamps to `0..99`; the iOS-only-fields disclosure banner is rendered when `Platform.OS === 'android'` (mocked). Test MUST fail.
- [x] T028 [P] Write `src/modules/notifications-lab/__tests__/components/TriggerPicker.test.tsx` per plan §Test Strategy → `TriggerPicker`: 5 segments render in the documented order (Immediate / In N seconds / At specific time / Daily at time / On region entry); switching segments swaps the per-kind subform; the `In N seconds` subform validates `N >= 1`; the `On region entry` segment is disabled when `locationAuthorized === false` with the per-segment tooltip copy. Test MUST fail.
- [x] T029 [P] Write `src/modules/notifications-lab/__tests__/components/AttachmentPicker.test.tsx` per plan §Test Strategy → `AttachmentPicker`: None + 3 thumbnails render; tapping a thumbnail calls `onSelect(id)`; tapping None calls `onSelect(null)`; selected thumbnail has the documented selected-state styling. Test MUST fail.
- [x] T030 [P] Write `src/modules/notifications-lab/__tests__/components/CategoriesCard.test.tsx` per plan §Test Strategy → `CategoriesCard`: 3 categories render with their action ids and titles; the text-input flag is shown for `reply-text` only; "Open last fired notification's actions" is disabled with the documented tooltip when `lastReceived === null`; enabled tap opens an in-app sheet listing the matching category's actions; tapping an action invokes `onInvokeAction(actionId, textInput?)`. Test MUST fail.
- [x] T031 [P] Write `src/modules/notifications-lab/__tests__/components/PendingList.test.tsx` per plan §Test Strategy → `PendingList`: given N rows, renders N matching rows (id + title + triggerSummary + Cancel button); empty state copy renders when `pending` is empty; Cancel calls `onCancel(id)`; "Cancel all" calls `onCancelAll()`. Test MUST fail.
- [x] T032 [P] Write `src/modules/notifications-lab/__tests__/components/DeliveredList.test.tsx` per plan §Test Strategy → `DeliveredList`: given N rows, renders N matching rows (id + title + deliveredAt timestamp + Remove button); empty state copy; Remove calls `onRemove(id)`; "Clear all" calls `onClearAll()`. Test MUST fail.
- [x] T033 [P] Write `src/modules/notifications-lab/__tests__/components/EventLog.test.tsx` per plan §Test Strategy → `EventLog`: given `events`, renders one row per event with rendered timestamp; per-kind formatting differs (the `action-response` row shows `actionIdentifier` and any `textInput`); empty state copy renders for empty `events`; given >20 events (defensive), renders the most-recent 20 (FR-NL-018). Test MUST fail.
- [x] T034 [P] Write `src/modules/notifications-lab/__tests__/components/IOSOnlyBanner.test.tsx` per plan §Test Strategy → `IOSOnlyBanner`: renders per-`reason` copy for all 6 reasons (`'permissions'`, `'categories'`, `'pending'`, `'delivered'`, `'compose-fields'`, `'web-fallback'`); each copy is non-empty and unique. Test MUST fail.

### Implementation for Components

- [x] T035 [P] Implement `src/modules/notifications-lab/components/IOSOnlyBanner.tsx` per plan §Project Structure → `IOSOnlyBanner.tsx`: per-`reason` copy table for all 6 reasons; themed via `ThemedText` / `ThemedView`; `StyleSheet.create()` only. Make T034 pass.
- [x] T036 [P] Implement `src/modules/notifications-lab/components/EventLog.tsx` per plan §Project Structure → `EventLog.tsx`: FIFO log renderer capped at 20 entries; per-row formatting per event kind (`'received'` / `'action-response'` with action id + text input / `'dismissed'`); empty-state copy. `StyleSheet.create()`. Make T033 pass.
- [x] T037 [P] Implement `src/modules/notifications-lab/components/PermissionsCard.tsx` per plan §Project Structure → `PermissionsCard.tsx`: status pill, per-setting indicators including `'n/a'` for `timeSensitive === null`, Request button, "Request provisional" button, Open Settings link via `Linking.openSettings()`. `ThemedText` / `ThemedView`, `Spacing` scale, `StyleSheet.create()`. Make T026 pass.
- [x] T038 [P] Implement `src/modules/notifications-lab/components/AttachmentPicker.tsx` per plan §Project Structure → `AttachmentPicker.tsx`: None + 3 thumbnails sourced from `BUNDLED_ATTACHMENTS`; resolves the selected asset's file URI via `Image.resolveAssetSource` for the `UNNotificationAttachment` payload (this resolution is consumed by the hook in T024, not in the component itself — the component just emits the `id`). `StyleSheet.create()`. Make T029 pass. (depends on T021)
- [x] T039 [P] Implement `src/modules/notifications-lab/components/TriggerPicker.tsx` per plan §Project Structure → `TriggerPicker.tsx`: 5-segment selector (Immediate / In N seconds / At specific time / Daily at time / On region entry) + per-kind subform (seconds spinner with `min=1` validation, date picker, hour+minute picker, lat/lng + 50/100/500 radius). On region entry disabled when `locationAuthorized === false` with tooltip copy. `StyleSheet.create()`. Make T028 pass.
- [x] T040 [P] Implement `src/modules/notifications-lab/components/PendingList.tsx` per plan §Project Structure → `PendingList.tsx`: rows (id + title + triggerSummary + Cancel button) + "Cancel all" action; empty-state copy. `StyleSheet.create()`. Make T031 pass.
- [x] T041 [P] Implement `src/modules/notifications-lab/components/DeliveredList.tsx` per plan §Project Structure → `DeliveredList.tsx`: rows (id + title + deliveredAt + Remove button) + "Clear all" action; empty-state copy. `StyleSheet.create()`. Make T032 pass.
- [x] T042 [P] Implement `src/modules/notifications-lab/components/CategoriesCard.tsx` per plan §Project Structure → `CategoriesCard.tsx`: read-only list of the 3 demo categories sourced from `CATEGORIES` (id, action ids, titles, text-input flag); "Open last fired notification's actions" button disabled with tooltip when `lastReceived === null`; in-app sheet that replays the last-received notification's category buttons; tapping an action invokes `onInvokeAction`. `StyleSheet.create()`. Make T030 pass. (depends on T019)
- [x] T043 Implement `src/modules/notifications-lab/components/ComposeForm.tsx` per plan §Project Structure → `ComposeForm.tsx`: title / subtitle / body inputs with non-empty-title validation; embeds `AttachmentPicker`; threadId input; sound picker (`'none' | 'default' | 'custom-bundled'`); interruption-level segmented control sourced from `INTERRUPTION_LEVELS` with inline entitlement notice for `time-sensitive` and `critical` (R1, R2 copy); badge stepper clamped `0..99`; category picker sourced from `CATEGORIES`; embeds `TriggerPicker`; Schedule button — disabled with "Permission required" copy when `permissionStatus ∈ {'denied','notDetermined'}`, enabled with quiet-delivery note when `provisional`; iOS-only-fields disclosure banner via `<IOSOnlyBanner reason="compose-fields" />` when `Platform.OS === 'android'`. `StyleSheet.create()`. Make T027 pass. (depends on T020, T021, T035, T038, T039, T042)
- [x] T044 **Checkpoint commit**: `feat(026): 9 components (Permissions/Compose/Trigger/Attachment/Categories/Pending/Delivered/EventLog/IOSOnlyBanner) + tests`.

**Checkpoint**: All 9 components are green and pure-leaf; the screen variants in Phase 6 wire them to the hook.

---

## Phase 6: Screens + Manifest (Plan Phase 4)

**Purpose**: The three screen variants (iOS / Android / web) and the module manifest. Each screen variant composes the hook from Phase 4 with the components from Phase 5.

### Tests for Screens + Manifest (write FIRST, ensure they FAIL)

- [x] T045 [P] Write `src/modules/notifications-lab/__tests__/manifest.test.ts` per plan §Test Strategy → `manifest.test.ts`: `id === 'notifications-lab'`, `label === 'Notifications Lab'`, `platforms === ['ios','android','web']`, `minIOS === '10.0'`, `screen` is a function/component reference. Test MUST fail.
- [x] T046 [P] Write `src/modules/notifications-lab/__tests__/screen.test.tsx` (iOS) per plan §Test Strategy → `screen.test.tsx`: mounts; all 6 cards present (PermissionsCard, ComposeForm, CategoriesCard, PendingList, DeliveredList, EventLog); expanding/collapsing each card preserves the state of the others (per-card collapse state held in screen-local state, not persisted across navigations — FR-NL-017); PermissionsCard, CategoriesCard, PendingList, DeliveredList all render their functional variants (not the banner). Test MUST fail.
- [x] T047 [P] Write `src/modules/notifications-lab/__tests__/screen.android.test.tsx` per plan §Test Strategy → `screen.android.test.tsx`: only ComposeForm and EventLog render functional variants; the other 4 slots render `IOSOnlyBanner` with the documented per-slot reason (`'permissions'`, `'categories'`, `'pending'`, `'delivered'`); ComposeForm contains the iOS-only-fields disclosure banner (`<IOSOnlyBanner reason="compose-fields" />`); the `expo-notifications` Android-incompatible APIs are not invoked (assert no calls to `setNotificationCategoriesAsync` from this variant — categories are an iOS surface). Test MUST fail.
- [x] T048 [P] Write `src/modules/notifications-lab/__tests__/screen.web.test.tsx` per plan §Test Strategy → `screen.web.test.tsx`: only ComposeForm (reduced to title + body + Immediate trigger) and EventLog render functional variants; the other 4 slots render `IOSOnlyBanner` (`'web-fallback'` for one of them per plan §Web Fallback Strategy); submission invokes `globalThis.Notification` (mocked in `beforeEach`) and synthesises a `received` event-log entry; if `Notification.permission === 'default'`, the Request flow calls `Notification.requestPermission()`; if `Notification.permission === 'denied'`, the button is disabled with "Reset notification permission in your browser settings" copy (R3); no `expo-notifications` API is referenced at runtime — assert this by spying on every export of the mocked module and verifying call count is 0 (FR-NL-016, FR-NL-019). Test MUST fail.

### Implementation for Screens + Manifest

- [x] T049 [P] Implement `src/modules/notifications-lab/index.tsx` per plan §Project Structure → `index.tsx`: export the `ModuleManifest` with `id 'notifications-lab'`, `label 'Notifications Lab'`, icon `'bell.badge.fill'`, `platforms ['ios','android','web']`, `minIOS '10.0'`, `screen` resolved via the existing module convention (platform-aware import). Make T045 pass.
- [x] T050 [P] Implement `src/modules/notifications-lab/screen.tsx` (iOS) per plan §Project Structure → `screen.tsx`: composes the 6 collapsible cards in order — `PermissionsCard`, `ComposeForm`, `CategoriesCard`, `PendingList`, `DeliveredList`, `EventLog`. Wires `useNotificationCenter`. Per-card collapse state held in screen-local state (FR-NL-017 — not persisted across navigations). Make T046 pass. (depends on T024, T037, T040, T041, T042, T043, T036)
- [x] T051 [P] Implement `src/modules/notifications-lab/screen.android.tsx` per plan §Project Structure → `screen.android.tsx`: same shell as `screen.tsx` but `PermissionsCard`, `CategoriesCard`, `PendingList`, `DeliveredList` slots render `<IOSOnlyBanner reason="..." />` with the matching per-slot reason; ComposeForm renders with iOS-only fields hidden behind the `<IOSOnlyBanner reason="compose-fields" />` disclosure (handled inside `ComposeForm` itself when `Platform.OS === 'android'`, see T043); EventLog renders functionally; `useNotificationCenter` is wired so the hook's Android branch (`spot.default` channel registration, `channelId` on outgoing notifications — FR-NL-015) executes. Make T047 pass. (depends on T024, T035, T036, T043)
- [x] T052 [P] Implement `src/modules/notifications-lab/screen.web.tsx` per plan §Project Structure → `screen.web.tsx` and §Web Fallback Strategy: the four non-functional slots render `<IOSOnlyBanner reason="..." />`; ComposeForm is rendered in a reduced form (title + body + Immediate trigger only); EventLog renders functionally. Submission goes through the local `fireWebNotification` helper (defined in this file per plan §Web Fallback Strategy code block) which calls `globalThis.Notification` and appends a synthetic `received` event to a screen-local event store — **does not** invoke any `expo-notifications` API at runtime (FR-NL-016, FR-NL-019). Feature-detect `globalThis.Notification`; if absent, the Compose button is disabled with "Notifications not supported in this browser" copy. Make T048 pass.
- [x] T053 **Checkpoint commit**: `feat(026): screens (ios/android/web) + manifest + tests`.

**Checkpoint**: The module is fully self-contained — every file under `src/modules/notifications-lab/` is green. The integration steps in Phase 7 wire it into the app shell.

---

## Phase 7: Wiring (Plan Phase 5 — Registry + `app.json` Manifest Test)

**Purpose**: Single-line additive integrations into `src/modules/registry.ts` (the `app.json` `plugins` change was already made in T012 alongside the plugin file). Then add the `app.json` manifest test asserting the plugin position and count, and re-run the plugin coexistence cases that depend on the wired-up state.

- [x] T054 Edit `src/modules/registry.ts` per plan §Registry Update — Exact Location: add `import notificationsLab from './notifications-lab';` directly after the `coreLocationLab` import; add `notificationsLab,` to the `MODULES` array directly after `coreLocationLab,` and before the trailing comment. Diff MUST be exactly +2 lines. No other line in the file may be touched. (FR-NL-001, AC-NL-001)
- [x] T055 Add (or extend, if it already exists) `test/unit/manifests/app-json.test.ts` per plan §Test Strategy → "Manifest test — `app.json` shape": `plugins` is an array; contains `'./plugins/with-rich-notifications'` exactly once; the new entry sits between `'./plugins/with-core-location'` and the inline `'expo-sensors'` configured array; the count of `./plugins/with-*` entries is 13. (FR-NL-002, AC-NL-002)
- [x] T056 Re-run `plugins/with-rich-notifications/index.test.ts` cases 7 and 8 from T010, which require T012 (app.json entry) and T011 (plugin impl) to be in place: case 7 — read `app.json`'s `plugins`, assert the `./plugins/with-*` count is 13, that `'./plugins/with-rich-notifications'` immediately follows `'./plugins/with-core-location'`, and that the inline `'expo-sensors'` entry remains the last array element; case 8 — import every default export from `plugins/with-*/index.ts` (13 total), fold over a baseline `ExpoConfig`, assert no throw and that `NSUserNotificationsUsageDescription`, the `expo-notifications` plugin block, and the Android `<meta-data>` channel id are all set.
- [x] T057 **Checkpoint commit**: `feat(026): registry +1 entry + app.json manifest test + plugin coexistence cases 7+8 green`.

**Checkpoint**: The Notifications Lab module is reachable from the home screen card grid. All 9 plugin test cases are green. Phase 8 is the final gate.

---

## Phase 8: Polish & Final Gate (Plan Phase 6)

- [ ] T058 [P] Run `pnpm format` from repo root; commit any formatting changes in a dedicated commit `style(026): pnpm format`.
- [x] T059 Run `pnpm check` (lint + typecheck + tests) from repo root as the final gate. Zero new failures permitted (FR-NL-020, AC-NL-004, plan §Phase 6 exit gate). If anything fails, fix in place and re-run until clean.
- [x] T060 Verify scope discipline post-implementation: `git diff --stat main..026-rich-notifications` should show only the documented additive changes — `src/modules/registry.ts` (+2 lines), `app.json` (+1 line), `package.json` + `pnpm-lock.yaml` (`expo-notifications` add), `test/setup.ts` (+1 mock line), the new files under `src/modules/notifications-lab/`, `plugins/with-rich-notifications/`, `assets/notifications/`, `test/__mocks__/expo-notifications.ts`, and (if newly created) `test/unit/manifests/app-json.test.ts`. No edits to any prior module, prior plugin, prior asset directory, or unrelated test file. (FR-NL-003, FR-NL-004, AC-NL-009, AC-NL-012)
- [x] T061 Smoke-walk the spec's user stories against a real build per plan §Phase 6 — Polish & Validation: iOS device/simulator (request permission → schedule each of the 5 trigger kinds → observe events → cancel/clear → verify the entitlement-gated levels show the inline notice from R1/R2); Android emulator (Compose + EventLog function → 4 iOS-only banners render → `spot.default` channel exists in system Settings); web browser (Compose Immediate fires via `globalThis.Notification` → denied-permission copy renders). Note results in the PR description. Not a CI gate. (NFR-NL-001, AC-NL-005, AC-NL-006, AC-NL-007, AC-NL-008, AC-NL-010)
- [x] T062 **Final commit**: `feat(026): Notifications Lab module — feature complete`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational mocks)**: Depends on Phase 1. BLOCKS every test task in Phases 3–6.
- **Phase 3 (Plugin)**: Depends on Phase 2 (for the mock baseline pnpm-check). Independent of Phases 4–6 except that T012 (app.json edit) must precede T056.
- **Phase 4 (Catalogs + Hook)**: Depends on Phase 2. Independent of Phase 3.
- **Phase 5 (Components)**: Depends on Phase 4 (T019 / T020 / T021 / T035 / T036 are imported by various components and by `ComposeForm` in T043).
- **Phase 6 (Screens + Manifest)**: Depends on Phases 4 and 5 (every screen variant composes the hook + components).
- **Phase 7 (Wiring)**: Depends on Phase 6 (manifest must exist before the registry imports it). Phase 7 closes out the deferred plugin test cases (7, 8) from T010.
- **Phase 8 (Polish/Gate)**: Depends on Phase 7.

### Within Each Phase

- Tests MUST be written and FAIL before implementation (Constitution Principle V).
- Catalogs (T019–T021) before the hook (T024) that imports them.
- Hook (T024) and components (T035–T043) before screens (T050–T052) that wire them.
- Plugin impl (T011) before `app.json` edit (T012) before plugin coexistence cases 5/6 re-run (T013) and cases 7/8 re-run (T056).

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 are [P] (different directories / files).
- **Phase 2**: Sequential — T006 → T007 → T008 → T009 (each depends on the previous).
- **Phase 3**: T010 (test) before T011 (impl). T012 (single-line `app.json` edit) is sequential after T011. T013 / T014 are sequential follow-ups.
- **Phase 4**: T016 / T017 / T018 are [P] (different test files); T019 / T020 / T021 are [P] (different impl files); T022 (types) is independent and can run any time after Phase 2; T023 (hook test) is sequential after T019–T022; T024 (hook impl) is sequential after T023.
- **Phase 5**: All 9 component test tasks (T026–T034) are [P]; among impls, T035 / T036 / T037 / T038 / T039 / T040 / T041 / T042 are [P]; T043 (`ComposeForm.tsx`) depends on T035, T038, T039, T042 (and the catalogs from Phase 4).
- **Phase 6**: All 4 test tasks (T045–T048) are [P]; among impls, T049 / T050 / T051 / T052 are [P] once their dependencies from Phases 4–5 are green.
- **Phase 7**: T054 / T055 are [P] (different files, both single-line additions); T056 must follow T054 + T055 + T012 + T011.
- **Phase 8**: T058 is [P] with itself only; T059 must follow T058; T060 / T061 follow T059; T062 last.

### Parallel team strategy

After Phase 4 is green, two engineers can run Phase 5 (components) and Phase 6 test scaffolding (T045–T048) concurrently. Phase 7 must be done by a single engineer to keep the registry / `app.json` diff minimal and conflict-free.

---

## Parallel Example: Phase 5 Components

```text
# Launch all 9 component tests together (they MUST FAIL before implementation):
T026 PermissionsCard.test.tsx
T027 ComposeForm.test.tsx
T028 TriggerPicker.test.tsx
T029 AttachmentPicker.test.tsx
T030 CategoriesCard.test.tsx
T031 PendingList.test.tsx
T032 DeliveredList.test.tsx
T033 EventLog.test.tsx
T034 IOSOnlyBanner.test.tsx

# Then launch the 8 leaf-component implementations in parallel:
T035 IOSOnlyBanner.tsx
T036 EventLog.tsx
T037 PermissionsCard.tsx
T038 AttachmentPicker.tsx
T039 TriggerPicker.tsx
T040 PendingList.tsx
T041 DeliveredList.tsx
T042 CategoriesCard.tsx

# Then T043 (ComposeForm.tsx) once its dependencies are green.
```

---

## Implementation Strategy

### Single-Slice Delivery

The plan defines no per-user-story phasing — the six cards, the hook, and the three screen variants ship together as one module. The recommended sequence is strictly Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

### Incremental Validation Checkpoints

1. After T009 — empty-feature baseline green.
2. After T015 — plugin lands; coexistence with the 12 prior plugins verified by cases 1–6 + 9 of T010.
3. After T025 — every constant table and the hook are green.
4. After T044 — every component is green.
5. After T053 — every screen variant + the manifest are green.
6. After T057 — module reachable from the home screen; plugin cases 7/8 close the loop.
7. After T062 — `pnpm check` clean, smoke-walked on iOS / Android / web.

### Critical Path

T001 → T006 → T007 → T008 → T011 → T012 → T024 → T043 → T050 → T054 → T059. Everything else parallelises around this spine.

---

## Notes

- **[P] tasks** = different files, no dependencies on incomplete tasks.
- Verify tests fail before implementing (Constitution Principle V — Test-First).
- `npx expo install` (not `pnpm add`) is used for `expo-notifications` so the SDK 55 resolver picks the right version.
- `test/setup.ts` is **extended** (one new mock line at the import boundary), not replaced. Do **not** modify the `expo-modules-core` block — see `test/setup.ts:87-90` carried forward from 024 / 025.
- The plugin coexists with all 12 prior in-tree plugins, especially 014's `with-home-widgets` and 025's `with-core-location`. Insertion order in `app.json` (with-rich-notifications AFTER with-core-location, BEFORE the inline `expo-sensors` entry) is mandated by FR-NL-002.
- Region-trigger registration reuses 025's `expo-task-manager` task-name pattern (`spot-geofence-<uuid>`) — see plan §Trigger Translation. The geofence quota risk (R7) surfaces as a non-blocking inline error.
- Tests are colocated under `src/modules/notifications-lab/__tests__/` per plan §Project Structure (this is the convention used by every prior in-tree module from 010 onward; 025's `test/unit/modules/...` location is the outlier).
- Commit at every checkpoint marker (T005, T009, T015, T025, T044, T053, T057, T062).
- Final gate: `pnpm format` then `pnpm check`. No new failures permitted (FR-NL-020, AC-NL-004).
