# Implementation Plan: Notifications Lab Module

**Branch**: `026-rich-notifications` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `notifications-lab` (id `notifications-lab`, label
`"Notifications Lab"`, `platforms: ['ios','android','web']`,
`minIOS: '10.0'`) as a single-line addition to
`src/modules/registry.ts` and the `app.json` `plugins` array. The
module showcases Apple's **User Notifications** framework via
`expo-notifications` (added via `npx expo install`). It demonstrates
every locally-triggerable surface that does not require a server:
authorization (standard + provisional), rich content (title /
subtitle / body / image attachments / sound / badge / thread id),
action categories with text input, interruption levels including
entitlement-gated `time-sensitive` and `critical`, and five trigger
shapes (immediate / in-N-seconds / at-time / daily / on-region-entry,
the last reusing 025's geofence task pattern).

The single screen is composed of six collapsible cards
(Permissions, Compose & schedule, Action categories, Pending list,
Delivered list, Event log). On Android only **Compose & schedule**
and **Event log** are functional (with iOS-only Compose fields
hidden behind a single disclosure banner inside the form); the four
remaining cards render `IOSOnlyBanner`. On web only the Compose card
remains, reduced to title + body + Immediate trigger and routed
through the browser `Notification` API; the other five cards render
`IOSOnlyBanner`.

A new Expo config plugin `plugins/with-rich-notifications/`
idempotently (a) ensures `NSUserNotificationsUsageDescription` is
present in the iOS Info.plist, (b) registers the
`expo-notifications` plugin block (icon and color defaulted —
visuals are not the focus), and (c) declares a default Android
notification channel `spot.default` (importance `DEFAULT`). It
coexists with all 12 prior in-tree plugins (010 → 025) including
014's `with-home-widgets` and 025's `with-core-location` without
modifying any of them.

The integration surface is exactly:

- `src/modules/registry.ts` — +1 import + 1 array entry (+2 lines)
- `app.json` `plugins` — +1 entry (`./plugins/with-rich-notifications`)
- `package.json` / `pnpm-lock.yaml` — +1 dep (`expo-notifications`
  via `npx expo install`); `expo-task-manager` (025) and
  `expo-location` (024) are reused for the region-trigger path
- `assets/notifications/` — three new bundled sample images
  (`sample-1.png`, `sample-2.png`, `sample-3.png`) and one bundled
  custom sound (`sample-sound.caf`); no edits to prior assets dirs
- `test/setup.ts` — +1 mock entry for `expo-notifications` (next to
  the existing `expo-location` / `expo-task-manager` lines; do
  **not** replace `expo-modules-core` — see the comment at
  `test/setup.ts:87-90` carried forward from 024 / 025)

No existing module file, plugin file, screen, registry entry,
component, or `app.json` plugin is modified. 014's Home Widgets,
024's MapKit Lab, and 025's Core Location Lab continue to work
unchanged.

## Technical Context

- **Language**: TypeScript 5.9 strict (no Swift bridges this feature
  — every User Notifications surface needed is already exposed by
  `expo-notifications`).
- **Runtime**: React 19.2 (React Compiler enabled), React Native
  0.83.6, Expo SDK ~55.0.17, expo-router (typed routes),
  `react-native-reanimated` Keyframe API + `react-native-worklets`.
- **Existing dependencies reused**: `expo-task-manager` (added by
  025) and `expo-location` (added by 024). No version bumps. Both
  are referenced only by the `on-region-entry` trigger path.
- **New dependency (pinned by `npx expo install` against SDK 55)**:
  - `expo-notifications` — current SDK 55 selection (expected
    `~0.34.x`; actual version is whatever `npx expo install`
    resolves and writes to `package.json` / `pnpm-lock.yaml`; the
    plan does not pre-pin a floating range). Installed with
    `npx expo install expo-notifications` so the resolver picks the
    SDK-aligned version and lockfile churn is one commit.
- **Reused in-tree component**: none. The screen composes the new
  components listed in the file tree below; the `IOSOnlyBanner`
  shape mirrors 025's banner verbatim but is its own file under
  this module so the two modules remain decoupled.
- **State / data shapes**: defined in §"Architecture" below. No
  external storage; everything is in-memory and bounded (Event log
  FIFO-evicted at 20 entries per FR-NL-018).
- **Test stack**: jest-expo + RNTL, JS-pure. Adds one new mock
  `test/__mocks__/expo-notifications.ts` wired through
  `test/setup.ts` next to the existing `expo-location` /
  `expo-task-manager` lines. **Do not replace `expo-modules-core`
  globally** — mock at the `expo-notifications` import boundary
  instead. The browser `Notification` API is mocked on
  `globalThis.Notification` for the web screen variant test only.
- **No `eslint-disable` directives for unregistered rules.**
- **`pnpm format` is run before commit.**
- **Build Validation (Constitution v1.1.0 §Validate-Before-Spec)**:
  this feature does not introduce a new build pipeline or change
  any prebuild / EAS configuration beyond an Info.plist key, an
  `expo-notifications` plugin registration, and one Android
  channel. The plugin idempotency is validated by unit test (Phase
  1 contract) rather than by a real prebuild, matching the
  precedent set by 023 / 024 / 025. A real `npx expo prebuild` is
  run once during implementation as a smoke check (NFR-NL-004) but
  is not a gate on the plan.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Walked principle-by-principle against constitution v1.1.0
(`.specify/memory/constitution.md`):

- **I. Cross-Platform Parity** ✅ — Three screen variants
  (`screen.tsx` / `screen.android.tsx` / `screen.web.tsx`). The core
  user journey (grant permission → compose → fire an immediate
  notification → see a foreground event in the log) works
  identically on iOS, Android (via `expo-notifications`'s Android
  surface plus the `spot.default` channel), and web (via the
  browser `Notification` API). The five iOS-only surfaces
  (Permissions detail, Action categories, Pending, Delivered,
  iOS-only Compose fields) are explicit carve-outs permitted by
  Principle I as "platform-specific behavior that improves UX on
  that platform"; Android and web render `IOSOnlyBanner` for the
  cards they do not support so the screen does not crash and the
  absence is documented in-app.
- **II. Token-Based Theming** ✅ — All new components use
  `ThemedText` / `ThemedView` from `src/components/themed-*` and
  the `Spacing` scale from `src/constants/theme.ts`. Colors resolve
  via `useTheme()`. No hex literals. Verified by component tests
  (no hex assertions; grep-checked during cleanup).
- **III. Platform File Splitting** ✅ —
  `screen.tsx` / `screen.android.tsx` / `screen.web.tsx` for the
  one place platform behavior diverges materially. The hook uses
  `Platform.OS === 'ios'` and `Platform.OS === 'web'` only as
  single-expression guards inside `useNotificationCenter` (e.g.,
  to short-circuit `setNotificationCategoriesAsync` on web where
  it is undefined) — that is permitted by Principle III ("inline
  `Platform.select()` is acceptable only for single-value
  differences"). The web fallback to `globalThis.Notification`
  lives entirely inside `screen.web.tsx`.
- **IV. StyleSheet Discipline** ✅ — Every component declares its
  styles via `StyleSheet.create()`. No CSS-in-JS, no inline style
  objects defined outside `StyleSheet`, no utility-class framework.
  Spacing values from the `Spacing` scale.
- **V. Test-First for New Features** ✅ — Comprehensive UT scope
  covers every constant table, hook, component, screen variant,
  plugin, and the manifest. Tests are written alongside or before
  implementation. See §"Test Strategy" below for the full file list.
- **Technology Constraints** ✅ — TypeScript 5.9 strict; no new
  Animated-API usage; no new `Image` usage beyond `Image.resolveAssetSource`
  on the three new bundled attachments (required to obtain a file
  URI for `UNNotificationAttachment`); pnpm with `nodeLinker:
  hoisted`; React Compiler enabled; path aliases `@/*` and
  `@/assets/*` respected.
- **Development Workflow** ✅ — SDD lifecycle followed
  (specify → plan → tasks → implement). Constitution Check passes
  (this section). Validate-Before-Spec satisfied: this is not a
  build-pipeline feature; the one plugin change is unit-tested for
  idempotency.

**Result: PASS — no violations to justify.** §"Complexity Tracking"
remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/026-rich-notifications/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (deferred — no NEEDS CLARIFICATION)
├── data-model.md        # Phase 1 output (entities defined inline below)
├── quickstart.md        # Phase 1 output (deferred to /speckit.tasks if needed)
├── contracts/           # Phase 1 output (hook/plugin contracts inline below)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

> **Note on Phase 0 / Phase 1 artifacts.** The spec contains no
> `NEEDS CLARIFICATION` markers and the dependency / API choices
> are fully resolved (add `expo-notifications`; reuse 024's
> `expo-location` and 025's `expo-task-manager`). Rather than emit
> stub `research.md` / `data-model.md` / `quickstart.md` /
> `contracts/` files, this plan inlines the equivalent content
> below (Architecture, Data & Hook Contracts, Plugin Contract,
> Test Strategy). `/speckit.tasks` may extract these into separate
> files if it benefits the task generation; this plan does not
> require them. This matches the precedent set by 025's plan.

### Source Code (repository root)

```text
src/modules/notifications-lab/
  index.tsx                   ModuleManifest (id 'notifications-lab',
                              label 'Notifications Lab', icon
                              'bell.badge.fill', platforms
                              ['ios','android','web'], minIOS '10.0')
  screen.tsx                  iOS screen — composes the 6 collapsible
                              cards (PermissionsCard, ComposeForm,
                              CategoriesCard, PendingList,
                              DeliveredList, EventLog)
  screen.android.tsx          Android — same shell; PermissionsCard,
                              CategoriesCard, PendingList, and
                              DeliveredList slots replaced by
                              <IOSOnlyBanner reason="..."/>;
                              ComposeForm renders with iOS-only
                              fields hidden behind a single
                              disclosure banner
  screen.web.tsx              Web — same shell; only ComposeForm
                              (reduced to title + body + Immediate)
                              and EventLog render; the other four
                              slots render IOSOnlyBanner; submission
                              calls globalThis.Notification
  categories.ts               Constant table — exports CategoryId,
                              CATEGORIES, the 3 demo categories
                              (yes-no, snooze-done, reply-text)
                              with action ids, titles, options, and
                              the reply-text input metadata
  interruption-levels.ts      Constant table — exports
                              InterruptionLevel, INTERRUPTION_LEVELS
                              with per-level metadata: requires-
                              entitlement flag, fallback level the
                              OS will use when entitlement is absent,
                              human-readable copy
  bundled-attachments.ts      Constant table — exports
                              BundledAttachment, BUNDLED_ATTACHMENTS
                              (3 entries), and DEFAULT_ATTACHMENT_ID
                              (null). Each entry uses require() on
                              the asset under @/assets/notifications/
  hooks/
    useNotificationCenter.ts  Single hook owning: permissions
                              state + request flows; category
                              registration (idempotent on mount);
                              listener installation
                              (addNotificationReceivedListener,
                              addNotificationResponseReceivedListener),
                              cold-launch replay via
                              getLastNotificationResponseAsync;
                              event log FIFO (cap 20); pending /
                              delivered list refresh on focus and
                              after every mutation; schedule(),
                              cancel(), cancelAll(), remove(),
                              clearAll(); region-trigger geofence
                              registration that follows 025's
                              spot-geofence-<uuid> pattern.
                              mountedRef guards setState after unmount
                              (021/022/023/025 pattern)
  components/
    PermissionsCard.tsx       Status pill + per-setting indicators
                              (alerts/sounds/badges/criticalAlerts/
                              timeSensitive) + Request button +
                              "Request provisional" button + Open
                              Settings link (iOS deep link via
                              Linking.openSettings)
    ComposeForm.tsx           Title / subtitle / body inputs;
                              AttachmentPicker; thread id input;
                              sound picker; interruption-level
                              segmented control with inline
                              entitlement notice when ts/critical
                              selected; badge stepper (0–99);
                              category picker; TriggerPicker;
                              Schedule button (disabled with
                              "Permission required" copy when
                              status is denied/notDetermined; quiet-
                              delivery note when provisional)
    TriggerPicker.tsx         Segmented control (Immediate /
                              In N seconds / At specific time /
                              Daily at time / On region entry) +
                              the per-kind subform (seconds spinner,
                              date picker, hour+minute picker, lat/
                              lng/radius). Region option disabled
                              when location auth is not granted
    AttachmentPicker.tsx      None / one of three bundled images
                              (renders thumbnails); resolves the
                              asset's file URI via
                              Image.resolveAssetSource for the
                              UNNotificationAttachment payload
    CategoriesCard.tsx        Read-only list of the 3 demo
                              categories (id, action ids, titles,
                              text-input flag) + "Open last fired
                              notification's actions" button which
                              opens an in-app sheet replaying the
                              last-received notification's category
                              buttons; disabled with tooltip when
                              no notification has been received
    PendingList.tsx           Renders pending rows (id, title,
                              triggerSummary, Cancel button) +
                              "Cancel all" action
    DeliveredList.tsx         Renders delivered rows (id, title,
                              deliveredAt, Remove button) +
                              "Clear all" action
    EventLog.tsx              FIFO log renderer capped at 20
                              entries; per-row formatting per
                              event kind ('received' /
                              'action-response' with action id +
                              text input / 'dismissed')
    IOSOnlyBanner.tsx         Banner with per-reason copy
                              ('permissions' | 'categories' |
                              'pending' | 'delivered' |
                              'compose-fields' | 'web-fallback');
                              used on Android and web for the
                              non-functional card slots and inside
                              ComposeForm for the iOS-only-fields
                              disclosure on Android
  __tests__/
    manifest.test.ts
    categories.test.ts
    interruption-levels.test.ts
    bundled-attachments.test.ts
    screen.test.tsx
    screen.android.test.tsx
    screen.web.test.tsx
    hooks/
      useNotificationCenter.test.tsx
    components/
      PermissionsCard.test.tsx
      ComposeForm.test.tsx
      TriggerPicker.test.tsx
      AttachmentPicker.test.tsx
      CategoriesCard.test.tsx
      PendingList.test.tsx
      DeliveredList.test.tsx
      EventLog.test.tsx
      IOSOnlyBanner.test.tsx

plugins/with-rich-notifications/
  index.ts                    withInfoPlist + withPlugins +
                              withAndroidManifest (chained);
                              idempotently sets the usage
                              description, registers the
                              expo-notifications plugin block,
                              declares the spot.default Android
                              channel
  index.test.ts               idempotency + coexistence with 014's
                              with-home-widgets and 025's
                              with-core-location + 13-in-tree-plugin
                              total coexistence
  package.json                { name, version, main, types }

assets/notifications/
  sample-1.png                Bundled attachment 1 (PNG, ≤ 100 KB)
  sample-2.png                Bundled attachment 2 (PNG, ≤ 100 KB)
  sample-3.jpg                Bundled attachment 3 (JPEG, ≤ 100 KB)
  sample-sound.caf            Bundled custom notification sound
                              (Core Audio Format, ≤ 30 KB, < 30 s
                              per Apple's UNNotificationSound limit)

test/__mocks__/
  expo-notifications.ts       (new) getPermissionsAsync,
                              requestPermissionsAsync,
                              setNotificationCategoriesAsync,
                              scheduleNotificationAsync,
                              cancelScheduledNotificationAsync,
                              cancelAllScheduledNotificationsAsync,
                              getAllScheduledNotificationsAsync,
                              getPresentedNotificationsAsync,
                              dismissNotificationAsync,
                              dismissAllNotificationsAsync,
                              addNotificationReceivedListener,
                              addNotificationResponseReceivedListener,
                              getLastNotificationResponseAsync,
                              setNotificationChannelAsync,
                              AndroidImportance — all programmable
                              per test; exposes
                              __triggerReceived(notification),
                              __triggerResponse(response),
                              __setPermissionsMock(state),
                              __reset()

src/modules/registry.ts       +2 lines (1 import + 1 array entry)
app.json                      +1 entry in `plugins` array
package.json                  +1 dependency (expo-notifications)
test/setup.ts                 +1 jest.mock entry, next to the
                              existing expo-location /
                              expo-task-manager lines
```

**Structure Decision**: Single-project Expo app layout (matches every
prior module under `src/modules/<feature>/`). Each module owns its
manifest, screens, components, hooks, and constants. Tests are
**colocated** under `src/modules/notifications-lab/__tests__/`
mirroring the spec's file-tree shape (FR-NL-004 lists the source
tree but not the test tree; colocated `__tests__/` is the
convention used by every prior module from 010 onward and matches
025's `test/unit/modules/<feature>/` only in coverage breadth, not
in physical location). The plugin lives under `plugins/with-rich-notifications/`
with a sibling `index.test.ts`.

## Architecture

### Data & Hook Contracts

#### Constant tables

```ts
// categories.ts
export type CategoryId = 'yes-no' | 'snooze-done' | 'reply-text';

export interface CategoryAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
  input?: { placeholder: string; buttonTitle: string };
}

export interface CategoryDefinition {
  id: CategoryId;
  actions: readonly CategoryAction[];
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: 'yes-no',
    actions: [
      { id: 'yes', title: 'Yes', options: { foreground: true } },
      { id: 'no',  title: 'No',  options: { destructive: true } },
    ],
  },
  {
    id: 'snooze-done',
    actions: [
      { id: 'snooze', title: 'Snooze', options: { foreground: false } },
      { id: 'done',   title: 'Done',   options: { foreground: true } },
    ],
  },
  {
    id: 'reply-text',
    actions: [
      {
        id: 'reply',
        title: 'Reply',
        input: { placeholder: 'Reply…', buttonTitle: 'Send' },
      },
      { id: 'dismiss', title: 'Dismiss', options: { destructive: true } },
    ],
  },
];

export const DEFAULT_CATEGORY_ID: CategoryId | null = null;
```

```ts
// interruption-levels.ts
export type InterruptionLevel =
  | 'passive'
  | 'active'
  | 'time-sensitive'
  | 'critical';

export interface InterruptionLevelMeta {
  level: InterruptionLevel;
  label: string;
  requiresEntitlement: boolean;
  fallbackLevel: InterruptionLevel;   // what the OS will use
                                      // when the entitlement
                                      // is absent
  copy: string;                       // inline-notice copy
}

export const INTERRUPTION_LEVELS: readonly InterruptionLevelMeta[] = [
  { level: 'passive',         label: 'Passive',
    requiresEntitlement: false, fallbackLevel: 'passive', copy: '…' },
  { level: 'active',          label: 'Active',
    requiresEntitlement: false, fallbackLevel: 'active',  copy: '…' },
  { level: 'time-sensitive',  label: 'Time-Sensitive',
    requiresEntitlement: true,  fallbackLevel: 'active',
    copy: 'Requires the com.apple.developer.usernotifications.time-sensitive entitlement. Without it, iOS delivers as Active.' },
  { level: 'critical',        label: 'Critical',
    requiresEntitlement: true,  fallbackLevel: 'active',
    copy: 'Requires the Critical Alerts entitlement (special Apple approval). Without it, iOS delivers as Active and respects Do Not Disturb.' },
];

export const DEFAULT_INTERRUPTION_LEVEL: InterruptionLevel = 'active';
```

```ts
// bundled-attachments.ts
export interface BundledAttachment {
  id: string;
  label: string;
  requireAsset: number;
  mimeType: 'image/png' | 'image/jpeg';
}

export const BUNDLED_ATTACHMENTS: readonly BundledAttachment[] = [
  { id: 'sample-1', label: 'Sample 1 (PNG)',
    requireAsset: require('@/assets/notifications/sample-1.png'),
    mimeType: 'image/png' },
  { id: 'sample-2', label: 'Sample 2 (PNG)',
    requireAsset: require('@/assets/notifications/sample-2.png'),
    mimeType: 'image/png' },
  { id: 'sample-3', label: 'Sample 3 (JPEG)',
    requireAsset: require('@/assets/notifications/sample-3.jpg'),
    mimeType: 'image/jpeg' },
];

export const DEFAULT_ATTACHMENT_ID: string | null = null;
```

#### Entities (in-memory only — no persistence)

```ts
export interface PermissionsState {
  status: 'notDetermined' | 'provisional' | 'authorized'
        | 'denied' | 'ephemeral';
  alerts: boolean;
  sounds: boolean;
  badges: boolean;
  criticalAlerts: boolean;
  timeSensitive: boolean | null;   // null on iOS<15 / non-iOS
}

export type TriggerSpec =
  | { kind: 'immediate' }
  | { kind: 'in-seconds';     seconds: number }            // ≥ 1
  | { kind: 'at-time';        date: Date }
  | { kind: 'daily-at-time';  hour: number; minute: number }
  | { kind: 'on-region-entry';
      latitude: number; longitude: number;
      radius: 50 | 100 | 500 };

export interface ComposeDraft {
  title: string;
  subtitle: string;
  body: string;
  attachmentId: string | null;
  threadId: string;
  soundId: 'none' | 'default' | 'custom-bundled';
  interruptionLevel: InterruptionLevel;
  badge: number;                  // 0..99
  categoryId: CategoryId | null;
  trigger: TriggerSpec;
}

export interface PendingNotification {
  identifier: string;
  title: string;
  triggerSummary: string;         // e.g. "in 30s", "daily 09:00"
}

export interface DeliveredNotification {
  identifier: string;
  title: string;
  deliveredAt: Date;
}

export type NotificationEvent =
  | { kind: 'received';        identifier: string; at: Date }
  | { kind: 'action-response'; identifier: string;
      actionIdentifier: string;
      textInput: string | null; at: Date }
  | { kind: 'dismissed';       identifier: string; at: Date };
```

The `NotificationEvent` log is FIFO-capped at 20 entries
(FR-NL-018). Pending and Delivered are sourced from the OS on
every refresh — the module owns no copy of those lists between
refreshes.

#### `useNotificationCenter`

```ts
export interface UseNotificationCenter {
  permissions: PermissionsState;
  pending:    ReadonlyArray<PendingNotification>;
  delivered:  ReadonlyArray<DeliveredNotification>;
  events:     ReadonlyArray<NotificationEvent>;       // newest first, capped 20
  request(opts?: { provisional?: boolean }): Promise<void>;
  schedule(draft: ComposeDraft): Promise<string>;     // returns identifier
  cancel(identifier: string):  Promise<void>;
  cancelAll(): Promise<void>;
  remove(identifier: string):  Promise<void>;
  clearAll(): Promise<void>;
  refresh(): Promise<void>;                           // pending + delivered
  invokeAction(args: {                                // for the in-app
    identifier: string;                               // category-replay sheet
    actionIdentifier: string;
    textInput?: string;
  }): void;                                           // synthesises an
                                                      // 'action-response' log
                                                      // entry; does NOT call
                                                      // the OS
  error: Error | null;
}
```

Lifecycle:

1. **Mount** — single idempotent call to
   `Notifications.setNotificationCategoriesAsync(CATEGORIES)`
   guarded by a module-scoped `__categoriesRegistered` flag so
   re-mounting the screen does not re-register
   (FR-NL-009: "Re-mounting the screen MUST NOT register
   duplicates"). Then attaches two listeners
   (`addNotificationReceivedListener`,
   `addNotificationResponseReceivedListener`) and reads
   `getLastNotificationResponseAsync()` to replay any cold-launch
   response into the event log (FR-NL-012).
2. **request({ provisional })** — calls
   `requestPermissionsAsync({ ios: { allowAlert: true,
   allowBadge: true, allowSound: true, allowCriticalAlerts: false,
   allowProvisional: !!provisional, provideAppNotificationSettings:
   true } })`. Result is mapped to `PermissionsState` and stored.
3. **schedule(draft)** — translates `draft.trigger` to an
   `expo-notifications` `NotificationTriggerInput`
   (see §"Trigger Translation" below); builds an
   `NotificationContentInput` from the remaining draft fields
   (attachment URI resolved via `Image.resolveAssetSource(
   BUNDLED_ATTACHMENTS[i].requireAsset).uri`); calls
   `scheduleNotificationAsync({ content, trigger })`;
   on success, calls `refresh()` and returns the identifier.
4. **cancel / cancelAll / remove / clearAll** — thin wrappers over
   `cancelScheduledNotificationAsync`,
   `cancelAllScheduledNotificationsAsync`,
   `dismissNotificationAsync`, `dismissAllNotificationsAsync`,
   each followed by `refresh()`.
5. **refresh()** — `Promise.all([
   getAllScheduledNotificationsAsync(),
   getPresentedNotificationsAsync()])`, projects results into the
   `Pending` / `Delivered` shapes, and updates state.
6. **Event ingestion** — each listener pushes a `NotificationEvent`
   into the FIFO log (cap 20). For
   `addNotificationResponseReceivedListener`, `actionIdentifier`
   and `userText` are extracted; the `dismissed` kind is emitted
   when the OS surfaces a dismiss response (iOS's
   `UNNotificationDismissActionIdentifier`).
7. **Unmount** — every subscription returned by an `add*Listener`
   is removed; `mountedRef` guards `setState` after unmount;
   listener objects on the module-scope category-registration flag
   are **not** cleared (categories persist for the process
   lifetime, matching iOS semantics).
8. **Errors** — any throw from a `Notifications.*` call is captured
   into `error`; the calling action surfaces a non-blocking inline
   error in the relevant card.

#### Trigger Translation (FR-NL-014)

| Picker selection | `expo-notifications` trigger payload |
|---|---|
| Immediate                                  | `null` |
| In N seconds (N ≥ 1)                       | `{ seconds: N, repeats: false }` |
| At specific time                           | `{ date: spec.date }` |
| Daily at time                              | `{ hour, minute, repeats: true }` |
| On region entry (lat, lng, radius)         | `{ type: 'location', region: { identifier: 'spot-geofence-<uuid>', latitude, longitude, radius, notifyOnEnter: true, notifyOnExit: false } }` |

The region trigger reuses 025's geofence task-name pattern
(`spot-geofence-<uuid>`) so the two modules' geofences do not
collide in `expo-task-manager`'s registry. Region-trigger registration
is gated on location authorization being `granted` (FR-NL-014); the
TriggerPicker disables that option when the gate is closed.

### Plugin Contract — `with-rich-notifications`

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import {
  withInfoPlist, withPlugins, withAndroidManifest,
} from '@expo/config-plugins';

const USAGE_KEY  = 'NSUserNotificationsUsageDescription';
const USAGE_COPY =
  'Spot uses notifications to demonstrate Apple\'s User ' +
  'Notifications framework in the Notifications Lab.';

const ANDROID_CHANNEL_ID   = 'spot.default';
const ANDROID_CHANNEL_NAME = 'Default';

const withRichNotifications: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (mod) => {
    if (mod.modResults[USAGE_KEY] !== USAGE_COPY) {
      mod.modResults[USAGE_KEY] = USAGE_COPY;
    }
    return mod;
  });

  // Idempotently register the expo-notifications plugin block.
  // We use withPlugins (compose) and dedupe by name so re-runs
  // do not append a second entry.
  config = withPlugins(config, [
    [
      'expo-notifications',
      {
        // icon and color left at defaults — visuals are not the focus
        mode: 'production',
        androidMode: 'default',
      },
    ],
  ]);

  // Default Android channel registration (idempotent).
  config = withAndroidManifest(config, (mod) => {
    // expo-notifications creates channels at runtime; we still
    // declare the channel id in <meta-data> for first-launch
    // notifications fired before useNotificationCenter mounts.
    const app = mod.modResults.manifest.application?.[0];
    if (!app) return mod;
    app['meta-data'] ??= [];
    const exists = app['meta-data'].some(
      (m) => m.$['android:name']
        === 'expo.modules.notifications.default_notification_channel_id',
    );
    if (!exists) {
      app['meta-data'].push({
        $: {
          'android:name':
            'expo.modules.notifications.default_notification_channel_id',
          'android:value': ANDROID_CHANNEL_ID,
        },
      });
    }
    return mod;
  });

  return config;
};

export default withRichNotifications;
```

`useNotificationCenter` additionally calls
`Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
name: ANDROID_CHANNEL_NAME, importance: AndroidImportance.DEFAULT
})` once on mount when `Platform.OS === 'android'` to ensure the
runtime channel object exists alongside the manifest declaration
(belt-and-suspenders: the manifest `<meta-data>` lets the OS pick
a default before JS runs; the runtime call lets the user see the
channel in the system Settings UI).

Properties (FR-NL-003):

- Touches **only** the one usage-description key, the
  `expo-notifications` plugin entry, and the one Android
  `<meta-data>` element. Never reads or writes any other Info.plist
  key, no entitlements (Time-Sensitive and Critical Alerts are
  surfaced as in-app notices, not requested), no other capabilities.
- Idempotent: re-running on a config that already contains the
  identical copy, the plugin block, and the meta-data entry is a
  literal no-op (the inequality and `some()` guards prevent
  unnecessary writes); re-running on a config with a different
  prior value overwrites it once and is then idempotent. Verified
  by the plugin test (NFR-NL-004).
- Coexists with all 12 prior in-tree plugins including 014's
  `with-home-widgets` (which declares its own widget extension
  Info.plist entries) and 025's `with-core-location` (which sets
  `NSLocationWhenInUseUsageDescription` and adds `'location'` to
  `UIBackgroundModes`). Insertion order in `app.json` puts
  `with-rich-notifications` **after** `with-core-location`, so
  notification-related Info.plist keys land last; because none of
  the prior plugins write the `NSUserNotificationsUsageDescription`
  key, there is no last-writer collision. The mod-chain test
  asserts that all 13 plugins fold over a baseline `ExpoConfig`
  without throwing and that the final `Info.plist` contains the
  union of all keys each plugin claims to set.

### Web Fallback Strategy

The web screen variant (`screen.web.tsx`) does **not** import any
`expo-notifications` API at runtime (FR-NL-016: "No
`expo-notifications` API that is undefined on web may be invoked
at runtime"). Instead, the reduced ComposeForm submits through:

```ts
async function fireWebNotification(draft: { title: string; body: string }) {
  if (typeof globalThis.Notification === 'undefined') {
    throw new Error('Notifications API is not available in this browser.');
  }
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return;
  }
  if (Notification.permission !== 'granted') return;
  new Notification(draft.title, { body: draft.body });
  // Synthesise a 'received' event-log entry so the user sees parity
  // with the iOS event-log behaviour.
  appendWebEvent({ kind: 'received', identifier: `web-${Date.now()}`, at: new Date() });
}
```

The web Permissions surface is replaced by an `IOSOnlyBanner` with
reason `web-fallback`; the Request button on the Compose card
itself is what triggers `Notification.requestPermission()` (gated
by `permission === 'default'`). No service worker is registered;
no scheduling is supported on web (only Immediate triggers); region
triggers are unavailable; categories are unavailable. These
limitations are stated in the per-card banner copy.

The `globalThis.Notification` reference is feature-detected
(`typeof globalThis.Notification === 'undefined'`) before every
call; if absent (older browsers, stricter sandboxes) the Compose
button shows "Notifications not supported in this browser" and is
disabled.

### Android Default Channel Pre-Registration

`useNotificationCenter` runs the following on mount when
`Platform.OS === 'android'`:

```ts
import * as Notifications from 'expo-notifications';

await Notifications.setNotificationChannelAsync('spot.default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.DEFAULT,
});
```

The call is wrapped in a module-scoped `__defaultChannelRegistered`
flag so re-mounting the screen never re-registers the channel.
Every outgoing notification on Android sets `channelId:
'spot.default'` on its `content` so it routes through this channel
(FR-NL-015 "On Android the `spot.default` channel MUST be set on
every outgoing notification"). The channel id is **also** declared
statically in the `AndroidManifest.xml` `<meta-data>` block by the
plugin (above) so a notification fired before JS hydrates still
has a valid default channel.

### Registry Update — Exact Location

Adding `notifications-lab` to `src/modules/registry.ts` is two lines:

- **Import** — append after the `coreLocationLab` import:
  ```ts
  import notificationsLab from './notifications-lab';
  ```
- **Array entry** — append inside `MODULES` after `coreLocationLab,`
  and before the trailing comment:
  ```ts
  export const MODULES: readonly ModuleManifest[] = [
    // ... 20 prior entries ...
    coreLocationLab,
    notificationsLab,
    // ↑ Append new manifests here in the order they should appear.
  ];
  ```

No other line in `registry.ts` is edited. The diff against the
025-merged main is exactly +2 lines.
`test/unit/modules/registry.test.ts` already enforces "unique
kebab-case ids", so no test changes are required there;
`notifications-lab/__tests__/manifest.test.ts` covers the new
manifest shape.

### `app.json` Update — Exact Change

Append `"./plugins/with-rich-notifications"` to the `plugins` array.
Insertion position: after `"./plugins/with-core-location"` and
before the inline `"expo-sensors"` configured-array entry,
preserving the convention that the only inline configured array
sits at the array tail:

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { ... }],
  "expo-image",
  "./plugins/with-live-activity",
  "./plugins/with-app-intents",
  "./plugins/with-home-widgets",
  "./plugins/with-screentime",
  "./plugins/with-coreml",
  "./plugins/with-vision",
  "./plugins/with-speech-recognition",
  "./plugins/with-audio-recording",
  "./plugins/with-sign-in-with-apple",
  "./plugins/with-local-auth",
  "./plugins/with-keychain-services",
  "./plugins/with-mapkit",
  "./plugins/with-core-location",
  "./plugins/with-rich-notifications",
  ["expo-sensors", { "motionPermission": "..." }]
]
```

