# Quickstart — 087 Control Center Controls

## Run the lab

```sh
pnpm install
pnpm ios          # iOS 18+ simulator or device required for live UI
```

Open the **Modules** tab and tap **Control Center**.

## What you'll see (iOS 18+)

- **Controls Capability** — whether `ControlWidget` and
  `ControlValueProvider` are available, plus the OS version.
- **Registered Controls** — each registered control descriptor
  (kind, title, SF Symbol, current state for toggles) with a
  *Trigger* button that simulates an `AppIntent` invocation.
- **Setup Guide** — five-step walkthrough of the Xcode-side work:
  Widget Extension target, `ControlWidget` declaration,
  `ControlValueProvider`, `AppIntent`, and Settings → Control Center
  registration.

## On Android / Web

The module loads and shows an "iOS Only Feature" banner — Control
Center custom controls require iOS 18+.

## Tests

```sh
pnpm test test/unit/modules/controls-lab
pnpm test test/unit/plugins/with-controls
```

## Rebuild after install (if you regenerate iOS native code)

The `with-controls` config plugin writes
`NSSupportsControlCenter = true` to `Info.plist`. After modifying
plugins or `app.json`, rebuild the native iOS app:

```sh
pnpm expo prebuild --clean
pnpm ios
```
