---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (FamilyControls extension requires native build)
  - iPhone running iOS 16+ (FamilyControls requires iOS 16)
  - Apple Developer account with `com.apple.developer.family-controls` entitlement
    (must be explicitly approved by Apple — free tier is NOT sufficient)
---

# How to verify ScreenTime API on iPhone

## Goal
Confirm the Screen Time Lab module renders correctly in both the unentitled
(dominant) path and, for entitled developers, that authorization, app shielding,
and the DeviceActivity monitor extension work end-to-end.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- `with-screentime` plugin registered in `app.json`
- For full verification: `com.apple.developer.family-controls` entitlement granted
  by Apple — see https://developer.apple.com/contact/request/family-controls-distribution

## Steps

### Unentitled path (any developer)
1. Comment out `./plugins/with-screentime` in `app.json` (prevents EAS Build failure).
2. Build:
   ```bash
   pnpm install && pnpm check
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. In the app, navigate to **"Screen Time Lab"** in the Modules tab.
4. Confirm the **EntitlementBanner** is visible at the top.
5. Tap each button (Request Authorization, Pick apps, Apply Shielding, etc.) —
   each shows "Entitlement required" status; no crash.

### Entitled path (approved developers only)
6. Re-enable the plugin, refresh credentials (`eas credentials -p ios`), rebuild.
7. Tap **Request Authorization** — iOS system prompt appears; approve.
8. Tap **Pick apps & categories** — Apple's `FamilyActivityPicker` slides up.
9. Select apps; tap **Apply Shielding** — switch to Home Screen; confirm the
   shielded app shows iOS shield UI.
10. Tap **Clear Shielding** in the app — shielded app launches normally again.

## Verify
- EntitlementBanner visible on unentitled builds; all controls show status message, no crash
- On entitled build: authorization, picker, shielding, and monitor all functional
- On Android/web: "Screen Time API is iOS-only" banner, all cards disabled, no exceptions

## Troubleshooting
- **EAS Build fails with `family-controls` entitlement error** → comment out the
  `with-screentime` plugin per the unentitled path above
- **Picker doesn't appear** → must request authorization first (tap Request Authorization)
- **Shielding doesn't block app** → ensure you tapped Done (not Cancel) in the picker;
  a cancelled picker produces an empty token that cannot shield anything

## Implementation references
- Spec: `specs/015-screentime-api/spec.md`
- Plan: `specs/015-screentime-api/plan.md`
- Module: `src/modules/screentime-lab/`
- Native bridge: `src/native/screentime.ts`
- Plugin: `plugins/with-screentime/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows