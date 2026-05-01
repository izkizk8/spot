# Quickstart: ScreenTime / FamilyControls Showcase Module

> **READ THIS FIRST.** This module depends on the `com.apple.developer.family-controls` entitlement, which **Apple does not grant freely**. You will be able to browse the educational scaffold without it; you will **not** be able to functionally verify shielding or monitoring without it.

---

## 1. The entitlement (the part that blocks ~99% of users)

`FamilyControls`, `DeviceActivity`, and `ManagedSettings` are gated behind:

```text
com.apple.developer.family-controls
```

This entitlement is **not freely available**. You must request it from Apple.

### How to request

1. Sign in to the Apple Developer portal.
2. Navigate to the **Family Controls Distribution** request form:
   <https://developer.apple.com/contact/request/family-controls-distribution>
3. Fill in:
   - **Team**: your Apple Developer team
   - **App description**: an honest summary of why your app needs FamilyControls (parental-controls apps, study/focus tools, screen-time analytics)
   - **Use case**: which of `FamilyActivityPicker` / `ManagedSettings` / `DeviceActivity` you intend to use, and why
   - **Distribution channel**: App Store, Enterprise, etc.
4. Submit and wait. Apple reviews case-by-case. **Approval is frequently denied** for showcase / educational apps and is **not guaranteed even for legitimate parental-controls products**.
5. If approved, Apple updates your team's profile entitlements. Your next provisioning profile fetch (Xcode → Preferences → Accounts → Download Manual Profiles, or `eas credentials` refresh) picks it up.

> Approval can take days to weeks. Plan accordingly. There is no expedite path.

---

## 2. EAS Build failure (and the workaround)

If the `with-screentime` plugin is enabled in `app.json` **and** your team's Apple account does **not** have the entitlement granted, EAS Build will fail at the provisioning step with an error similar to:

```text
The provisioning profile does not include the
"com.apple.developer.family-controls" entitlement.
```

**This is expected.** The fix is one of:

### Option A — Comment out the plugin (recommended for unentitled developers)

Edit `app.json` and comment out the `with-screentime` plugin entry:

```jsonc
{
  "expo": {
    "plugins": [
      "./plugins/with-app-intents",
      "./plugins/with-home-widgets",
      "./plugins/with-live-activity"
      // "./plugins/with-screentime"  <-- comment out until entitlement is granted
    ]
  }
}
```

Then re-run prebuild and EAS Build:

```bash
pnpm exec expo prebuild --clean
eas build --platform ios
```

The Screen Time Lab module **still appears** in the Modules grid (it is registered in `src/modules/registry.ts` independently of the plugin). On launch, the module's `entitlementsAvailable()` probe returns `false` and the `EntitlementBanner` is rendered at the top of the screen. All four cards render with disabled actions producing "Entitlement required" status messages — this is the documented unentitled experience and the dominant verification path on Windows + CI.

### Option B — Wait for Apple approval, then re-enable

Once your team has the entitlement:
1. Refresh your iOS distribution credentials: `eas credentials -p ios`
2. Uncomment the `with-screentime` plugin entry in `app.json`.
3. Re-run `pnpm exec expo prebuild --clean && eas build --platform ios`.

---

## 3. On-device verification (entitled developers only)

### 3a. Authorization

1. Install the build on a **physical iOS 16+ device** (the FamilyControls system prompt is not reliably surfaced in the simulator).
2. Open the app, navigate to **Modules → Screen Time Lab**.
3. Confirm the `EntitlementBanner` is **absent** (it should not render when the entitlement probe succeeds).
4. Tap **Request Authorization**. The system prompt appears. Approve.
5. The Authorization card's status pill should update to `approved` and persist across relaunches.

### 3b. Pick activity + apply shielding

1. Tap **Pick apps & categories**. Apple's `FamilyActivityPicker` slides up.
2. Select a couple of apps (e.g., Calculator, Weather) and one category.
3. Dismiss the picker. The Activity Selection card now reads, e.g., `2 apps / 1 category / 0 web domains`.
4. Tap **Apply Shielding**. Status: `Shielding active`.
5. **Verify**: switch to the home screen and tap one of the shielded apps. iOS shows the system shield UI (a frosted overlay reading "App Limit"). The app cannot be launched.
6. Tap **Clear Shielding**. Status: `Shielding cleared`. The app launches normally again.

### 3c. Monitoring schedule (Console.app log watching)

The `DeviceActivityMonitorExtension` runs out-of-process and logs via `OSLog`. To watch it:

