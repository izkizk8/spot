# Plan — 087 Control Center Controls

## Architecture

```
                ┌──────────────────────────────────────┐
                │       Modules tab → /modules/[id]    │
                └────────────────┬─────────────────────┘
                                 │
              src/modules/controls-lab/
              ├── index.tsx           — manifest (lazy render)
              ├── screen.tsx          — iOS UI
              ├── screen.android.tsx  — IOSOnlyBanner gate
              ├── screen.web.tsx      — IOSOnlyBanner gate
              ├── components/
              │   ├── IOSOnlyBanner.tsx
              │   ├── CapabilityCard.tsx
              │   ├── ControlItem.tsx
              │   └── SetupGuide.tsx
              └── hooks/
                  └── useControls.ts  — capability + list + trigger

              src/native/
              ├── controls.ts          — iOS resolver
              ├── controls.android.ts  — rejects everywhere
              ├── controls.web.ts      — rejects everywhere
              └── controls.types.ts    — bridge contract

              plugins/with-controls/
              ├── package.json
              └── index.ts             — sets NSSupportsControlCenter
```

## Bridge contract (TypeScript)

```ts
type ControlKind = 'button' | 'toggle';

interface ControlsCapabilities {
  controlWidget: boolean;
  valueProvider: boolean;
  osVersion: string;
}

interface ControlInfo {
  id: string;
  kind: ControlKind;
  title: string;
  systemImageName: string;
  isOn: boolean | null;
}

interface ControlActionResult {
  controlId: string;
  success: boolean;
  newValue: boolean | null;
  triggeredAt: string;
}

interface ControlsBridge {
  getCapabilities(): Promise<ControlsCapabilities>;
  getRegisteredControls(): Promise<readonly ControlInfo[]>;
  triggerControl(controlId: string): Promise<ControlActionResult>;
}
```

## Hook responsibilities

- Loads capabilities on mount (`refreshCapabilities`) and registered
  controls on mount (`refreshControls`).
- Records the last `ControlActionResult` returned by `triggerControl`.
- Records the last error per operation; errors do not clear the list.
- Exposes `__setControlsBridgeForTests` for unit tests.

## Plugin

`with-controls` writes `NSSupportsControlCenter = true` via
`withInfoPlist`. The pure helper `applyControlsInfoPlist` is exported
for direct unit testing.

Idempotent: running the plugin twice on the same Expo config produces
a deep-equal config.

## Test inventory

| Test file | Cases (≈) |
|-----------|-----------|
| `test/unit/modules/controls-lab/manifest.test.ts` | id / title / description / platforms / minIOS '18.0' / render |
| `test/unit/modules/controls-lab/useControls.test.tsx` | refresh, trigger, error paths |
| `test/unit/modules/controls-lab/screen.test.tsx` | iOS screen renders all sections |
| `test/unit/modules/controls-lab/screen.android.test.tsx` | IOSOnlyBanner |
| `test/unit/modules/controls-lab/screen.web.test.tsx` | IOSOnlyBanner |
| `test/unit/modules/controls-lab/components/*.test.tsx` (4 files) | each renders with sane defaults; user interactions |
| `test/unit/plugins/with-controls/index.test.ts` | helper + plugin idempotency + coexistence count = 43 |

Six existing coexistence tests (`with-mapkit`, `with-apple-pay`,
`with-coredata-cloudkit`, `with-roomplan`, `with-storekit`,
`with-weatherkit`) bump their `expect(plugins.length).toBe(42)` to
`toBe(43)`.

## Risks & mitigations

- **R1** — Plugin count drift across coexistence tests.
  *Mitigation:* update all six in the same commit; assert in the new
  `with-controls` test that the count is 43.
- **R2** — Registry import ordering. *Mitigation:* append-only at
  the tail.
- **R3** — Native module unavailable in jsdom. *Mitigation:* lazy
  `render` and `__setControlsBridgeForTests` swap point.