The total count after the change is **18** array entries (3
baseline Expo plugins + 13 in-tree `./plugins/with-*` + 1 inline-
configured `expo-sensors` array). The plugin test asserts on the
in-tree custom count to avoid coupling to bare-string Expo plugins.
Note that the `expo-notifications` plugin block itself is added by
`with-rich-notifications` via `withPlugins(...)` at config-resolve
time rather than as a literal entry in `app.json` — this keeps the
visible diff to the single `./plugins/with-rich-notifications`
line and lets the in-tree plugin own all the notification-related
config in one place.

## Dependency Table

| Package | Status | Source | Why this feature needs it | Install command |
|---|---|---|---|---|
| `expo-notifications` | **NEW** | npm (Expo SDK 55) | Core API surface for every requirement: permissions, scheduling, categories, listeners, channels. | `npx expo install expo-notifications` |
| `expo-task-manager` | reused | added by 025 | Region-entry trigger uses 025's `spot-geofence-<uuid>` task pattern. | (none) |
| `expo-location` | reused | added by 024 | Resolving the device's current location for the region-trigger picker default values; gating the region-trigger picker option on auth status. | (none) |
| `expo-image` | reused | baseline | `Image.resolveAssetSource(...)` used by `AttachmentPicker` to obtain a file URI for `UNNotificationAttachment`. | (none) |
| `@expo/config-plugins` | reused | baseline | Plugin authoring (`withInfoPlist`, `withPlugins`, `withAndroidManifest`). | (none) |

Lockfile churn is exactly one commit (`pnpm-lock.yaml` updated
once by `npx expo install`). Versions are pinned by Expo's resolver
against SDK 55; the plan does not pre-pin a floating range.

## Test Strategy

All tests are JS-pure (jest-expo + RNTL). No native runtime is
exercised. Adds one new global mock for `expo-notifications`. The
`expo-task-manager` and `expo-location` mocks from 025 / 024 are
reused as-is for the region-trigger path. **Mocks are installed at
the `expo-notifications` import boundary, not at
`expo-modules-core`** — see the comment at `test/setup.ts:87-90`
carried forward from 024.

### `manifest.test.ts`
- `id === 'notifications-lab'` (kebab-case, unique within `MODULES`).
- `label === 'Notifications Lab'`.
- `platforms === ['ios','android','web']`.
- `minIOS === '10.0'`.
- `screen` is a function / component reference.

### `categories.test.ts`
- 3 entries; ids are exactly `'yes-no'`, `'snooze-done'`,
  `'reply-text'`.
- `yes-no` exposes actions `yes` and `no` with the documented
  options.
- `snooze-done` exposes `snooze` (`foreground: false`) and `done`
  (`foreground: true`).
- `reply-text` exposes `reply` with `input.placeholder === 'Reply…'`
  and `input.buttonTitle === 'Send'`, plus `dismiss`.
