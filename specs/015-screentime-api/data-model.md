# Phase 1 — Data Model: ScreenTime / FamilyControls Showcase

This document defines the in-memory and on-disk data shapes used by feature 015. The authoritative TypeScript declarations live in:

- `src/modules/screentime-lab/screentime-state.ts` — reducer state + action types
- `src/native/screentime.types.ts` — bridge contract types (covered in [contracts/](./contracts/))

---

## 1. JS reducer state (`ScreenTimeState`)

### `AuthorizationStatus`

```ts
type AuthorizationStatus = 'notDetermined' | 'approved' | 'denied';
```

| Value | Meaning |
|-------|---------|
| `'notDetermined'` | The user has not yet been prompted, OR the entitlement is missing (probe failed). |
| `'approved'` | The user has granted FamilyControls authorization. |
| `'denied'` | The user explicitly declined the system prompt. |

**Source**: Mirrors Apple's `AuthorizationStatus` enum (cases `.notDetermined`, `.approved`, `.denied`). Bridged as a string literal union — never a number — to keep the JS layer self-describing.

### `SelectionSummary`

```ts
interface SelectionSummary {
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
  rawSelectionToken: string;   // opaque, base64-encoded FamilyActivitySelection
}
```

**Validation rules**:
- All counts ≥ 0.
- `rawSelectionToken` is treated as opaque by JS; only the Swift bridge decodes it.
- An "empty selection" is represented by `null` at the `ScreenTimeState` level (not by `applicationCount + categoryCount + webDomainCount === 0`, because Apple's picker can return a token that decodes to an empty selection set in unusual cases).

### `MonitoringSchedule`

```ts
interface MonitoringSchedule {
  startHour: number;     // 0–23
  startMinute: number;   // 0–59
  endHour: number;       // 0–23
  endMinute: number;     // 0–59
}
```

**Validation rules**:
- `startHour` ∈ [0, 23]; `endHour` ∈ [0, 23]; minutes ∈ [0, 59].
- For this feature, the schedule is **hard-coded** to `{ startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 }` (FR-008, AS-3.1). The type is exposed for future flexibility but the UI does not edit it.

### `ScreenTimeState`

```ts
interface ScreenTimeState {
  /** Probed once at mount; null while the probe is in flight. */
  entitlementsAvailable: boolean | null;

  /** Authorization status; reflects the most recent bridge response. */
  authStatus: AuthorizationStatus;

  /** Persisted selection (App Group); null when no selection has been made. */
  selectionSummary: SelectionSummary | null;

  /** Cached locally; the source of truth is ManagedSettingsStore on the device. */
  shieldingActive: boolean;

  /** Cached locally; the source of truth is DeviceActivityCenter on the device. */
  monitoringActive: boolean;

  /** Active monitoring schedule when monitoringActive=true; null otherwise. */
  schedule: MonitoringSchedule | null;

  /** Most recent native error or success message; surfaced in the per-card status text. */
  lastError: string | null;
}
```

**Initial state**:
```ts
const initialState: ScreenTimeState = {
  entitlementsAvailable: null,
  authStatus: 'notDetermined',
  selectionSummary: null,
  shieldingActive: false,
  monitoringActive: false,
  schedule: null,
  lastError: null,
};
```

### State invariants

| Invariant | Enforced by |
|-----------|-------------|
| `shieldingActive === true` ⇒ `selectionSummary !== null` | Reducer rejects `SHIELDING_APPLIED` when `selectionSummary === null` |
| `monitoringActive === true` ⇒ `schedule !== null` | Reducer rejects `MONITORING_STARTED` without a schedule payload |
| `entitlementsAvailable === false` ⇒ all action-triggered transitions become `BRIDGE_ERROR` | Card components disable their buttons; bridge rejects with `EntitlementMissingError` |
| `lastError` is cleared on the **next successful** transition (not by a separate clear action) | Reducer `case '*'` success branches |

---

## 2. Reducer actions (`ScreenTimeAction`)

A discriminated union; every action carries a literal `type` string used by the reducer's `switch`.

```ts
type ScreenTimeAction =
  | { type: 'ENTITLEMENT_PROBED';      payload: { available: boolean } }
  | { type: 'AUTH_STATUS_CHANGED';     payload: { status: AuthorizationStatus } }
  | { type: 'SELECTION_HYDRATED';      payload: { summary: SelectionSummary | null } }
  | { type: 'SELECTION_PICKED';        payload: { summary: SelectionSummary } }
  | { type: 'SELECTION_CLEARED' }
  | { type: 'SHIELDING_APPLIED' }
  | { type: 'SHIELDING_CLEARED' }
  | { type: 'MONITORING_STARTED';      payload: { schedule: MonitoringSchedule } }
  | { type: 'MONITORING_STOPPED' }
  | { type: 'BRIDGE_ERROR';            payload: { message: string } };
```

### Transition table

| Action | Pre-state guard | Post-state effect |
|--------|-----------------|-------------------|
| `ENTITLEMENT_PROBED` | always allowed | sets `entitlementsAvailable` |
| `AUTH_STATUS_CHANGED` | always allowed | sets `authStatus`, clears `lastError` |
| `SELECTION_HYDRATED` | always allowed (mount only) | sets `selectionSummary` from persistence |
| `SELECTION_PICKED` | `entitlementsAvailable === true` | sets `selectionSummary`, clears `lastError` |
| `SELECTION_CLEARED` | always allowed | sets `selectionSummary = null`; if `shieldingActive`, also sets `shieldingActive = false` and emits a follow-up clear-shielding bridge call |
| `SHIELDING_APPLIED` | `selectionSummary !== null` AND `entitlementsAvailable === true` | sets `shieldingActive = true`, clears `lastError` |
| `SHIELDING_CLEARED` | always allowed | sets `shieldingActive = false`, clears `lastError` |
| `MONITORING_STARTED` | `entitlementsAvailable === true`, payload schedule is valid | sets `monitoringActive = true`, sets `schedule`, clears `lastError` |
| `MONITORING_STOPPED` | always allowed | sets `monitoringActive = false`, sets `schedule = null`, clears `lastError` |
| `BRIDGE_ERROR` | always allowed | sets `lastError = payload.message`; **no other field changes** |

All transitions are **pure functions** — `reducer(state, action) -> state` — and covered 1-for-1 by `screentime-state.test.ts`.

---

## 3. Bridge response shapes

Documented in [contracts/screentime-bridge.contract.ts](./contracts/screentime-bridge.contract.ts). Summary:

| Method | Resolves with | Rejects with |
|--------|---------------|--------------|
| `isAvailable()` | `boolean` (sync) | — |
| `entitlementsAvailable()` | `boolean` | never (catches internally) |
| `requestAuthorization()` | `AuthorizationStatus` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |
| `getAuthorizationStatus()` | `AuthorizationStatus` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |
| `pickActivity()` | `SelectionSummary` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` \| `PickerCancelledError` |
| `applyShielding(token)` | `void` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |
| `clearShielding()` | `void` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |
| `startMonitoring(token, schedule)` | `void` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |
| `stopMonitoring()` | `void` | `EntitlementMissingError` \| `ScreenTimeNotSupportedError` |

---

## 4. Persisted shape — App Group `UserDefaults`

**Suite name**: `group.com.spot.shared` (from feature 014; consumed read+write).
**Key namespace**: `screentime.*` (avoids collision with feature 014's `widgets.*` keys).

| Key | Type (Swift / JSON) | Owner | Notes |
|-----|---------------------|-------|-------|
| `screentime.selection.token` | `String` (base64-encoded `FamilyActivitySelection`) | Host app + monitor extension (read-only in extension) | Written by `pickActivity()`; cleared by `SELECTION_CLEARED`. |
| `screentime.selection.applicationCount` | `Int` | Host app | Cached for fast hydration without decoding the token. |
| `screentime.selection.categoryCount` | `Int` | Host app | Same as above. |
| `screentime.selection.webDomainCount` | `Int` | Host app | Same as above. |
| `screentime.auth.status` | `String` (`"notDetermined"` \| `"approved"` \| `"denied"`) | Host app | Cached; revalidated on next `getAuthorizationStatus()` call. |
| `screentime.monitoring.activityName` | `String` (e.g., `"spot.screentime.daily"`) | Host app + monitor extension (read-only in extension) | Stable name used for `DeviceActivityCenter.startMonitoring(_:during:)` / `stopMonitoring(_:)`. |
| `screentime.monitoring.schedule` | `Data` (JSON-encoded `MonitoringSchedule`) | Host app | Persisted so the UI can re-display the active schedule after relaunch. |

**Hydration flow** (on screen mount):
1. Read all `screentime.*` keys from the App Group `UserDefaults` (or fall back to in-memory Map if the suite is `nil`).
2. Dispatch `ENTITLEMENT_PROBED`, then `AUTH_STATUS_CHANGED`, then `SELECTION_HYDRATED`, then (if `monitoring.activityName` is non-empty and matches an active schedule) `MONITORING_STARTED`.
3. `shieldingActive` is **not** persisted directly — the source of truth is `ManagedSettingsStore`; the host app does not query it on mount (Apple's API is one-way write), so the cached `shieldingActive` flag is conservatively reset to `false` on cold launch. The user can re-apply if they expected it active. This trade-off is documented in `quickstart.md`.

**Fallback** (App Group missing):
- Use a module-scoped `Map<string, unknown>` as a transient store for the session.
- Log `[screentime] App Group not configured — using in-memory persistence (state will not survive relaunch)` via `console.warn` in dev (`__DEV__`) only.

---

## 5. Entity relationships

```text
AuthorizationCenter (Apple, 1)  ──auth──>  ScreenTimeState.authStatus
FamilyActivityPicker (Apple)    ──pick──>  SelectionSummary  ──persist──>  App Group UserDefaults
                                                │
                                                ├──>  ManagedSettingsStore.shield.*  (apply/clear)
                                                │
                                                └──>  DeviceActivityCenter.startMonitoring  ─launches─>  DeviceActivityMonitorExtension
                                                                                                              │
                                                                                                              └─OSLog─> Console.app
```

The `SelectionSummary` is the central entity: it gates Shielding (`applyShielding` requires a non-null summary), feeds the monitor extension (read from the App Group), and is the only piece of user-derived data persisted.