1. Connect the iOS device to a Mac via USB. Trust the computer if prompted.
2. Open **Console.app** on the Mac. In the sidebar, select your iOS device.
3. In the search bar, enter:
   ```text
   subsystem:com.spot.screentime
   ```
   You can narrow further with `category:monitor`.
4. In the spot app, tap **Start daily monitor**. The Monitoring card shows `Active`.
5. Wait for the next schedule boundary (the demo schedule is `09:00`–`21:00` daily). At the boundary, you should see Console.app log entries like:
   ```text
   [com.spot.screentime monitor] intervalDidStart for activity spot.screentime.daily
   [com.spot.screentime monitor] intervalDidEnd   for activity spot.screentime.daily
   ```
6. Tap **Stop monitor**. Status: `Inactive`. No further callbacks fire.

> **Tip**: To force a near-immediate boundary for testing, temporarily edit the schedule in `ScreenTimeManager.swift` to a window starting one minute in the future and re-build. Revert before commit.

---

## 4. Dev-mode verification (Windows / unentitled — the dominant path)

This is what you can verify **without** the entitlement, on **any** developer machine including Windows:

### 4a. Run the JS-pure test suite

```bash
pnpm install
pnpm check
```

Expected: green typecheck, lint, and Jest run. The screentime-lab test files (reducer, bridge contract with mocked native, config plugin against fixtures, all four cards + `EntitlementBanner`, three screens, manifest) all pass on Windows with no native or device dependencies.

### 4b. Manually exercise the unentitled UI path

1. Start the dev server: `pnpm start` (or `pnpm ios` for a simulator run).
2. In the simulator (or a physical device with a normal provisioning profile):
   - Open **Modules → Screen Time Lab**.
   - **Verify**: `EntitlementBanner` is rendered at the top, with text "Entitlement required" and a link/reference to this `quickstart.md`.
   - Tap **Request Authorization** → status pill stays at `notDetermined`; card status reads `Entitlement required to perform this action — see quickstart.md`. **No crash.**
   - Tap **Pick apps & categories** → no picker appears; same status message. **No crash.**
   - Tap **Apply Shielding**, **Clear Shielding**, **Start daily monitor**, **Stop monitor** — each produces the same status message. **No crash.**
   - Navigate away (back to the Modules grid) and back — UI state hydrates from persistence (none initially), banner re-evaluates, no crash.

### 4c. Cross-platform graceful degradation

Run on **Android** and on **Web** (`pnpm android`, `pnpm web`):

1. Open **Modules → Screen Time Lab**.
2. Verify the **"Screen Time API is iOS-only"** banner is shown at the top.
3. Verify all four cards render with their controls **disabled**.
4. Verify the JS console shows **no exceptions**. (Internally, `bridge.isAvailable()` returns `false` synchronously and any other bridge method call would reject with `ScreenTimeNotSupportedError`.)

---

## 5. Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| EAS Build fails with `family-controls entitlement` error | Team lacks entitlement approval | Comment out `with-screentime` plugin per §2 Option A |
| Banner appears even on an entitled build | Entitlement probe caught an unexpected throw | Check Console.app for the probe's error log under `subsystem:com.spot.screentime` |
| `FamilyActivityPicker` does not appear | Authorization is still `notDetermined` | Request authorization first |
| Shielding does not block the target app | Token decoded to an empty selection (cancelled picker) | Re-pick; ensure you tapped Done, not Cancel |
| Monitor extension logs do not appear in Console.app | Wrong subsystem filter, or schedule has not yet started | Use filter `subsystem:com.spot.screentime category:monitor`; wait for the next boundary |
| Selection summary lost after app relaunch | App Group not configured (feature 014 plugin disabled) | Enable feature 014's `with-home-widgets` plugin; the warning is logged in dev as `[screentime] App Group not configured — using in-memory persistence` |
| Module missing from grid on iOS < 16 | Manifest sets `minIOS: '16.0'`; older iOS is filtered by the 006 registry | Expected; upgrade or test on a 16+ device |

---

## 6. Reference

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Contracts: [contracts/](./contracts/)
- Apple entitlement request form: <https://developer.apple.com/contact/request/family-controls-distribution>
- Apple FamilyControls framework docs: <https://developer.apple.com/documentation/familycontrols>
- Apple DeviceActivity framework docs: <https://developer.apple.com/documentation/deviceactivity>
- Apple ManagedSettings framework docs: <https://developer.apple.com/documentation/managedsettings>
