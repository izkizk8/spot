# Feature Specification: Notifications Lab Module

**Feature Branch**: `026-rich-notifications`
**Feature Number**: 026
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS-focused module showcasing Apple's **User Notifications**
framework via `expo-notifications`. Demonstrates rich local
notification payloads — attachments, action buttons, categories,
threading, interruption levels, time-sensitive delivery (iOS 15+),
and Focus-aware delivery — together with a complete compose /
schedule / pending / delivered / event-log workflow. All demos are
local; no APNs, no push tokens, no remote payloads. Android reuses
`expo-notifications` for immediate compose plus a default channel and
shows iOS-only banners on iOS-exclusive surfaces. Web falls back to
the browser `Notification` API for immediate compose only.

## Overview

The Notifications Lab module ("Notifications Lab") is a feature card
in the iOS Showcase registry (`id: 'notifications-lab'`, label
`"Notifications Lab"`, `platforms: ['ios','android','web']`,
`minIOS: '10.0'`). Tapping the card opens a single screen composed of
six collapsible cards, each isolating one User Notifications surface:

1. **Permissions** — current authorization status pill
   (`notDetermined`, `provisional`, `authorized`, `denied`,
   `ephemeral`); per-setting read-only indicators for alerts, sounds,
   badges, critical alerts, and time-sensitive (iOS 15+); a Request
   button that asks for the standard alert+sound+badge set; a
   secondary "Request provisional" button for the quiet-delivery
   path; an "Open Settings" deep link for users who previously
   denied.
