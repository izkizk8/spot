---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (NSUserActivity Handoff requires native iOS build)
  - Two Apple devices (iPhone + Mac or two iPhones) signed into the same Apple ID
  - iPhone running iOS 8+
  - Apple Developer account (free tier sufficient)
---

# How to verify Handoff & Continuity on iPhone

## Goal
Confirm NSUserActivity is advertised from the iPhone and picked up by a Mac (or
second device), Handoff banner appears on the receiving device, and tapping it
restores the correct state in the companion app.

## Prerequisites
- macOS with Xcode 15+
- Two Apple devices on the same Wi-Fi + Bluetooth, signed into the same Apple ID
- `with-handoff` plugin registered in `app.json`
  (registers `NSUserActivityTypes` in Info.plist)
- Spot app installed on both devices

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA on both devices per [sideload-iphone.md](sideload-iphone.md).
4. In the app on Device A, navigate to **"Handoff"** in the Modules tab.
5. Tap **Start Handoff** → fill a text payload → tap **Advertise**.
6. Within seconds, a Spot app icon appears on the Dock of a Mac (or Lock Screen of
   the second iPhone).
7. Tap the Handoff icon on the receiving device — Spot opens on the receiving device.
8. Confirm the payload text is restored on the receiving device's Handoff screen.
9. Tap **Stop Handoff** on Device A — the Handoff icon disappears on the receiving device.

## Verify
- NSUserActivity advertised correctly; Handoff icon appears on receiving device
- Tapping Handoff opens the app on receiving device and restores the payload
- Stopping the activity removes the Handoff icon
- Payload data is serialised and deserialised correctly
- Both devices must be on the same network with Bluetooth enabled

## Troubleshooting
- **Handoff icon never appears** → confirm both devices are on the same Wi-Fi and
  Bluetooth is on; also verify "Handoff" is enabled in Settings → General → AirPlay & Handoff
- **App opens but payload is empty** → ensure `userInfo` is populated before calling
  `becomeCurrent()` and `continueUserActivity` delegate reads from `userInfo`
- **NSUserActivityTypes missing** → run a fresh `npx expo prebuild --clean` to
  regenerate Info.plist with the registered activity types

## Implementation references
- Spec: `specs/040-handoff-continuity/spec.md`
- Plan: `specs/040-handoff-continuity/plan.md`
- Module: `src/modules/handoff-lab/`
- Native bridge: `src/native/handoff.ts`
- Plugin: `plugins/with-handoff/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows