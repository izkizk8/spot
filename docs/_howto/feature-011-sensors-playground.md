---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; physical device required for real sensor data)
  - iPhone running iOS 13+ (physical device required for Magnetometer / DeviceMotion)
  - Apple Developer account (free tier sufficient)
---

# How to verify Sensors Playground on iPhone

## Goal
Confirm that Accelerometer, Gyroscope, Magnetometer, and Device Motion sensors
all stream live data and visualize correctly, permission prompts work, and
Start/Stop/Start All controls behave correctly.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-sensors` installed (`npx expo install expo-sensors`)
- `expo-sensors` config plugin entry added to `app.json`
- Physical iPhone running iOS 13+ for full sensor verification

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native projects (macOS only) then build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA on your iPhone per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Sensors Playground"** in the Modules tab.
5. Confirm four sensor cards: Accelerometer, Gyroscope, Magnetometer, Device Motion.
6. Tap **Start** on Accelerometer — x/y/z readouts update at ~60 Hz as you tilt.
7. Tap **Stop** — readouts freeze on last value.
8. Tap **Start** on Gyroscope and rotate the phone — the rotation indicator follows yaw.
9. Tap **Start** on Magnetometer — grant Motion & Fitness permission if prompted;
   rotate horizontally and confirm the compass needle stays at a stable absolute direction.
10. Tap **Start All** — all four cards stream simultaneously. Tap **Stop All**.

## Verify
- Accelerometer x/y/z update visibly at 60 Hz; bar chart animates
- Gyroscope rotation indicator rotates proportionally to yaw
- Magnetometer compass needle holds stable absolute heading
- Device Motion spirit-level disc tracks tilt, clamped at edges
- Denied permission shows inline notice with "Open Settings" button
- Android: all four cards interactive with vibrator/gyro equivalents
- Web: sensors available only in Safari/HTTPS context; others show "Not supported"

## Troubleshooting
- **No data on Magnetometer** → iOS requires Motion & Fitness permission; grant in
  Settings → Privacy → Motion & Fitness → Spot
- **expo-sensors not found** → run `npx expo install expo-sensors` and rebuild
- **Permission denied and Open Settings does nothing** → verify the app's
  Info.plist contains `NSMotionUsageDescription` (added by the expo-sensors plugin)

## Implementation references
- Spec: `specs/011-sensors-playground/spec.md`
- Plan: `specs/011-sensors-playground/plan.md`
- Module: `src/modules/sensors-playground/`
- Tests: `test/unit/modules/sensors-playground/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows