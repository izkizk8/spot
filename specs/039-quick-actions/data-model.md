# Data Model: Quick Actions Module

**Feature**: 039-quick-actions
**Date**: 2026-04-30

This module ships **three** TypeScript types. None are persisted to disk —
all are in-memory or platform-managed.

---

## 1. `QuickActionDefinition`

Source of truth for a single shortcut, used by both the static (Info.plist)
list and the dynamic (`UIApplication.shared.shortcutItems`) list.

```ts
export interface QuickActionDefinition {
  /**
   * Stable identifier sent in the action callback. Bundle-id-prefixed
   * recommended on iOS but not enforced.
   * Examples: 'open-liquid-glass', 'add-mood-happy'.
   */
  type: string;

  /** User-visible row title (≤ 32 chars recommended). */
  title: string;

  /** Optional second line in the menu. */
  subtitle?: string;

  /** SF Symbol system name (e.g. 'drop.fill', 'gauge'). */
  iconName: string;

  /**
   * Carried through to invocation. `route` is required; the routing
   * layer dispatches to it via expo-router.
   */
  userInfo: {
    route: string;
    [key: string]: unknown;
  };
}
```

### Validation rules

| Field | Rule | Source |
|---|---|---|
| `type` | non-empty, matches `/^[a-z][a-z0-9-]*$/` (lowercase kebab) | edge case 4 / FR-006 |
| `title` | non-empty after trim | edge case 4 |
| `subtitle` | optional; if present, non-empty after trim | spec |
| `iconName` | non-empty; project does not enforce SF Symbol existence (graceful fallback per edge case 3) | spec |
| `userInfo.route` | non-empty; SHOULD start with `/modules/` for module deep links; routing layer no-ops on unknown routes | FR-008, Story 6 AS#4 |

### The 4 defaults (single source of truth — `default-actions.ts`)

```ts
export const DEFAULT_QUICK_ACTIONS: readonly QuickActionDefinition[] = [
  {
    type: 'open-liquid-glass',
    title: 'Open Liquid Glass',
    subtitle: 'Material playground',
    iconName: 'drop.fill',
    userInfo: { route: '/modules/liquid-glass-playground' },
  },
  {
    type: 'open-sensors',
    title: 'Open Sensors',
    subtitle: 'Motion & device data',
    iconName: 'gauge',
    userInfo: { route: '/modules/sensors-playground' },
  },
  {
    type: 'open-audio-lab',
    title: 'Open Audio Lab',
    subtitle: 'Recording demo',
    iconName: 'mic.fill',
    userInfo: { route: '/modules/audio-lab' },
  },
  {
    type: 'add-mood-happy',
    title: 'Add Mood: Happy',
    subtitle: 'Quick journal entry',
    iconName: 'face.smiling',
    userInfo: { route: '/modules/app-intents-lab', mood: 'happy' },
  },
] as const;
```

`default-actions.ts` is consumed by:

- `plugins/with-quick-actions/index.ts` — converts to Info.plist
  `UIApplicationShortcutItems` array.
- `src/modules/quick-actions-lab/components/StaticActionsList.tsx` —
  renders the read-only list.

---

## 2. `InvocationEvent`

Payload surfaced by `LastInvokedCard` and the routing layer.

```ts
export interface InvocationEvent {
  type: string;
  userInfo: Record<string, unknown>;
  /** ISO 8601, captured at the moment the listener / initial fires. */
  timestamp: string;
}
```

### State transitions

```text
              cold-launch w/ shortcut
                       │
   (no event) ─────────┼────────────────► InvocationEvent (latest)
                       │                       │
                       │   warm-launch listener fires
                       └─────────► overwrite ──┘
                                  (most-recent-wins)
```

- **Empty state** (`null`): app launched without a quick action this
  session. `LastInvokedCard` shows "No quick action invoked this session"
  (Story 4 AS#3).
- **Latest-wins**: each new invocation overwrites the prior — no history
  array. (Spec does not require history.)
- **Lifetime**: in-memory only; resets on app close.

---

## 3. `ManagerState`

Local UI state of the **DynamicActionsManager**. Not exported beyond the
component (declared in the component file).

```ts
interface ManagerState {
  /**
   * For UI-test purposes the user can "pretend" a smaller static count.
   * Range 1..4. Default = real staticCount = 4.
   */
  effectiveStaticCount: 1 | 2 | 3 | 4;

  /** The current dynamic list (mirror of UIApplication.shared.shortcutItems). */
  dynamicItems: QuickActionDefinition[];
}
```

### Invariants

| Invariant | Enforced by | Reference |
|---|---|---|
| `dynamicItems.length ≤ 4 - effectiveStaticCount` | `addItem()` precondition; "Add" button disabled when cap reached; banner on attempt | FR-006, Story 3 AS#1, AS#5 |
| `dynamicItems.length ≥ 0` | `removeItem(index)` no-op when empty | edge case 5 |
| Reorder bounds | up arrow disabled at index 0; down arrow disabled at last index | edge case 5 |
| Mutations propagate | every `setManagerState({ dynamicItems: ... })` calls `setItems(dynamicItems)` on the bridge | FR-006 |

### State transitions

```text
        ┌──────────────────┐
        │ initial          │
        │ effectiveStatic=4│
        │ dynamicItems=[]  │
        └────────┬─────────┘
                 │ user toggles "Pretend N statics"
                 ▼
        effectiveStaticCount := N (1..4)
                 │
                 │ user taps "Add"  (precond: items.length < 4-N)
                 ▼
        dynamicItems += newItem  → bridge.setItems(items)
                 │
                 │ user taps "Remove" + confirm
                 ▼
        dynamicItems -= items[i] → bridge.setItems(items)
                 │
                 │ user taps "↑" or "↓"
                 ▼
        dynamicItems := reordered → bridge.setItems(items)
                 │
                 │ user taps "Reset" + confirm
                 ▼
        dynamicItems := []        → bridge.setItems([])
```

---

## Relationships

```text
DEFAULT_QUICK_ACTIONS  ──read by──►  with-quick-actions plugin → Info.plist
        │
        └──read by──►  StaticActionsList (UI)

ManagerState.dynamicItems  ──synced to──►  expo-quick-actions.setItems()
                                                │
                                                └──persisted by iOS

InvocationEvent  ◄──emitted by──  expo-quick-actions.addListener
                                  expo-quick-actions.getInitial
                 ──consumed by──► LastInvokedCard (display)
                                   useQuickActions (route + mood-log)
```

No relational keys / FKs — pure value objects.
