# Contract — `usePassKit` hook

**Feature**: 036-passkit-wallet
**See**: [spec.md](../spec.md) FR-023, FR-024, FR-027
**See**: [data-model.md](../data-model.md) Entity 5 (PassKitState)
**See**: [research.md](../research.md) §4 (R-D classification)

Implementation file:

- `src/modules/passkit-lab/hooks/usePassKit.ts`

## Invariants (asserted by `test/unit/modules/passkit-lab/hooks/usePassKit.test.tsx`)

- **H1**. The hook is the **only public surface** consumed by
  `screen.tsx` / `screen.android.tsx` / `screen.web.tsx` and by the
  eight components. Components MUST NOT import `src/native/passkit*`
  directly. (Static lint check optional but recommended.)
- **H2**. Default state on mount:
  ```ts
  {
    capabilities: { isPassLibraryAvailable: false, canAddPasses: false },
    passes: [],
    inFlight: { kind: 'idle' },
    lastError: { kind: 'none' },
    lastResult: { kind: 'none' },
  }
  ```
- **H3**. On mount, the hook calls `refresh()` exactly once. On
  unmount, the hook flips an internal `mounted` ref to `false`;
  every subsequent `dispatch` is a no-op (zero post-unmount setState
  calls — carryover from 030–035 SC-010).
- **H4**. `refresh()` invokes `canAddPasses()`,
  `isPassLibraryAvailable()`, and `passes()` in parallel. The
  `inFlight` marker is `{ kind: 'refresh' }` for the duration; the
  reducer transitions to idle once all three resolve (or any one
  rejects — in which case the partial successes are still applied
  and the failure is dispatched as `lastError`).
- **H5**. `addFromBytes(base64: string)` and
  `addFromURL(url: string)` set `inFlight` to the corresponding
  variant, await the bridge call, and on success call `refresh()`
  to re-fetch `passes()`. On `{ added: false }` (user cancel) the
  hook dispatches `lastResult: { kind: 'cancelled' }` and does NOT
  refresh.
- **H6**. `openPass(passTypeIdentifier, serialNumber)` short-circuits
  on `!isOpenPassSupported()` with a `PassKitOpenUnsupported`
  rejection, dispatched as
  `lastError: { kind: 'open-unsupported', message: '…' }`. The hook
  never invokes the bridge's `openPass` on iOS < 13.4.
- **H7**. **Error classification (R-D)** — every mutating action is
  `try`/`catch`-wrapped; the classifier is exported as
  `classifyPassKitError(e: unknown): PassKitState['lastError']`:
    - `e instanceof PassKitNotSupported` → `'unsupported'`
    - `e instanceof PassKitOpenUnsupported` → `'open-unsupported'`
    - `e instanceof PassKitDownloadFailed` →
      `'download-failed'` (message includes `httpStatus` if present)
    - `e instanceof PassKitInvalidPass` → `'invalid-pass'`
    - `e instanceof PassKitCancelled` → `'cancelled'`
    - else → `'failed'` with the error's `message` truncated to 120
      chars.
- **H8**. Setting `lastError` clears `lastResult` (and vice versa)
  in the reducer so the UI shows exactly one status per card.
- **H9**. The hook is a single `useReducer` + `useCallback`
  composition; no nested state machines. All actions are
  synchronous reducer dispatches; async work happens inside
  `useCallback` bodies that own the `try`/`catch` and `mounted`
  guard.
- **H10**. The hook detects the placeholder entitlement via the
  `EntitlementStatus` selector and exposes
  `entitlement: 'placeholder' | 'configured'` for
  `EntitlementBanner` to consume. Detection is read-once at mount.

## Hook return shape

```ts
export interface UsePassKit {
  // State
  readonly capabilities: Capabilities;
  readonly passes: readonly PassMetadata[];
  readonly inFlight: PassKitState['inFlight'];
  readonly lastError: PassKitState['lastError'];
  readonly lastResult: PassKitState['lastResult'];
  readonly entitlement: 'placeholder' | 'configured';

  // Actions
  readonly refresh: () => Promise<void>;
  readonly addFromBytes: (base64: string) => Promise<void>;
  readonly addFromURL: (url: string) => Promise<void>;
  readonly openPass: (
    passTypeIdentifier: string,
    serialNumber: string,
  ) => Promise<void>;

  // Capability helpers
  readonly isOpenPassSupported: boolean;
}
```