- All action ids within a category are unique.
- `DEFAULT_CATEGORY_ID === null`.

### `interruption-levels.test.ts`
- 4 entries in the documented order
  (`passive`, `active`, `time-sensitive`, `critical`).
- `passive` and `active` have `requiresEntitlement === false` and
  fall back to themselves.
- `time-sensitive` and `critical` have
  `requiresEntitlement === true` and `fallbackLevel === 'active'`.
- The `copy` field for `time-sensitive` mentions
  "time-sensitive" entitlement; the `copy` field for `critical`
  mentions "Critical Alerts".
- `DEFAULT_INTERRUPTION_LEVEL === 'active'`.

### `bundled-attachments.test.ts`
- Exactly 3 entries; ids are unique.
- Each `requireAsset` is a number (RN module id) ≠ 0.
- `mimeType` ∈ `{'image/png', 'image/jpeg'}` and matches the
  documented per-entry MIME.
- `DEFAULT_ATTACHMENT_ID === null`.

### Hook test — `useNotificationCenter.test.tsx`
Covers every behavior FR-NL-005 through FR-NL-014 require, plus
the listener-lifecycle and permission-path branches the prompt
calls out. Concretely, asserts:

- **Mount** registers categories exactly once across
  remount-mount-remount (idempotency flag verified).
- **Mount** attaches `addNotificationReceivedListener` and
  `addNotificationResponseReceivedListener` exactly once.
- **Mount** consults `getLastNotificationResponseAsync` and
  replays a non-null result into the event log as an
  `action-response`.
- **`request()`** calls `requestPermissionsAsync` with the
  alert+sound+badge flags; success updates `permissions.status`
  to `'authorized'`.
- **`request({ provisional: true })`** sets the provisional flag
  and surfaces `permissions.status === 'provisional'`.
- **Permission-path branches** — `denied`, `notDetermined`,
  `provisional`, `authorized`, `ephemeral` each render the
  expected `PermissionsState` shape.
