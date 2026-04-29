# Contract: invocation → expo-router dispatch

**Feature**: 039-quick-actions
**Owner**: `src/modules/quick-actions-lab/hooks/useQuickActions.ts`

---

## Inputs

```ts
type Invocation = {
  source: 'cold' | 'warm';
  type: string;            // action id, e.g. 'open-sensors'
  userInfo: Record<string, unknown> | undefined;
  timestamp: string;       // ISO 8601
};
```

## Outputs (effects)

| Condition | Effect |
|---|---|
| `userInfo.route` is a non-empty string AND `source === 'cold'` | `router.replace(userInfo.route)` |
| `userInfo.route` is a non-empty string AND `source === 'warm'` | `router.navigate(userInfo.route)` |
| `userInfo.route` missing / empty / non-string | **no navigation**; in `__DEV__` only: `console.warn('[quick-actions] no route for', type)` |
| `type === 'add-mood-happy'`, regardless of route | additionally: `appendMoodEntry({ mood: 'happy', source: 'quick-action', timestamp })` |
| Any invocation | `setLastInvoked({ type, userInfo: userInfo ?? {}, timestamp })` (overwrites prior) |

## Execution model

- All effects are **synchronous** within the listener except the
  `router.*` call, which itself is fire-and-forget.
- Reset (`setItems([])`) called concurrently with an in-flight invocation
  MUST NOT cancel the in-flight `router.navigate()` (edge case 7).
  Implementation: `clearItems()` updates only the dynamic-list state; it
  does not touch the routing path.

## Routes table (defaults)

| `type` | `userInfo.route` |
|---|---|
| `open-liquid-glass` | `/modules/liquid-glass-playground` |
| `open-sensors` | `/modules/sensors-playground` |
| `open-audio-lab` | `/modules/audio-lab` |
| `add-mood-happy` | `/modules/app-intents-lab` |

Dynamic actions may carry any project-internal route. The hook does
**not** validate the route exists in `expo-router`'s tree — invalid
routes will surface as router errors at navigate-time, which the lab
considers acceptable for an educational module.

## Test expectations (extracted)

```ts
it('cold-launch open-sensors → router.replace', async () => {
  (qa.getInitial as jest.Mock).mockResolvedValue({
    id: 'open-sensors', title: '', params: { route: '/modules/sensors-playground' },
  });
  renderHook(() => useQuickActions());
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/modules/sensors-playground'));
});

it('warm-launch listener → router.navigate', () => { ... });

it('add-mood-happy ALSO writes mood log', () => {
  // listener fires → expect appendMoodEntry called with mood: 'happy'
});

it('missing userInfo → no navigation; warns in __DEV__', () => { ... });

it('reset mid-invocation does not cancel navigate', () => { ... });
```

These specs live in
`test/unit/modules/quick-actions-lab/hooks/useQuickActions.test.tsx`.
