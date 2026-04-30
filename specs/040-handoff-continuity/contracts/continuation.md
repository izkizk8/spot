# Contract: AppDelegate continuation event payload

**Feature**: 040-handoff-continuity
**Producer**: `native/ios/handoff/HandoffActivityHandler.swift`
**Consumer**: `addContinuationListener` in `src/native/handoff.ts` → `useHandoffActivity` hook

---

## Wire payload (Swift → JS)

The AppDelegate handler emits a single dictionary per continuation event on the `onContinue` event channel:

```ts
type WirePayload = {
  activityType: string;
  title: string;                // empty string if NSUserActivity.title is nil
  webpageURL?: string;          // absent if NSUserActivity.webpageURL is nil
  userInfo: Record<string, unknown>;  // plist-safe values only
  requiredUserInfoKeys: string[];     // sorted, deduplicated by Swift side
};
```

**Native conversion rules** (`HandoffActivityHandler.swift`):

| `NSUserActivity` field        | Conversion                                                |
|-------------------------------|-----------------------------------------------------------|
| `activityType` (`String`)     | passed through                                            |
| `title` (`String?`)           | `?? ""`                                                   |
| `webpageURL` (`URL?`)         | `?.absoluteString` (key omitted if nil)                   |
| `userInfo` (`[AnyHashable: Any]?`) | `?? [:]`, then keys cast to `String` (non-string keys dropped) |
| `requiredUserInfoKeys` (`Set<String>?`) | `Array(set).sorted() ?? []`                       |

The handler ALWAYS returns `true` to claim the activity (Decision 2 in research.md).

---

## JS-side normalisation

The hook receives the wire payload, then synthesises a `ContinuationEvent` (data-model.md § 2):

```ts
function normalise(wire: WirePayload): ContinuationEvent | null {
  if (typeof wire?.activityType !== 'string' || wire.activityType.length === 0) {
    if (__DEV__) console.warn('Discarded malformed continuation event:', wire);
    return null;
  }
  return {
    activityType: wire.activityType,
    title: typeof wire.title === 'string' ? wire.title : '',
    webpageURL: typeof wire.webpageURL === 'string' ? wire.webpageURL : undefined,
    userInfo: typeof wire.userInfo === 'object' && wire.userInfo !== null
      ? wire.userInfo as Record<string, unknown>
      : {},
    requiredUserInfoKeys: Array.isArray(wire.requiredUserInfoKeys)
      ? Array.from(new Set(wire.requiredUserInfoKeys.filter((k): k is string => typeof k === 'string'))).sort()
      : [],
    receivedAt: new Date().toISOString(),
  };
}
```

The defensive re-dedup + re-sort on the JS side guards against a future bridge build forgetting to sort (Decision 4 in research.md).

---

## Discard / log invariants

| Condition                                   | Effect on `HookState.log`            |
|---------------------------------------------|--------------------------------------|
| Valid payload                               | Prepend; truncate to last 10 (FR-014) |
| `activityType` missing or non-string        | Discard; `console.warn` in `__DEV__` only (FR-015) |
| `userInfo` is null/undefined                | Treat as `{}`; payload still valid   |
| `requiredUserInfoKeys` is not an array      | Treat as `[]`; payload still valid   |
| Hook is unmounted when event fires          | Listener already torn down (Edge Case #5) — bridge call no-ops at unsubscribe time |

---

## Lifecycle

1. Hook mounts → calls `addContinuationListener(handler)` → bridge stores the JS callback.
2. AppDelegate receives a continuation → calls `HandoffActivityHandler.application(_:continue:restorationHandler:)` → emits the wire payload on `onContinue` → bridge invokes the JS callback.
3. JS callback runs `normalise(wire)`; if not null, prepends to `log` and truncates.
4. Hook unmounts → calls the unsubscribe function returned at step 1 → bridge releases the callback.
