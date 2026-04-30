# Contract: Handoff bridge (native + JS)

**Feature**: 040-handoff-continuity
**Consumed by**: `src/modules/handoff-lab/hooks/useHandoffActivity.ts`
**Mocked at**: `jest.mock('@/native/handoff', ...)` per test (or relative path equivalent)

---

## Native (Swift) module

File: `native/ios/handoff/HandoffBridge.swift`

Exposed via `expo-modules-core` `Module` DSL. Single module name `Handoff`.

```swift
public class HandoffBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("Handoff")

    Constants([
      "isAvailable": true
    ])

    Events("onContinue")

    AsyncFunction("setCurrent") { (definition: ActivityDefinitionRecord) -> Void in
      // construct NSUserActivity; assign userActivity to current scene; becomeCurrent()
    }

    AsyncFunction("resignCurrent") { () -> Void in
      // resignCurrent on the last-set activity (no-op if none)
    }

    AsyncFunction("getCurrent") { () -> ActivityDefinitionRecord? in
      // read UIApplication.shared.userActivity, convert to record
    }
  }
}
```

`ActivityDefinitionRecord` is a `Record` (Expo Modules type-safe DTO) with the fields documented in `data-model.md` § ActivityDefinition. `requiredUserInfoKeys` is converted to `Set<String>` before being assigned to the `NSUserActivity` and back to a sorted `[String]` when reading.

File: `native/ios/handoff/HandoffActivityHandler.swift`

Registers as an `AppDelegateSubscriber` and implements:

```swift
func application(
  _ application: UIApplication,
  continue userActivity: NSUserActivity,
  restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
) -> Bool {
  // 1. Convert userActivity to a [String: Any] dictionary (see contracts/continuation.md).
  // 2. Send the dictionary on the "onContinue" event channel exposed by HandoffBridge.
  // 3. Always return true (claim the activity).
}
```

---

## JS bridge — iOS path

File: `src/native/handoff.ts`

```ts
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type { ActivityDefinition, ContinuationEvent } from '@/modules/handoff-lab/types';

const native = requireNativeModule('Handoff');
const emitter = new EventEmitter(native);

export const isAvailable = true;

export function setCurrent(definition: ActivityDefinition): Promise<void> {
  return native.setCurrent(definition);
}

export function resignCurrent(): Promise<void> {
  return native.resignCurrent();
}

export function getCurrent(): Promise<ActivityDefinition | null> {
  return native.getCurrent();
}

export function addContinuationListener(
  cb: (event: Omit<ContinuationEvent, 'receivedAt'>) => void
): () => void {
  const sub = emitter.addListener('onContinue', cb);
  return () => sub.remove();
}
```

---

## JS bridge — non-iOS path

File: `src/native/handoff.web.ts` (resolved by the bundler on Web; Android falls through to this path via the existing `.web.ts` convention used elsewhere in the repo for iOS-only modules; if the convention requires `.android.ts` too, both files re-export the same symbols).

```ts
export class HandoffNotSupported extends Error {
  constructor(method: string) {
    super(`Handoff is not supported on this platform (called: ${method}).`);
    this.name = 'HandoffNotSupported';
  }
}

export const isAvailable = false;

export function setCurrent(): Promise<void> {
  return Promise.reject(new HandoffNotSupported('setCurrent'));
}

export function resignCurrent(): Promise<void> {
  return Promise.reject(new HandoffNotSupported('resignCurrent'));
}

export function getCurrent(): Promise<null> {
  return Promise.reject(new HandoffNotSupported('getCurrent'));
}

export function addContinuationListener(): () => void {
  throw new HandoffNotSupported('addContinuationListener');
}
```

---

## Test contract

The bridge is **mocked at the import boundary**. A typical test in `test/unit/modules/handoff-lab/hooks/useHandoffActivity.test.tsx`:

```ts
jest.mock('@/native/handoff', () => ({
  isAvailable: true,
  setCurrent: jest.fn().mockResolvedValue(undefined),
  resignCurrent: jest.fn().mockResolvedValue(undefined),
  getCurrent: jest.fn().mockResolvedValue(null),
  addContinuationListener: jest.fn((cb) => {
    __continuationCallback = cb;
    return () => { __continuationCallback = null; };
  }),
}));
```

Test for non-iOS bridge (`test/unit/native/handoff.test.ts`):

| Case                                  | Expectation                                                       |
|---------------------------------------|-------------------------------------------------------------------|
| `isAvailable`                         | `=== false`                                                       |
| `setCurrent(def)`                     | rejects with `HandoffNotSupported`, message contains `'setCurrent'` |
| `resignCurrent()`                     | rejects with `HandoffNotSupported`                                |
| `getCurrent()`                        | rejects with `HandoffNotSupported`                                |
| `addContinuationListener(cb)`         | throws `HandoffNotSupported` synchronously                        |