Every action returns `Promise<void>` (not the bridge's raw
`Promise<{ added: boolean }>`); callers read the outcome via the
`lastError` / `lastResult` state, which is the single source of
truth for the UI.

## Lifecycle

```text
mount
  ├─ useReducer(initial)
  ├─ entitlement = readOnce()              // H10
  └─ refresh()                              // H3
                                            //   ├─ inFlight: 'refresh'
                                            //   ├─ Promise.all([cap1, cap2, passes])
                                            //   ├─ each result dispatched independently
                                            //   └─ inFlight: 'idle'

user taps Add From URL
  ├─ inFlight: 'addFromURL'
  ├─ try: bridge.addPassFromURL(url)
  │    ├─ resolves { added: true }  → lastResult: 'added' + refresh()
  │    └─ resolves { added: false } → lastResult: 'cancelled'
  ├─ catch: classifyPassKitError(e) → lastError
  └─ inFlight: 'idle'

user taps Open in Wallet
  ├─ if (!isOpenPassSupported) → lastError: 'open-unsupported' + return
  ├─ inFlight: 'openPass'
  ├─ try: bridge.openPass(id, serial)
  │    └─ resolves                 → lastResult: 'opened'
  ├─ catch: classifyPassKitError(e)
  └─ inFlight: 'idle'

unmount
  └─ mounted.current = false                // H3
                                            //   any in-flight resolution that
                                            //   races the unmount finds mounted
                                            //   = false and skips dispatch
```

## Test surface (sketch)

`test/unit/modules/passkit-lab/hooks/usePassKit.test.tsx` exercises:

- **Mount default + refresh on mount** (H2, H3): on mount, all three
  bridge methods are invoked; state moves from default to populated.
- **Refresh happy path** (H4): both pills + the passes array
  populate; `inFlight` returns to `'idle'`.
- **`addFromURL` happy path** (H5): bridge resolves
  `{ added: true }`; `lastResult` is `'added'`; `passes()` is
  invoked again as part of the auto-refresh.
- **`addFromURL` cancel** (H5): bridge resolves `{ added: false }`;
  `lastResult` is `'cancelled'`; `passes()` is NOT invoked again.
- **`addFromURL` download failure** (H7): bridge rejects with
  `new PassKitDownloadFailed('not found', 404)`; `lastError.kind ===
  'download-failed'` with a message containing "404".
- **`addFromURL` invalid pass** (H7): bridge rejects with
  `new PassKitInvalidPass()`; `lastError.kind === 'invalid-pass'`.
- **`addFromBytes` happy path / failures** (H5, H7): symmetric to
  the URL path; assert no double-base64-encode.
- **`openPass` short-circuit on iOS<13.4** (H6, H7): when
  `isOpenPassSupported()` is false, the bridge is NEVER invoked;
  `lastError.kind === 'open-unsupported'`.
- **`openPass` happy path on iOS 13.4+** (H6): bridge resolves;
  `lastResult.kind === 'opened'`.
- **Error catch-all** (H7): a generic `Error('boom')` rejection is
  classified as `'failed'` with `message: 'boom'`.
- **Unmount cleanup** (H3): start an `addFromURL`; unmount BEFORE
  the bridge resolves; the resolution must NOT call `dispatch`.
  Asserted via a spy on `useReducer`'s dispatch (or by counting
  reducer invocations).
- **`lastError` and `lastResult` mutual exclusion** (H8): setting
  one clears the other.
- **Entitlement detection** (H10): when the placeholder is in effect,
  `entitlement === 'placeholder'`; when an operator-supplied value
  is present (via a mock of `Constants.expoConfig`),
  `entitlement === 'configured'`.