- **`schedule()`** for each of the five trigger kinds:
  - **Immediate** → `trigger === null`.
  - **In N seconds** → `{ seconds: N, repeats: false }`.
  - **At specific time** → `{ date }`.
  - **Daily at time** → `{ hour, minute, repeats: true }`.
  - **On region entry** → trigger object includes a region with
    `identifier` matching `spot-geofence-<uuid>` regex,
    `notifyOnEnter: true`, `notifyOnExit: false`, the supplied
    radius / lat / lng.
- **`schedule()`** with an attachment populates
  `content.attachments[0].url` with the resolved asset URI.
- **`cancel(id)`** calls `cancelScheduledNotificationAsync(id)` and
  triggers a `refresh`.
- **`cancelAll()`** calls `cancelAllScheduledNotificationsAsync`.
- **`remove(id)`** calls `dismissNotificationAsync(id)`.
- **`clearAll()`** calls `dismissAllNotificationsAsync`.
- **Listener `__triggerReceived`** appends a `received` event;
  **`__triggerResponse`** appends an `action-response` with
  `actionIdentifier` and `textInput` correctly extracted; the
  iOS dismiss action id appends a `dismissed` event.
- **Event-log cap** — pushing 21 events evicts the oldest.
- **Listener cleanup** — unmount calls `.remove()` on every
  subscription returned by `add*Listener`.
- **mountedRef** — pushing an event after unmount does not warn
  about `setState` after unmount.
- **Android branch** — when `Platform.OS === 'android'`, mount
  calls `setNotificationChannelAsync('spot.default', { name:
  'Default', importance: AndroidImportance.DEFAULT })` exactly
  once across remount-mount-remount, and `schedule()` includes
  `content.channelId === 'spot.default'`.
- **`invokeAction()`** synthesises an `action-response` event
  without invoking any `Notifications.*` API (verified by zero
  mock calls during the action).

### Component tests (one file each — 9 total)

- **`PermissionsCard`** — status pill renders the current status
  string for all 5 statuses; per-setting indicators reflect the
  booleans; the `timeSensitive` indicator reads "n/a" when the
  prop is `null`; Request button calls `onRequest()`; "Request
  provisional" calls `onRequest({ provisional: true })`; Open
  Settings link calls `Linking.openSettings()` (mocked).
- **`ComposeForm`** — every required field is present; submit
  button reads "Schedule" and is disabled when permission is
  `denied` or `notDetermined` (with "Permission required" copy);
  remains enabled when `provisional` (with quiet-delivery note);
  selecting `time-sensitive` or `critical` shows the inline
  entitlement notice; submission with an empty `title` is
  rejected (validation copy renders); badge stepper clamps to
  `0..99`; the iOS-only-fields disclosure banner is rendered when
  `Platform.OS === 'android'`.
- **`TriggerPicker`** — 5 segments render in the documented
  order; switching segments swaps the per-kind subform; the
  `In N seconds` subform validates `N >= 1`; the `On region
  entry` segment is disabled when the `locationAuthorized` prop
  is `false` (with per-segment tooltip copy).
- **`AttachmentPicker`** — None + 3 thumbnails render; tapping a
  thumbnail calls `onSelect(id)`; tapping None calls
  `onSelect(null)`; selected thumbnail has the documented
  selected-state styling.
- **`CategoriesCard`** — 3 categories render with their action
  ids and titles; the text-input flag is shown for `reply-text`
  only; "Open last fired notification's actions" is disabled
  with the documented tooltip when `lastReceived === null`;
  enabled tap opens the in-app sheet which lists the matching
  category's actions; tapping an action invokes the
  `onInvokeAction` callback with the action id (and any text
  input for `reply`).
- **`PendingList`** — given N rows, renders N matching rows
  (id + title + triggerSummary + Cancel button); empty state
  copy renders when `pending` is empty; Cancel calls
  `onCancel(id)`; "Cancel all" calls `onCancelAll`.
- **`DeliveredList`** — given N rows, renders N matching rows
  (id + title + deliveredAt timestamp + Remove button); empty
  state copy; Remove calls `onRemove(id)`; "Clear all" calls
  `onClearAll`.
- **`EventLog`** — given `events`, renders one row per event
  with rendered timestamp; per-kind formatting differs (the
  `action-response` row shows `actionIdentifier` and any
  `textInput`); empty state copy; given >20 events (defensive),
  renders the most-recent 20.
- **`IOSOnlyBanner`** — renders per-`reason` copy for all 6
  reasons (`'permissions'`, `'categories'`, `'pending'`,
  `'delivered'`, `'compose-fields'`, `'web-fallback'`).

### Screen variants (3 total)

- **`screen.test.tsx`** (iOS) — mounts; all 6 cards are present;
  expanding/collapsing each card preserves state across other
  cards' toggles; PermissionsCard, CategoriesCard, PendingList,
  DeliveredList all render their functional variants (not the
  banner).
- **`screen.android.test.tsx`** — only ComposeForm and EventLog
  render functional variants; the other 4 slots render
  `IOSOnlyBanner` with the documented per-slot reason; ComposeForm
  contains the iOS-only-fields disclosure banner; no
  `expo-notifications` call references an iOS-only API surface.
- **`screen.web.test.tsx`** — only ComposeForm (reduced to title
  + body + Immediate trigger) and EventLog render functional
  variants; the other 4 slots render `IOSOnlyBanner`; submission
  invokes `globalThis.Notification` (mocked) and synthesises a
  `received` event-log entry; if `Notification.permission ===
  'default'`, the Request flow calls
  `Notification.requestPermission()`; no `expo-notifications` API
  is referenced at runtime (verified by spying on every export
  of the mocked module — zero calls).

### Plugin test
- **`with-rich-notifications/index.test.ts`** —
  1. **Adds the usage-description key with documented copy when
     absent** and leaves it unchanged on re-run.
  2. **Registers the `expo-notifications` plugin block exactly
     once** even when run twice (dedupe by name).
  3. **Adds the Android `<meta-data>` channel id entry exactly
     once** even when run twice.
  4. **Idempotent**: running twice produces a structurally equal
     `ExpoConfig`.
  5. **Coexists with `with-home-widgets` (014)**: folding 014's
     plugin then `withRichNotifications` over a baseline config
     leaves 014's widget Info.plist entries intact and adds
     `NSUserNotificationsUsageDescription`.
  6. **Coexists with `with-core-location` (025)**: folding
     `withCoreLocation` then `withRichNotifications` leaves the
     two location-usage description keys and `'location'` in
     `UIBackgroundModes` intact and adds the notifications
     entries.
  7. **13-in-tree-plugin coexistence smoke**: read `app.json`'s
     `plugins` array post-implementation; assert the count of
     `./plugins/with-*` entries is 13, that
     `'./plugins/with-rich-notifications'` immediately follows
     `'./plugins/with-core-location'`, and that the inline
     `'expo-sensors'` entry remains the last array element.
  8. **Mod-chain runs without throwing**: import every plugin
     default export from `plugins/with-*/index.ts` (13 total) and
     fold them over a baseline `ExpoConfig`; assert no throw and
     that the notifications usage-description, the
     `expo-notifications` plugin block, and the Android
     `<meta-data>` channel id are all set.
  9. **Emits no warnings on a baseline config**: spy on
     `console.warn`; assert call count is 0.

### Manifest test — `app.json` shape
- **`app.json` plugins manifest test** (lives under
  `test/unit/manifests/app-json.test.ts` if it already exists;
  otherwise a new file at the same path). Asserts:
  - `plugins` is an array.
  - It contains `'./plugins/with-rich-notifications'` exactly once.
  - The new entry sits between `'./plugins/with-core-location'`
    and the inline `'expo-sensors'` configured array.
  - The number of `./plugins/with-*` entries is 13.

### Mocks

