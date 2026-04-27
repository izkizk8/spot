# Contract — `haptic-driver.ts` (the single test seam)

**File**: `src/modules/haptics-playground/haptic-driver.ts`
**Consumers**: `HapticButton`, `PatternSequencer`, `PresetList`, `screen.tsx`
**Owner**: This contract is authoritative. Any change here requires updating
`spec.md` FR-031 and the corresponding tests.

---

## Public API

```ts
import type { HapticKind, HapticIntensity } from './types';

export function play(kind: 'selection'): Promise<void>;
export function play(
  kind: 'impact',
  intensity: ImpactIntensity,
): Promise<void>;
export function play(
  kind: 'notification',
  intensity: NotificationIntensity,
): Promise<void>;
```

Three overloads enforce the kind/intensity coupling at compile time.
Implementation signature is the union; callers see only the overloads.

**Return value**: A Promise that resolves when the underlying haptic call
resolves (or immediately on Web). The Promise *never rejects* — failures
are swallowed (haptic feedback is best-effort UX, never a fatal error).
This matches the edge case "Rapid repeated taps … MUST not crash".

---

## Per-platform behaviour

| Platform | Behaviour |
|---|---|
| iOS | Calls the matching `expo-haptics` API and awaits its Promise. |
| Android | Same as iOS — `expo-haptics` routes to closest-equivalent vibrator pattern. |
| Web | **No-op.** Returns `Promise.resolve()` immediately. MUST NOT call any `expo-haptics` API and MUST NOT throw. (FR-028, edge case "Web with no haptics API".) |

The platform branch is a single early-return in this file:

```ts
if (Platform.OS === 'web') return Promise.resolve();
```

---

## Routing table (the assertion target for `haptic-driver.test.ts`)

| Call | `expo-haptics` API invoked |
|---|---|
| `play('notification', 'success')` | `notificationAsync(NotificationFeedbackType.Success)` |
| `play('notification', 'warning')` | `notificationAsync(NotificationFeedbackType.Warning)` |
| `play('notification', 'error')`   | `notificationAsync(NotificationFeedbackType.Error)` |
| `play('impact', 'light')`  | `impactAsync(ImpactFeedbackStyle.Light)` |
| `play('impact', 'medium')` | `impactAsync(ImpactFeedbackStyle.Medium)` |
| `play('impact', 'heavy')`  | `impactAsync(ImpactFeedbackStyle.Heavy)` |
| `play('impact', 'soft')`   | `impactAsync(ImpactFeedbackStyle.Soft)` |
| `play('impact', 'rigid')`  | `impactAsync(ImpactFeedbackStyle.Rigid)` |
| `play('selection')` | `selectionAsync()` |

Tests MUST exercise all 9 rows on a non-web mock-`Platform.OS`, plus a 10th
case: web platform → no `expo-haptics` symbol called.

---

## Invariants

1. **No top-level side effects**. Importing `haptic-driver.ts` does not call
   any `expo-haptics` function. (Required for the screen to render safely
   on Web without crashing on a synchronous import.)
2. **No state**. The module exports only `play` (and the type re-exports).
3. **Idempotent under rapid calls**. Concurrent in-flight `play()` calls do
   not interfere with each other (they each await their own Promise).
4. **No mocking required at module-init time**. Tests mock `expo-haptics`
   per-file with `jest.mock('expo-haptics', ...)`.
