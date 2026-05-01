# Contract: `src/native/widget-center.ts` — Widget Center JS Bridge

**Stability**: internal to this repo. Consumed only by
`src/modules/widgets-lab/`.

**Native module name**: `SpotWidgetCenter` (resolved via
`expo-modules-core::requireOptionalNativeModule`). Lives in the **main app
target** (per FR-042), not the widget extension. The widget extension
itself does not need a JS bridge — it reads the App Group directly from
`ShowcaseProvider`.

## Types

```ts
// src/native/widget-center.types.ts

import type { WidgetConfig } from '@/modules/widgets-lab/widget-config';

export class WidgetCenterNotSupportedError extends Error {
  constructor(message = 'WidgetCenter is only available on iOS 14+') {
    super(message);
    this.name = 'WidgetCenterNotSupportedError';
  }
}

export class WidgetCenterBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WidgetCenterBridgeError';
  }
}

export interface WidgetCenterBridge {
  /** Synchronous; never throws. */
  isAvailable(): boolean;
  /** Reads the App Group suite. Returns DEFAULT_CONFIG when suite is empty. */
  getCurrentConfig(): Promise<WidgetConfig>;
  /** Writes the supplied config to the App Group suite. */
  setConfig(config: WidgetConfig): Promise<void>;
  /** Calls WidgetCenter.shared.reloadAllTimelines(); resolves once issued. */
  reloadAllTimelines(): Promise<void>;
}
```

## Methods

### `isAvailable(): boolean`

| Aspect | Contract |
|--------|----------|
| Throws | **Never.** Pure synchronous predicate. |
| iOS 14+ with native module linked | `true` |
| iOS < 14, Android, Web | `false` |
| Native module not linked (e.g. forgot to prebuild) | `false` |

Backed by:
```ts
Platform.OS === 'ios' && getIOSVersion() >= 14 && native !== null
```

### `getCurrentConfig(): Promise<WidgetConfig>`

| Aspect | Contract |
|--------|----------|
| iOS 14+ | Reads App Group keys (`widgetConfig.showcaseValue`, `.counter`, `.tint`). Returns `DEFAULT_CONFIG` when the suite is empty or any key is missing/malformed. Resolves with a valid `WidgetConfig`. |
| Non-iOS-14+ | Rejects with `WidgetCenterNotSupportedError`. **Does NOT silently return defaults**: forces callers to gate on `isAvailable()` first (FR-020). |
| Native error (suite read fails on iOS) | Rejects with `WidgetCenterBridgeError(message)`; the caller (status panel) treats this as "show last-known config" + a non-blocking error toast. |

### `setConfig(config: WidgetConfig): Promise<void>`

| Aspect | Contract |
|--------|----------|
| Input validation | Caller is responsible for `validate()`-ing first. Bridge will however reject if `tint` is not one of the 4 documented values (cheap defense-in-depth). |
| iOS 14+ | Writes the 3 keys atomically (Swift side wraps in a `UserDefaults.set` + `synchronize` sequence). Resolves when the writes return. |
| Non-iOS-14+ | Rejects with `WidgetCenterNotSupportedError`. |
| Native error | Rejects with `WidgetCenterBridgeError(message)`. |

### `reloadAllTimelines(): Promise<void>`

| Aspect | Contract |
|--------|----------|
| iOS 14+ | Invokes `WidgetCenter.shared.reloadAllTimelines()` on the main app side. Resolves once the call has been *issued* (not once any widget has actually re-rendered — that's WidgetKit's prerogative). Resolving on an empty installed-widget set is a successful no-op (Edge Case: "No widgets installed when Push to widget is tapped"). |
| Non-iOS-14+ | Rejects with `WidgetCenterNotSupportedError`. |

## Platform variants

The bridge ships in three files; the bundler picks the right one:

| File | Purpose |
|------|---------|
| `src/native/widget-center.ts` | iOS implementation; `requireOptionalNativeModule('SpotWidgetCenter')`. |
| `src/native/widget-center.android.ts` | All methods (except `isAvailable`) reject with `WidgetCenterNotSupportedError`; `isAvailable` returns `false`. |
| `src/native/widget-center.web.ts` | Same as `.android.ts`. |

All three export `default` of type `WidgetCenterBridge` so consumers do
`import bridge from '@/native/widget-center'` regardless of platform.

## Error mapping (iOS native → JS)

The Swift `SpotWidgetCenter` Expo module rejects its async functions with
codes (matching the live-activity bridge precedent):

| Native code   | JS error class                  |
|---------------|---------------------------------|
| `NOT_SUPPORTED` | `WidgetCenterNotSupportedError` |
| `BRIDGE_ERROR`  | `WidgetCenterBridgeError`       |
| _(any other)_   | `WidgetCenterBridgeError(String(err))` |

## Test obligations

The following cases MUST be covered by `test/unit/native/widget-center.test.ts`:

1. On `Platform.OS === 'web'`, `isAvailable()` returns `false` and does not throw.
2. On `Platform.OS === 'web'`, `getCurrentConfig()` rejects with `WidgetCenterNotSupportedError`.
3. On `Platform.OS === 'web'`, `setConfig(c)` rejects with `WidgetCenterNotSupportedError`.
4. On `Platform.OS === 'web'`, `reloadAllTimelines()` rejects with `WidgetCenterNotSupportedError`.
5. On `Platform.OS === 'android'`, same 4 assertions as the web variant.
6. On `Platform.OS === 'ios'` with mocked native module present:
   - `isAvailable()` returns `true`
   - `getCurrentConfig()` resolves with the mocked module's response
   - `setConfig(c)` calls through with the same payload
   - `reloadAllTimelines()` calls through and resolves
   - A native rejection with `NOT_SUPPORTED` surfaces as `WidgetCenterNotSupportedError`
   - A native rejection with any other code surfaces as `WidgetCenterBridgeError`
7. On `Platform.OS === 'ios'` with native module absent (`requireOptionalNativeModule` returns `null`):
   - `isAvailable()` returns `false`
   - `getCurrentConfig()` rejects with `WidgetCenterNotSupportedError`