2. **Compose & schedule** — form with title, subtitle, body, an
   attachment picker (None / one of three bundled sample images), a
   thread identifier text field, a sound selector
   (None / Default / bundled custom file demo), an interruption-level
   segmented control (Passive / Active / Time-Sensitive / Critical —
   the latter two flagged as entitlement-gated with an inline notice),
   a badge-number stepper (0–99), a category picker (None or one of
   the three pre-registered demo categories), and a trigger picker
   (Immediate / In N seconds / At specific time / Daily at time / On
   region entry — the last reuses 025's geofence task-name pattern).
   A "Schedule" button submits the form.
3. **Action categories** — read-only list of the three pre-registered
   demo categories (`yes-no`, `snooze-done`, `reply-text`) with their
   action identifiers, titles, and option flags shown. An "Open last
   fired notification's actions" button presents an in-app sheet that
   replays the last received notification's category buttons so the
   user can preview them without re-firing the notification.
4. **Pending list** — shows scheduled-but-not-yet-delivered
   notifications with identifier, title, trigger summary, and a
   Cancel button per row, plus a "Cancel all" action.
5. **Delivered list** — shows notifications still present in
   Notification Center with identifier, title, delivered timestamp,
   and a Remove button per row, plus a "Clear all" action.
6. **Event log** — a chronological log of the last 20 notification
   lifecycle events (received-foreground, received-background-tap,
   action-response with action id and any text input, dismissed) with
   timestamps and notification identifiers.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry (registry size +1).
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-rich-notifications`). Coexists with all prior
   plugins including 014's `with-home-widgets` and 025's
   `with-core-location`.
3. `package.json` / `pnpm-lock.yaml` — adds `expo-notifications` (via
   `npx expo install expo-notifications`). No other dependency is
   added; `expo-task-manager` is reused from 025 for the
   region-trigger path and `expo-location` is reused from 024 for
   resolving the current location when authoring a region trigger.
4. `plugins/with-rich-notifications/` — new Expo config plugin that
   idempotently:
   - sets `NSUserNotificationsUsageDescription` if absent (some iOS
     SDK toolchains surface this string),
   - registers an `expo-notifications` `mode: 'production'` config
     block compatible with `expo-notifications`'s own plugin (color
     and icon left at defaults — visuals are not the focus),
   - declares a default Android notification channel
     (`spot.default`, importance `DEFAULT`) so Android delivery works
     out of the box.

No existing module, screen, plugin, or registry entry is modified.
024's MapKit Lab and 025's Core Location Lab continue to work
unchanged.

## Goals

- Demonstrate every locally-triggerable surface of Apple's User
  Notifications framework that is reachable from `expo-notifications`
  without server infrastructure: rich payloads, image attachments,
  action buttons, categories, threading, sound, badge, interruption
  levels including time-sensitive (iOS 15+), and Focus-aware delivery
  (observable via the `authorized` set of capabilities the OS
  reports).
- Provide a self-contained authoring loop (compose → schedule → fires
  → received in event log → actionable in Notification Center) that a
  reviewer can exercise end-to-end inside the app with no external
  dependencies.
- Mirror feature 025's structural conventions: collapsible cards,
  iOS-only banners on iOS-exclusive surfaces, in-memory FIFO logs,
  per-feature module directory layout, idempotent config plugin.
- Keep the integration footprint minimal: one registry line, one
  plugin entry, one new dependency.

## Non-Goals

- **No remote push.** No APNs registration, no push tokens, no
  `getDevicePushTokenAsync`, no `getExpoPushTokenAsync`, no server
  endpoints, no remote payloads.
- **No notification service / content extensions.** Rich
  customization beyond what `UNNotificationContent` exposes
  (e.g., NSE mutation, in-network image download in an extension)
  is out of scope.
- **No communication notifications / Intents donations.** Those
  belong with feature 013 (App Intents) or a future spec.
- **No grouping summaries beyond `threadIdentifier`.** Custom summary
  formats and `summaryArgument` are out of scope.
- **No Live Activities or Dynamic Island.** Owned by feature 007.
- **No background notification delivery driving non-notification
  work.** Background app refresh, silent pushes, and content-available
  flows are out of scope.
- **No editing of any prior module, plugin, screen, or registry
  entry** beyond the additive registry/plugin lines.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Grant permission and fire an immediate rich notification (Priority: P1)

A user taps the "Notifications Lab" card from the module list. The
screen opens with six collapsible cards; the Permissions card is
expanded by default and shows status "Not determined". The user taps
Request, the iOS system prompt appears, and on grant the pill turns
green and reads "Authorized" with alerts/sounds/badges shown as
enabled. The user expands Compose & schedule, types a title and body,
picks the bundled sample image as an attachment, leaves the trigger on
"Immediate", and taps Schedule. Within 2 seconds the notification
fires (banner if the app is backgrounded; in-app foreground delivery
otherwise). The Event log card records a `received` event with the
notification identifier and timestamp.

**Why P1**: Permission grant plus an immediate, attachment-bearing
local notification is the foundation every other card depends on.
Without it the rest of the screen is inert.

**Independent Test**: On iOS, fresh install → tap card → tap Request
→ accept system prompt → expand Compose → fill title/body → pick the
sample attachment → tap Schedule → observe banner (background) or
foreground presentation, and a new entry in Event log with the
matching identifier.

**Acceptance Scenarios**:

1. **Given** the app has never requested notification permission,
   **When** the user taps Request in the Permissions card, **Then**
   the iOS system permission sheet appears and the status pill
   reflects the user's choice immediately on dismissal.
2. **Given** authorization has been granted, **When** the user
   submits the Compose form with an Immediate trigger and a bundled
   image attachment, **Then** the notification is delivered within 5
   seconds and an entry with type `received` is appended to the
   Event log within 1 second of delivery.
3. **Given** authorization is denied, **When** the user taps the
   "Open Settings" link in the Permissions card, **Then** the iOS
   Settings app opens to this app's notification settings page.
4. **Given** the app is in the foreground when an Immediate
   notification fires, **When** the system asks how to present it,
   **Then** the configured handler shows a banner with sound and
   updates the badge so the demo is visible without backgrounding the
   app.

---

### User Story 2 — Schedule a notification with a category, respond to an action (Priority: P2)

With authorization granted, the user expands Action categories,
notes the three pre-registered demos, and returns to Compose. They
fill the form, pick the `reply-text` category, set the trigger to
"In N seconds" with N=10, and tap Schedule. Ten seconds later the
notification fires with a Reply action; the user long-presses (or
pulls down) to reveal the inline text input, types a short reply, and
submits. The Event log card records an `action-response` event with
the action identifier `reply` and the user's text. Separately, the
user re-opens the screen later, sees the notification still listed in
the Delivered card, and taps Remove to clear it from Notification
Center.

**Why P2**: Actionable categories with text input are the most
distinctive UX surface in User Notifications and are the headline
demo for this module beyond the basic compose loop. The
pending/delivered lists complete the lifecycle.

**Independent Test**: With permission granted, schedule a
`reply-text`-categoried notification with a 10 s trigger → before
firing, confirm it appears in Pending list with the correct
trigger summary → after firing, respond with text → confirm an
`action-response` event with `actionIdentifier: 'reply'` and the
typed text appears in Event log within 1 s of submission → confirm
the notification appears in Delivered list and can be removed.

**Acceptance Scenarios**:

1. **Given** a notification is scheduled with an `In N seconds`
   trigger that has not yet fired, **When** the user expands the
   Pending list card, **Then** the notification appears with its
   identifier, title, and a human-readable trigger summary
   (e.g., "in 7 s"), and a Cancel button removes it from both the
   list and the iOS pending queue.
2. **Given** a notification fires with the `reply-text` category and
   the user submits inline text, **When** the action response is
   delivered to the app, **Then** an `action-response` event with
   action id `reply` and the submitted text appears in the Event log
   within 1 second.
3. **Given** the user taps the primary tap action of a delivered
   notification while the app is killed, **When** the app launches
   in response, **Then** the screen renders normally and an
   `action-response` event with `actionIdentifier:
   UNNotificationDefaultActionIdentifier` is appended to the Event
   log within 2 seconds of the screen mounting.
4. **Given** at least one notification has been delivered, **When**
   the user taps Remove on its row in the Delivered list, **Then**
   the row disappears and the notification is removed from
   Notification Center; "Clear all" removes every row.
5. **Given** the user picks a category in Compose but is on iOS
   below 10.0 (the unsupported floor), **When** they attempt to
   Schedule, **Then** the form blocks submission with an inline
   "iOS 10.0 or later required" message; this case is unreachable in
   practice because the registry sets `minIOS: '10.0'`, but the form
   still guards.

---

### User Story 3 — Time-sensitive, daily, and region triggers (Priority: P3)

The user expands Compose, sets the interruption level to
Time-Sensitive, and notes the inline banner that this requires the
Time-Sensitive entitlement (which the project does not request — the
field is still selectable so the demo records what the OS does:
delivery falls back to Active when the entitlement is absent). They
schedule a daily-at-time notification at the next minute boundary and
observe it fire on schedule. Separately, with location permission
already granted via 025, they pick the "On region entry" trigger,
choose a 100 m radius around the current location, and Schedule;
crossing into the region from outside fires the notification and the
Event log records `received` with the geofence-trigger identifier.

**Why P3**: Time-sensitive, daily, and region triggers exercise the
remaining schedule kinds and the cross-feature integration with 025.
They are not on the critical path for demoing the module.

**Independent Test**: Schedule a daily-at-time trigger one minute in
the future → wait → notification fires at the chosen time and a
`received` event is logged. Separately, with 025's "Always" or
"When in use" location authorization in place, schedule an On-region
trigger at the current location with 100 m radius → exit and re-enter
the region → notification fires on entry and a `received` event with
the corresponding identifier is logged within 60 s of crossing.

**Acceptance Scenarios**:

1. **Given** the user picks the Time-Sensitive interruption level in
   Compose, **When** the form is rendered, **Then** an inline notice
   states "Requires the Time-Sensitive entitlement; without it iOS
   delivers as Active." Submission still succeeds and the Event log
   records what the OS actually delivered.
2. **Given** the user picks Critical, **When** the form is rendered,
   **Then** an inline notice states "Requires the Critical Alerts
   entitlement; this project does not request it. Delivery falls
   back to the user's normal alert settings." Submission still
   succeeds.
3. **Given** the user schedules a Daily-at-time trigger at HH:MM,
   **When** the wall clock reaches HH:MM, **Then** the notification
   is delivered and a new pending entry for the next day's HH:MM
   appears in the Pending list (iOS auto-reschedules calendar
   triggers with `repeats: true`).
4. **Given** location authorization is granted and the user
   schedules an On-region trigger at the current fix with radius
   100 m, **When** the device crosses into the region from outside,
   **Then** the notification is delivered within 60 s and a
   `received` event with the corresponding identifier appears in the
   Event log.
5. **Given** location authorization is not granted, **When** the
   user picks "On region entry" in the trigger picker, **Then** the
   trigger picker disables the option and shows "Requires location
   permission (see Core Location Lab)".

---

### Edge Cases

- **Permission denied at the OS level** — Request is replaced with a
  disabled state plus the visible "Open Settings" link; Compose's
  Schedule button is disabled with an inline "Permission required"
  note; Pending and Delivered lists render empty without erroring.
- **Provisional authorization** — the status pill shows
  "Provisional"; scheduled notifications deliver quietly to
  Notification Center without banners or sound, and the Event log
  still records `received`.
- **Authorization downgraded while the app is open** — on the next
  foreground, the Permissions card refreshes; previously scheduled
  notifications remain in the Pending list (iOS owns the queue) and
  the user can still cancel them.
- **Attachment file missing or unreadable** — Compose validates the
  bundled attachment exists at submit time; on validation failure an
  inline error appears under the attachment picker and submission is
  blocked.
- **Attachment too large for iOS limits** — bundled samples are
  pre-sized to stay within iOS's 10 MB image attachment cap; the
  demo does not surface a runtime error path for this since the
  inputs are fixed.
- **Time-sensitive without the entitlement** — submission succeeds;
  iOS silently downgrades delivery to Active. The Event log still
  records `received`. The inline notice in Compose explains this in
  advance.
- **Critical without the entitlement** — same behavior as
  time-sensitive: submission succeeds, delivery falls back to the
  user's normal alert settings, no runtime error.
- **Focus mode / Do Not Disturb active** — banners are suppressed by
  the OS but the notification is still delivered to Notification
  Center; the Event log records `received` either way. No app code
  is required to handle Focus directly.
- **Region trigger without location permission** — the trigger
  option is disabled in the picker as described in US3 AS5; the
  Schedule button is enabled only when a valid trigger is selected.
- **App killed before the notification fires** — iOS still delivers
  the notification on schedule; tapping it cold-launches the app and
  the response is replayed into the Event log as US2 AS3 describes.
- **Pending list grows large** — the list renders as a scrollable
  view; no cap is enforced beyond iOS's own per-app pending
  notification limit (64). On the 65th add, the UI surfaces the
  platform error and refuses to append the row.
- **Delivered list cleared from Notification Center externally** —
  on the next foreground or focus event, the Delivered list refreshes
  from the OS and stale rows disappear.
- **Android delivery without a channel** — the plugin pre-registers
  the `spot.default` channel at importance `DEFAULT`; if Compose is
  used on Android, the channel id is set on every outgoing
  notification so delivery is not silent.
- **Web fallback** — only the Immediate trigger is offered; the
  trigger picker hides the other kinds. Categories, attachments,
  threading, interruption levels, badges, and the Pending /
  Delivered / Action-categories cards are replaced with the
  `IOSOnlyBanner` (the banner copy is generalized to "iOS-only
  surface" since web has no equivalent).
- **Plugin re-run idempotency** — running `expo prebuild` twice does
  not duplicate `NSUserNotificationsUsageDescription`, the Android
  channel declaration, or the `expo-notifications` plugin block.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-NL-001**: Registry MUST gain exactly one new entry with
  `id: 'notifications-lab'`, label `"Notifications Lab"`,
  `platforms: ['ios','android','web']`, and `minIOS: '10.0'`. No
  existing registry entry may be modified.
- **FR-NL-002**: `app.json` `plugins` array MUST gain exactly one
  new entry, `./plugins/with-rich-notifications`, appended after
  existing entries. No existing plugin entry may be modified or
  removed. The new plugin MUST coexist with prior plugins including
  `with-home-widgets` (014) and `with-core-location` (025).
- **FR-NL-003**: A new Expo config plugin under
  `plugins/with-rich-notifications/` MUST idempotently:
  (a) ensure `NSUserNotificationsUsageDescription` is set in the
  iOS Info.plist if absent;
  (b) register an `expo-notifications` plugin block (icon and color
  defaulted) so the SDK's own iOS/Android wiring is applied;
  (c) declare a default Android notification channel with id
  `spot.default`, name `"Default"`, and importance `DEFAULT`.
  Re-runs MUST NOT duplicate keys, channels, or plugin blocks.
- **FR-NL-004**: The module MUST live under
  `src/modules/notifications-lab/` and contain `index.tsx`
  (manifest), `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`,
  a `components/` directory (`PermissionsCard`, `ComposeForm`,
  `TriggerPicker`, `AttachmentPicker`, `CategoriesCard`,
  `PendingList`, `DeliveredList`, `EventLog`, `IOSOnlyBanner`), a
  `hooks/` directory containing `useNotificationCenter.ts`, plus
  module-level files `categories.ts`, `interruption-levels.ts`, and
  `bundled-attachments.ts`.
- **FR-NL-005**: The Permissions card MUST display the current
  authorization status as a pill with one of `notDetermined`,
  `provisional`, `authorized`, `denied`, `ephemeral`, MUST display
  per-setting indicators for alerts, sounds, badges, critical
  alerts, and (on iOS 15+) time-sensitive, MUST expose a Request
  button that asks for alert+sound+badge, MUST expose a "Request
  provisional" button that uses the provisional flag, and MUST
  expose an "Open Settings" deep link that opens the iOS Settings
  app at this app's notification settings page.
- **FR-NL-006**: The Compose form MUST expose, at minimum: title,
  subtitle, body (multi-line), attachment picker
  (None / one of three bundled images defined in
  `bundled-attachments.ts`), thread identifier (free text), sound
  picker (None / Default / one bundled custom sound file), an
  interruption-level segmented control with values `passive`,
  `active`, `time-sensitive`, `critical` (defined in
  `interruption-levels.ts`), a badge-number stepper bounded to
  `0..99`, a category picker (None or one of the three demo
  categories), and a trigger picker (Immediate / In N seconds with
  N integer ≥ 1 / At specific time / Daily at time / On region
  entry).
- **FR-NL-007**: The Compose form MUST disable Schedule and show an
  inline "Permission required" note when authorization is `denied`
  or `notDetermined`. With `provisional` authorization Schedule
  MUST remain enabled and the form MUST show a one-line note that
  delivery will be quiet.
- **FR-NL-008**: Selecting `time-sensitive` or `critical` in the
  interruption-level control MUST display an inline notice
  explaining the entitlement requirement and the OS fallback
  behavior; submission MUST still succeed and the Event log MUST
  record what was actually delivered.
- **FR-NL-009**: Three categories MUST be pre-registered at module
  mount via a single idempotent call in
  `hooks/useNotificationCenter.ts`:
  `yes-no` (actions: `yes`, `no`),
  `snooze-done` (actions: `snooze` [foreground=false], `done`),
  `reply-text` (actions: `reply` [text input,
  placeholder="Reply…", buttonTitle="Send"], `dismiss`).
  Identifiers MUST be defined as exported constants in
  `categories.ts`. Re-mounting the screen MUST NOT register
  duplicates.
- **FR-NL-010**: The Pending list MUST render the current
  `getAllScheduledNotificationsAsync` result, refreshed on screen
  focus and after every successful Schedule or Cancel. Each row
  MUST show identifier, title, a human-readable trigger summary,
  and a Cancel button that calls
  `cancelScheduledNotificationAsync(identifier)`. A "Cancel all"
  action MUST call `cancelAllScheduledNotificationsAsync`.
- **FR-NL-011**: The Delivered list MUST render the current
  `getPresentedNotificationsAsync` result, refreshed on screen focus
  and after every successful Remove or Clear. Each row MUST show
  identifier, title, delivered timestamp, and a Remove button that
  calls `dismissNotificationAsync(identifier)`. A "Clear all"
  action MUST call `dismissAllNotificationsAsync`.
- **FR-NL-012**: The Event log card MUST render the most recent 20
  events from a FIFO in-memory log, with each entry showing
  timestamp, event type
  (`received` / `action-response` / `dismissed`), notification
  identifier, and — for `action-response` — the action identifier
  and any text input. The log MUST be appended to by listeners
  installed in `useNotificationCenter.ts`:
  `addNotificationReceivedListener`,
  `addNotificationResponseReceivedListener`, and (where exposed)
  `addNotificationsDroppedListener` / dismissal callbacks.
  `getLastNotificationResponseAsync` MUST be consulted on first
  mount so cold-launch responses are replayed into the log.
- **FR-NL-013**: Categories card MUST render the three demo
  categories with their action ids, titles, and a flag indicating
  text-input vs button-only. An "Open last fired notification's
  actions" button MUST present an in-app sheet that lists the
  category buttons of the most recent received notification (read
  from the same source as the Event log) and lets the user invoke
  each action — synthesizing the same `action-response` log entry
  the OS would produce. If no notification has been received in
  this session, the button MUST be disabled with tooltip "No
  notification received yet".
- **FR-NL-014**: The trigger picker MUST translate selections into
  `expo-notifications` triggers as follows:
  Immediate → `null`;
  In N seconds → `{ seconds: N, repeats: false }`;
  At specific time → `{ date: <chosen Date> }`;
  Daily at time → `{ hour, minute, repeats: true }`;
  On region entry → an `expo-notifications`
  `LocationTrigger`-equivalent that registers a geofence task whose
  name follows the pattern from feature 025
  (`spot-geofence-<uuid>`) and posts the notification when the
  region's enter callback fires. Region triggers MUST be disabled
  if location authorization is not granted.
- **FR-NL-015**: On Android, only the Compose & schedule and Event
  log cards MUST be functional; Permissions MUST show
  Android-equivalent permission state via
  `getPermissionsAsync` (reduced surface — alerts only); Categories
  and the cross-platform Pending/Delivered lists MUST render via
  the Android-supported `expo-notifications` calls without
  crashing; iOS-only fields in Compose (subtitle, interruption
  level, time-sensitive, attachment, thread identifier) MUST be
  hidden behind a single "iOS-only" disclosure banner inside the
  form. On Android the `spot.default` channel MUST be set on every
  outgoing notification.
- **FR-NL-016**: On web, the Compose form MUST be reduced to title
  and body with an Immediate-only trigger; submission MUST call the
  browser `Notification` API with permission requested on the
  Request button; all other cards MUST render the `IOSOnlyBanner`.
  No `expo-notifications` API that is undefined on web may be
  invoked at runtime.
- **FR-NL-017**: All six cards MUST be collapsible and MUST
  preserve collapse state for the lifetime of the screen (no
  persistence across navigations is required).
- **FR-NL-018**: All in-memory logs and lists MUST be capped: the
  Event log at 20 entries (FIFO eviction); Pending and Delivered
  lists are bounded by iOS's own per-app caps and are sourced from
  the OS on every refresh. No log or list may grow without bound.
- **FR-NL-019**: No remote-push API may be called from this module:
  `getDevicePushTokenAsync`, `getExpoPushTokenAsync`, and any
  network calls related to push delivery are forbidden. The module
  MUST be functional with the device offline.
- **FR-NL-020**: The full `pnpm check` suite MUST pass (lint,
  typecheck, tests) after the feature lands. No existing test may
  regress.

### Key Entities

- **RegistryEntry** — the new
  `{ id: 'notifications-lab', label: 'Notifications Lab',
  platforms: ['ios','android','web'], minIOS: '10.0', screen }`
  record appended to `src/modules/registry.ts`.
- **PermissionsState** — `{ status: 'notDetermined' | 'provisional'
  | 'authorized' | 'denied' | 'ephemeral', alerts: boolean,
  sounds: boolean, badges: boolean, criticalAlerts: boolean,
  timeSensitive: boolean | null }`. `timeSensitive` is `null` on
  iOS < 15 or non-iOS platforms.
- **ComposeDraft** — the in-progress form state:
  `{ title: string, subtitle: string, body: string, attachmentId:
  string | null, threadId: string, soundId: 'none' | 'default' |
  'custom-bundled', interruptionLevel: 'passive' | 'active' |
  'time-sensitive' | 'critical', badge: number, categoryId:
  CategoryId | null, trigger: TriggerSpec }`.
- **TriggerSpec** — discriminated union:
  `{ kind: 'immediate' }`,
  `{ kind: 'in-seconds', seconds: number }`,
  `{ kind: 'at-time', date: Date }`,
  `{ kind: 'daily-at-time', hour: number, minute: number }`,
  `{ kind: 'on-region-entry', latitude: number, longitude: number,
  radius: 50 | 100 | 500 }`.
- **CategoryId** — `'yes-no' | 'snooze-done' | 'reply-text'`,
  exported from `categories.ts`.
- **CategoryDefinition** — `{ id: CategoryId, actions: Array<{ id:
  string, title: string, options?: { foreground?: boolean,
  destructive?: boolean, authenticationRequired?: boolean }, input?:
  { placeholder: string, buttonTitle: string } }> }`.
- **InterruptionLevel** — `'passive' | 'active' | 'time-sensitive'
  | 'critical'`, with metadata in `interruption-levels.ts` indicating
  which require entitlements.
- **BundledAttachment** — `{ id: string, label: string, requireAsset:
  number, mimeType: 'image/png' | 'image/jpeg' }`. The three demo
  images MUST live under `assets/notifications/` (no edits required to
  any prior assets directory).
- **PendingNotification** — projection of
  `getAllScheduledNotificationsAsync`'s result:
  `{ identifier: string, title: string, triggerSummary: string }`.
- **DeliveredNotification** — projection of
  `getPresentedNotificationsAsync`'s result:
  `{ identifier: string, title: string, deliveredAt: Date }`.
- **NotificationEvent** — discriminated union appended to the Event
  log: `{ kind: 'received', identifier, at: Date }`,
  `{ kind: 'action-response', identifier, actionIdentifier: string,
  textInput: string | null, at: Date }`,
  `{ kind: 'dismissed', identifier, at: Date }`. The log is bounded
  to the last 20 entries.

## Non-Functional Requirements

- **NFR-NL-001 (Performance)**: Opening the Notifications Lab screen
  MUST render to first paint within 500 ms on a recent iPhone;
  permission status, Pending list, and Delivered list MUST populate
  within 1 s of mount.
- **NFR-NL-002 (Responsiveness)**: Schedule, Cancel, Remove, Clear
  all, and Cancel all MUST update their respective lists within
  500 ms of the OS call resolving.
- **NFR-NL-003 (Footprint)**: The new dependency set is exactly
  `expo-notifications` (added via `npx expo install` so the
  SDK-aligned version is selected). No other runtime dependency is
  added.
- **NFR-NL-004 (Idempotency)**: Running `npx expo prebuild` twice
  in succession produces an Info.plist with no duplicated keys, an
  `AndroidManifest.xml` / channel registration with no duplicated
  channel, and an `app.json` plugin block that remains a single
  entry per plugin.
- **NFR-NL-005 (Offline)**: The module MUST be fully functional with
  the device in airplane mode. No code path may require network.
- **NFR-NL-006 (Safety)**: No notification scheduled by this module
  may persist beyond an explicit user action; "Cancel all" MUST
  remove every entry the module created. The module MUST NOT
  schedule notifications eagerly on screen mount.
- **NFR-NL-007 (Accessibility)**: All buttons and controls in the
  six cards MUST have `accessibilityLabel`s; the status pill and
  per-setting indicators MUST be readable by VoiceOver.
- **NFR-NL-008 (Logging hygiene)**: The in-memory Event log is the
  only sink for notification-lifecycle data; no `console.log` of
  notification contents may ship in release builds (gated by
  `__DEV__`).
- **NFR-NL-009 (Constitution v1.1.0)**: Additive integration only;
  no edits to unrelated modules, screens, or plugins; all changes
  pass `pnpm check`.

## Acceptance Criteria

A feature delivery is accepted when **all** of the following hold:

- **AC-NL-001**: The registry contains a single new entry with
  `id: 'notifications-lab'` and the platforms / minIOS fields above.
  Diff against `main` shows registry size +1 and no other registry
  edits.
- **AC-NL-002**: `app.json` `plugins` contains a single new entry
  `./plugins/with-rich-notifications`. Diff shows +1 plugin and no
  other plugin edits.
- **AC-NL-003**: `package.json` adds `expo-notifications` and
  `pnpm-lock.yaml` is updated; no other dependency is added.
- **AC-NL-004**: `pnpm check` (lint, typecheck, tests) passes with
  zero new failures.
- **AC-NL-005**: On a fresh install on iOS, US1 end-to-end test
  passes: permission grant → Immediate notification with attachment
  fires within 5 s → Event log records `received`.
- **AC-NL-006**: US2 end-to-end test passes: a `reply-text`
  notification is scheduled with In-N-seconds (N=10), appears in
  Pending list with the correct trigger summary, fires on time,
  text-input action response is recorded in Event log within 1 s,
  and the notification is removable from Delivered list.
- **AC-NL-007**: US3 end-to-end tests pass: time-sensitive selection
  shows the entitlement notice and still delivers (as Active in
  practice); a Daily-at-time trigger fires at the chosen minute and
  re-appears in Pending for the next day; an On-region-entry trigger
  fires on entry within 60 s and is logged.
- **AC-NL-008**: Cold-launch test passes: app killed → notification
  fires → user taps it → app launches → Event log shows an
  `action-response` event with the default action identifier within
  2 s of the screen mounting.
- **AC-NL-009**: Idempotency test passes: running
  `npx expo prebuild` twice produces unchanged Info.plist and
  Android channel declarations on the second run (no duplicate
  keys, no duplicate channels).
- **AC-NL-010**: Cross-platform test passes: opening the screen on
  Android renders without crashes, only the supported cards are
  active, the `spot.default` channel is set on outgoing
  notifications, and an Immediate compose fires successfully. On
  web, only Immediate compose via the browser API is offered and
  every other card shows the iOS-only banner.
- **AC-NL-011**: No-remote-push audit passes: a grep for
  `getDevicePushTokenAsync`, `getExpoPushTokenAsync`, and any
  HTTP call related to notifications inside
  `src/modules/notifications-lab/` returns zero matches.
- **AC-NL-012**: Coexistence test passes: 014's Home Widgets and
  025's Core Location Lab continue to function unchanged with the
  new plugin installed.

## Out of Scope

- Remote push (APNs, FCM, Expo Push), push tokens, server-side
  payload composition, and any background remote delivery.
- Notification Service Extension and Notification Content Extension
  targets; rich payload mutation requiring an NSE.
- Communication notifications and Intents-donation–based avatar
  rendering (belongs with feature 013).
- Custom grouping summaries beyond `threadIdentifier`;
  `summaryArgument` formatting.
- Live Activities and Dynamic Island (owned by feature 007).
- Background app refresh, content-available silent pushes, and any
  background work driven by notification delivery.
- Persistence of the Event log, Pending list snapshots, or compose
  drafts across app launches.
- Localization of notification copy beyond what the user types.
- Sound asset authoring; the demo ships exactly one bundled custom
  sound file plus the system default.
- Image-attachment authoring or in-app picking from the user's
  photo library; only three pre-bundled images are offered.
- Editing or migrating any prior module, screen, plugin, or
  registry entry.

## Open Questions (resolved)

All ambiguities below were resolved autonomously with reasonable
defaults; none remain blocking.

1. **Where do bundled attachments live?** — Resolved: under
   `assets/notifications/` as three small (<200 KB) PNGs named
   `sample-1.png`, `sample-2.png`, `sample-3.png`. This is purely
   additive and avoids editing any prior assets directory.
2. **Where does the bundled custom sound live?** — Resolved: under
   `assets/notifications/sounds/notification.caf` (or `.wav` if the
   toolchain prefers); the plugin block points
   `expo-notifications` at it via the `sounds` array. Default sound
   remains the OS default.
3. **Default Android channel id and importance?** — Resolved:
   `spot.default`, importance `DEFAULT`. Pre-registered by the
   plugin so first-launch delivery on Android works without any
   in-app code.
4. **What is the foreground presentation policy?** — Resolved:
   `setNotificationHandler` returns
   `{ shouldShowBanner: true, shouldShowList: true, shouldPlaySound:
   true, shouldSetBadge: true }` so the demo is visible without
   backgrounding the app. Users can still observe quiet behavior by
   choosing `passive` interruption level.
5. **How do we treat the Time-Sensitive entitlement?** — Resolved:
   we do NOT request it. The Compose form lets the user pick
   `time-sensitive`; an inline notice explains the OS will fall
   back to Active. The Event log records what was actually
   delivered. Same approach for Critical.
6. **Are the demo categories registered once globally or per
   screen mount?** — Resolved: registered idempotently by
   `useNotificationCenter.ts` on first mount of the screen; iOS
   `setNotificationCategoryAsync` is itself idempotent on identifier
   collisions, so this is safe.
7. **Trigger summary format in Pending list?** — Resolved:
   Immediate triggers do not appear (they fire instantly).
   In-seconds renders as `"in <Ns>"` (or `"now"` once expired),
   At-time renders as locale time string, Daily renders as
   `"daily at HH:MM"`, On-region renders as `"on enter region
   <8-char id>"`.
8. **Region trigger geofence task naming?** — Resolved: reuses
   025's pattern, `spot-geofence-<uuid>`, so 025 and 026 cannot
   collide on task names. The notifications module owns task names
   prefixed with its own UUIDs.
9. **What if a region trigger is scheduled but location permission
   is later revoked?** — Resolved: the OS suspends geofence
   delivery; the entry remains in the Pending list and the user can
   cancel it manually. No automatic cleanup.
10. **Maximum N for "In N seconds"?** — Resolved: `1..86400` (1 s
    to 24 h). The stepper enforces the bound; for longer schedules
    use At-specific-time.
11. **Should the screen attempt to detect Focus / Do Not Disturb
    state?** — Resolved: no. The Permissions card surfaces
    `time-sensitive` capability (which is the only programmatically
    visible Focus signal); behavior under Focus is left to the OS
    and the Event log records what actually arrives.
12. **Should the Categories card let the user define custom
    categories?** — Resolved: no. The three pre-registered demos
    cover the meaningful axes (binary buttons, button with
    foreground/background contrast, text input). Custom-category
    authoring would expand the spec without adding pedagogical
    value.
13. **Foreground vs background presentation toggle?** — Resolved:
    not exposed as a user control; the foreground handler always
    shows the banner per item 4. A demonstration of "silent in
    foreground" is achievable by choosing `passive` interruption
    level.
14. **Web fallback minimum?** — Resolved: title + body + Immediate
    only via `new Notification()` after `Notification.requestPermission()`.
    All other cards show the `IOSOnlyBanner` with copy generalized
    to "iOS-only surface".
15. **Do we ship a custom notification icon for Android?** —
    Resolved: no. The default `expo-notifications` icon is used so
    the plugin block remains minimal and we avoid editing any
    asset pipeline.

## Assumptions

- `expo-notifications` ships an Expo config plugin; our
  `with-rich-notifications` plugin invokes it (or composes with it
  in `app.json`) rather than re-implementing its native wiring.
- `expo-task-manager` (added by feature 025) is the appropriate
  dependency for the geofence-task path used by the On-region
  trigger; no new task-manager dependency is added here.
- `expo-location` (added by feature 024) provides the current fix
  used when authoring an On-region trigger; if no fix is available
  the trigger picker disables the option with the same gating used
  in 025.
- iOS 10.0 is the floor for User Notifications; the registry
  enforces `minIOS: '10.0'`. Time-sensitive interruption level is
  silently downgraded on iOS < 15.
- The project does not request the Time-Sensitive or Critical
  Alerts entitlements; the demo intentionally exposes those levels
  to illustrate the OS fallback rather than to deliver them.
- Notification Center state (Pending / Delivered) is owned by iOS;
  the lists are projections refreshed on focus and after every
  mutating call. We do not maintain a parallel store.
- The Event log lives only in memory; loss across app launches is
  acceptable. Cold-launch responses are recovered once via
  `getLastNotificationResponseAsync`.
- The bundled attachments and custom sound are small enough that
  the iOS attachment limits (10 MB image, 5 MB audio) are not at
  risk; no runtime size validation is required.
- Constitution v1.1.0 governs this feature: additive integration
  only, no edits to unrelated modules, all changes pass
  `pnpm check`.