- **New** `test/__mocks__/expo-notifications.ts` — exports the
  full surface listed under §"Project Structure" above. Each
  function records calls into a `jest.fn()`; per-test setters
  (`__setPermissionsMock`, `__setScheduledMock`,
  `__setPresentedMock`, `__setLastResponseMock`) drive return
  values; per-test triggers (`__triggerReceived`,
  `__triggerResponse`) invoke registered listeners. `__reset()`
  clears all state between tests. Wired through `test/setup.ts`
  next to the existing `expo-location` and `expo-task-manager`
  mock entries, using the same
  `jest.mock(..., () => jest.requireActual(...))` pattern.
  **Does not replace `expo-modules-core`** (see
  `test/setup.ts:87-90`).
- **Browser `Notification`** — mocked on `globalThis.Notification`
  inside `screen.web.test.tsx`'s `beforeEach` only (so other tests
  see the JSDOM default); `Notification.permission` is a settable
  getter; `Notification.requestPermission` is a `jest.fn()`; the
  `Notification` constructor is a `jest.fn()` so call-count
  assertions are direct.

## Constitution Compliance (v1.1.0)

Re-checked post-design — see §"Constitution Check" above.
**Result: PASS, no new violations introduced by the design.** The
two integration-surface deltas (registry +1, `app.json` plugins
+1) are the additive shape this constitution version requires;
no edits to unrelated modules, screens, or plugins are introduced.

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Time-Sensitive interruption level requires the `com.apple.developer.usernotifications.time-sensitive` entitlement; selecting it on an unentitled build causes iOS to silently fall back to `active`, surprising reviewers. | Medium | Low (delivery still happens) | FR-NL-008: inline notice on the segmented control explains the entitlement requirement and the OS fallback; Event log records what was actually delivered, making the discrepancy observable in-app. | screen author |
| R2 | Critical Alerts requires special Apple approval (not a self-serve entitlement); selecting it produces the same silent-fallback behavior as R1 with the additional concern that some reviewers mis-interpret "Critical" as "guaranteed". | Medium | Low | FR-NL-008: inline notice mentions Apple approval and Do-Not-Disturb behavior; submission still succeeds; Event log records actual delivery level. | screen author |
| R3 | Web `Notification.requestPermission()` UX is browser-mediated and one-shot per origin: a user who denies once cannot be re-prompted from JS, which can leave the screen in a permanently-disabled state. | Medium | Low (web is a fallback surface, not the focus) | The web Compose card renders an explicit "Reset notification permission in your browser settings" hint when `Notification.permission === 'denied'`; a link points to the browser's per-site settings doc. The button is disabled rather than silently no-op. | screen.web author |
| R4 | Foreground-handler conflicts: `expo-notifications` exposes a single global `setNotificationHandler({ handleNotification })` slot, and another module installing one elsewhere would clobber ours. | Low | Medium | `useNotificationCenter` does **not** call `setNotificationHandler` globally — the default behavior (do not present in foreground; route through listeners only) is sufficient for FR-NL-012. If a future feature needs a custom handler, it owns the global slot; this module simply observes via `add*Listener` (which is multi-subscriber-safe). | hook author |
| R5 | The `expo-notifications` plugin block we add via `withPlugins(...)` could conflict with a future explicit `app.json` entry of the same name, producing a duplicate-plugin error from `@expo/config-plugins`. | Low | Medium | Plugin test (8) folds all 13 in-tree plugins and asserts no throw; future maintainer is expected to add `expo-notifications` as a literal `app.json` entry only after removing the `withPlugins` call here (caller-beware comment in `plugins/with-rich-notifications/index.ts`). | plugin author |
| R6 | Cold-launch response replay via `getLastNotificationResponseAsync` is one-shot per app launch; calling it after a user-action navigation (re-entering the screen) returns `null`, which a naive impl might interpret as "no last response". | Low | Low | The hook stores the last-replayed response in module-scope state on first mount; subsequent mounts read from that store rather than re-invoking the API. Tested by `useNotificationCenter.test.tsx`. | hook author |
| R7 | iOS 20-region geofence quota is a process-wide pool shared with 025; adding region-triggered notifications can exhaust it. | Low | Medium | Region-trigger registration call wraps `startGeofencingAsync` in a try/catch; quota errors surface a non-blocking inline error in the Compose card with copy "Geofence quota reached (iOS limits 20 per app). Cancel an existing region trigger or geofence in 025 to free a slot." Tested by `useNotificationCenter.test.tsx`. | hook author |
| R8 | Bundled custom sound file (`sample-sound.caf`) must be < 30 s and in a supported format or iOS silently falls back to default; reviewers may interpret silence as a bug. | Low | Low | Asset is encoded once at 16 kHz mono, ~3 s; size budget asserted by an asset-size unit check (snapshot of `Image.resolveAssetSource` URI's bytelength upper bound). | asset author |
| R9 | The Android `<meta-data>` default-channel-id key (`expo.modules.notifications.default_notification_channel_id`) is consumed by `expo-notifications` itself; if the SDK renames it across an upgrade, the manifest declaration becomes a dead string and channel resolution falls back to "Miscellaneous". | Low | Low | The hook unconditionally calls `setNotificationChannelAsync('spot.default', ...)` on mount on Android, so the runtime channel exists regardless of the manifest entry's status. The manifest entry is belt-and-suspenders for first-launch notifications fired before JS hydration. | plugin author |

## Acceptance Criteria → Plan Section Map

Spec FR / AC / NFR mapped to the plan section that delivers it. Used
by `/speckit.tasks` to derive task ↔ requirement coverage.

| Spec ref | Plan section |
|---|---|
| FR-NL-001 | §"Registry Update — Exact Location" |
| FR-NL-002 | §"`app.json` Update — Exact Change" |
| FR-NL-003 | §"Plugin Contract — `with-rich-notifications`" |
| FR-NL-004 | §"Project Structure → Source Code" file tree |
| FR-NL-005 | §"Project Structure" → `PermissionsCard.tsx`; §"Test Strategy" → `PermissionsCard` |
| FR-NL-006 | §"Project Structure" → `ComposeForm.tsx`; §"Test Strategy" → `ComposeForm` |
| FR-NL-007 | §"Test Strategy" → `ComposeForm` (disabled / quiet-delivery copy) |
| FR-NL-008 | §"Risk Register" R1+R2; §"Test Strategy" → `ComposeForm` |
| FR-NL-009 | §"Architecture → `useNotificationCenter`" mount step 1; §"Test Strategy" → hook (idempotency) |
| FR-NL-010 | §"Architecture → `useNotificationCenter`" steps 4–5; §"Project Structure" → `PendingList.tsx` |
| FR-NL-011 | §"Architecture → `useNotificationCenter`" steps 4–5; §"Project Structure" → `DeliveredList.tsx` |
| FR-NL-012 | §"Architecture → `useNotificationCenter`" steps 1, 6; §"Test Strategy" → hook (cold-launch + cap) |
| FR-NL-013 | §"Project Structure" → `CategoriesCard.tsx`; §"Test Strategy" → `CategoriesCard` |
| FR-NL-014 | §"Architecture → Trigger Translation" table; §"Test Strategy" → hook (every trigger kind) |
| FR-NL-015 | §"Project Structure" → `screen.android.tsx`; §"Android Default Channel Pre-Registration"; §"Test Strategy" → `screen.android.test.tsx` |
| FR-NL-016 | §"Web Fallback Strategy"; §"Test Strategy" → `screen.web.test.tsx` |
| FR-NL-017 | §"Project Structure" → all six `Card` components; §"Test Strategy" → `screen.test.tsx` (collapse-state preservation) |
| FR-NL-018 | §"Architecture → Entities" `NotificationEvent`; §"Test Strategy" → hook (cap-20 eviction), `EventLog` |
| FR-NL-019 | §"Web Fallback Strategy" (no remote APIs); §"Test Strategy" → `screen.web.test.tsx` (zero `expo-notifications` calls) |
| FR-NL-020 | §"Phase 6 — Polish & Validation" |
| NFR-NL-001 | §"Phase 6" smoke check |
| NFR-NL-002 | §"Architecture → `useNotificationCenter`" `refresh()` after every mutation |
| NFR-NL-003 | §"Dependency Table" |
| NFR-NL-004 | §"Plugin Contract" idempotency; §"Test Strategy" → plugin test cases 1–4 |
| NFR-NL-005 | §"Web Fallback Strategy" + §"Architecture" (no network calls) |
| NFR-NL-006 | §"Architecture → `useNotificationCenter`" — no eager schedule on mount; `cancelAll()` exposed |
| NFR-NL-007 | §"Project Structure" — every component carries `accessibilityLabel`s; covered by component tests |
| NFR-NL-008 | §"Conventions" below — `__DEV__`-gated logging |
| NFR-NL-009 | §"Constitution Check" + §"Constitution Compliance" |
| AC-NL-001 | §"Registry Update" |
| AC-NL-002 | §"`app.json` Update" |
| AC-NL-003 | §"Dependency Table" |
| AC-NL-004 | §"Phase 6 — Polish & Validation" |
| AC-NL-005 | §"Test Strategy" → hook + `screen.test.tsx` (US1 path) |
| AC-NL-006 | §"Test Strategy" → hook (`reply-text` action with text input) |
| AC-NL-007 | §"Test Strategy" → hook (every trigger kind) + R1/R2 fallback notice |
| AC-NL-008 | §"Architecture → `useNotificationCenter`" mount step 1 (cold-launch replay); hook test |
| AC-NL-009 | §"Plugin Contract" idempotency; plugin test cases 1–4 |
| AC-NL-010 | §"Test Strategy" → `screen.android.test.tsx` + `screen.web.test.tsx` |
| AC-NL-011 | §"Test Strategy" → grep audit asserted by an `app.json` / source-tree integration test (no `getDevicePushTokenAsync`, no `getExpoPushTokenAsync`, no fetch to push origins) |
| AC-NL-012 | §"Test Strategy" → plugin test cases 5–8 (coexistence with 014 + 025 + full 13-plugin fold) |

## Conventions

These are the project-wide conventions every file in this feature
follows. They are not new — they are stated here so the
implementing engineer (or `/speckit.implement`) does not have to
hunt for them.

- **Theming**: Every text node uses `ThemedText` from
  `src/components/themed-text.tsx`; every container uses
  `ThemedView` from `src/components/themed-view.tsx`. Colors come
  from `useTheme()`; no hex literals anywhere. Spacing values
  come from the `Spacing` scale in `src/constants/theme.ts`
  (e.g., `Spacing.sm`, `Spacing.md`).
- **Styling**: All styles via `StyleSheet.create()`. No inline
  `style={{ ... }}` literals beyond simple one-prop layout
  hints (e.g., `style={{ flex: 1 }}` is acceptable; complex
  literals are not).
- **ESLint**: **No `eslint-disable` directives for unregistered
  rules.** If a rule is not in `eslint.config.js` /
  `oxlint.json`, the code path must be refactored, not
  suppressed. Where a registered rule genuinely needs a
  suppression, the directive must reference the specific rule id
  and include a one-line `// reason: ...` comment.
- **Formatter**: `pnpm format` is run before commit. The CI
  `pnpm check` job will fail otherwise.
- **Logging**: Notification-content logging (titles, bodies,
  identifiers) is gated by `if (__DEV__) { ... }` and never
  ships in release builds (NFR-NL-008).
- **Path aliases**: `@/*` resolves to `src/*`, `@/assets/*`
  resolves to `assets/*`. The bundled-attachment `require()`
  paths use `@/assets/notifications/...`.

## Implementation Phases

Each phase ends at a green-test boundary. Phases are sequential
within this feature; tasks within a phase may run in parallel.

### Phase 0 — Setup
- `npx expo install expo-notifications` (resolves SDK 55
  version, updates `package.json` and `pnpm-lock.yaml`).
- Drop the four bundled assets into `assets/notifications/`
  (three images + one CAF sound).
- Add the new mock at `test/__mocks__/expo-notifications.ts` and
  the one-line `jest.mock(...)` wiring in `test/setup.ts` next to
  the existing `expo-location` / `expo-task-manager` lines.
- Confirm `pnpm check` is green on the empty-feature baseline
  (the new mock exists but is not yet referenced by any source
  file).
- **Exit gate**: `pnpm check` green.

### Phase 1 — Plugin
- Create `plugins/with-rich-notifications/` (`index.ts`,
  `package.json`).
- Append `'./plugins/with-rich-notifications'` to `app.json`
  `plugins` in the documented position.
- Write `plugins/with-rich-notifications/index.test.ts`
  implementing the 9 plugin test cases listed in
  §"Test Strategy" → "Plugin test".
- Run `npx expo prebuild --clean` once locally as a smoke check
  (NFR-NL-004); note the result in the implementation PR
  description but do not gate the phase on it (not part of CI).
- **Exit gate**: plugin test file green; `pnpm check` green.

### Phase 2 — Hook + Catalogs
- Create `categories.ts`, `interruption-levels.ts`,
  `bundled-attachments.ts` with their constant tables.
- Create the three colocated catalog tests under
  `__tests__/`.
- Create `hooks/useNotificationCenter.ts` implementing the
  contract in §"Architecture → `useNotificationCenter`".
- Create `__tests__/hooks/useNotificationCenter.test.tsx`
  implementing every assertion listed under §"Hook test".
- **Exit gate**: 4 new test files green; `pnpm check` green.

### Phase 3 — Components
- Create the 9 components listed in §"Project Structure" →
  `components/`. Each is paired with its test under
  `__tests__/components/`.
- Components are **leaf** — they take their data through props
  (the hook is wired in by the screen variant in Phase 4).
  This keeps each component's test pure and deterministic.
- Components may be implemented in parallel.
- **Exit gate**: 9 new component test files green;
  `pnpm check` green.

### Phase 4 — Screens
- Create `index.tsx` (the manifest), `screen.tsx`,
  `screen.android.tsx`, `screen.web.tsx`. Each composes the hook
  and the components from Phases 2 and 3.
- Create `__tests__/manifest.test.ts`,
  `__tests__/screen.test.tsx`,
  `__tests__/screen.android.test.tsx`,
  `__tests__/screen.web.test.tsx`.
- **Exit gate**: manifest + 3 screen test files green;
  `pnpm check` green.

### Phase 5 — Wiring
- Add the 2-line registry update
  (`src/modules/registry.ts`: 1 import + 1 array entry).
- (No `app.json` change here — it was made in Phase 1 alongside
  the plugin file.)
- Add the `app.json` manifest test asserting the plugin position
  and count.
- **Exit gate**: registry + manifest tests green;
  `pnpm check` green; the new module is reachable from the home
  screen card grid.

### Phase 6 — Polish & Validation
- Run `pnpm format`.
- Run the full `pnpm check` suite (lint, typecheck, all tests)
  end-to-end (FR-NL-020, AC-NL-004).
- Smoke test on iOS device / simulator: walk US1, US2, US3 from
  the spec; verify event log entries; verify cancel / clear
  flows; verify entitlement-gated levels show the inline notice
  (R1, R2).
- Smoke test on Android emulator: verify Compose + Event log
  function; verify the four iOS-only banners render; verify the
  `spot.default` channel exists in system Settings.
- Smoke test in a web browser: verify Compose Immediate fires
  via `globalThis.Notification`; verify denied-permission copy.
- Open PR; reference the spec, this plan, and the AC-NL → plan
  section map.
- **Exit gate**: PR opened with green CI; reviewer can walk the
  AC-NL list against the diff with no follow-ups.

## Complexity Tracking

> No Constitution Check violations to justify. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
