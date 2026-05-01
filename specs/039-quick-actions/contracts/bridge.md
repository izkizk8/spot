# Contract: `expo-quick-actions` bridge surface

**Feature**: 039-quick-actions
**Consumed by**: `src/modules/quick-actions-lab/hooks/useQuickActions.ts`
**Mocked at**: `jest.mock('expo-quick-actions', ...)` per test

This is the **minimum** surface our code depends on. Renames in upstream
`expo-quick-actions` v6.x.y must be absorbed inside `useQuickActions.ts`
and `DynamicActionsManager.tsx` only.

---

## Native action shape (library-defined; we adapt)

```ts
type Action = {
  id: string;          // === our QuickActionDefinition.type
  title: string;
  subtitle?: string;
  icon?: string;       // SF Symbol name (iOS) or drawable (Android)
  params?: Record<string, unknown>;  // === our QuickActionDefinition.userInfo
};
```

We adapt with two pure helpers in `default-actions.ts`:

```ts
toLibraryAction(def: QuickActionDefinition): Action;
fromLibraryAction(a: Action): InvocationEvent;
```

## Methods we call

| Symbol | Signature | Where used | Failure mode |
|---|---|---|---|
| `setItems` | `(items: Action[]) => Promise<void>` | DynamicActionsManager add/remove/reorder; Reset | Reject → toast "Could not update shortcuts" (dev-only console.error); state rolls back |
| `getItems` | `() => Promise<Action[]>` | DynamicActionsManager mount (initial sync) | Reject → render with empty `dynamicItems` |
| `clearItems` | `() => Promise<void>` | Reset (sugar for `setItems([])`) | Same as `setItems` |
| `getInitial` | `() => Promise<Action \| null>` | `useQuickActions` mount, once | Reject or `null` → no cold-launch event; fall through to listener |
| `addListener` | `(handler: (action: Action) => void) => Subscription` | `useQuickActions` mount → cleanup on unmount | Subscription leak prevented by `useEffect` cleanup |

## Side-effect contract (FR-009)

When the listener fires for an action with `id === 'add-mood-happy'`, the
hook **also** writes `{ mood: 'happy', source: 'quick-action', timestamp }`
to the in-memory mood log via `appendMoodEntry` from `mood-log.ts`. This
is in addition to the route dispatch and last-invoked update.

## Routing contract (FR-008)

For every invocation:

1. If `params.route` is a non-empty string → call `router.replace(route)`
   when invoked from cold-launch (`getInitial` resolution path), else
   `router.navigate(route)`.
2. If no `params` or no `params.route` → no-op + `console.warn(action.id)`
   (dev only).

## Subscription lifecycle

```ts
useEffect(() => {
  let cancelled = false;
  qa.getInitial().then((a) => { if (!cancelled && a) handle(a, /*cold*/ true); });
  const sub = qa.addListener((a) => handle(a, /*cold*/ false));
  return () => { cancelled = true; sub.remove(); };
}, []);
```

## Mock skeleton (re-used in every test)

```ts
jest.mock('expo-quick-actions', () => ({
  setItems: jest.fn().mockResolvedValue(undefined),
  getItems: jest.fn().mockResolvedValue([]),
  getInitial: jest.fn().mockResolvedValue(null),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  clearItems: jest.fn().mockResolvedValue(undefined),
}));
```

## Fallback bridge surface (only if Decision 1 fallback fires)

A hand-written Swift module would expose **the same JS-side names** so
`useQuickActions.ts` is unchanged. Only the import site moves from
`expo-quick-actions` to `@/native/quick-actions`. Spec / tests untouched.
