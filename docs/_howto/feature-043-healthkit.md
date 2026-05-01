---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (HealthKit requires native iOS build)
  - iPhone running iOS 8+
  - Apple Developer account (paid account required; HealthKit entitlement required)
---

# How to verify HealthKit on iPhone

## Goal
Confirm HKHealthStore requests read/write authorisation for selected data types,
quantity samples (steps, heart rate) can be read and written, and that the
HealthKit module correctly handles the case where HealthKit is unavailable
(iPad / macOS).

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 8+ (HealthKit is unavailable on iPad)
- Paid Apple Developer account (HealthKit entitlement enabled in Developer Portal)
- `with-healthkit` plugin registered in `app.json`
  (adds `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`,
  HealthKit entitlement)

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
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"HealthKit"** in the Modules tab.
5. Confirm HealthKit Available chip shows **"Available"** on iPhone.
6. Tap **Request Authorisation** → grant read/write for Step Count and Heart Rate.
7. Tap **Read Steps (Today)** → confirm today's step count is displayed.
8. Tap **Write Steps** → add 100 steps → confirm the new sample in Health app.
9. Tap **Read Heart Rate** → confirm the most recent heart-rate sample is displayed
   (requires at least one reading from a watch or manual entry in Health app).

## Verify
- HealthKit Available chip shows correct status per device type
- Authorisation sheet lists requested data types
- Step count sample read successfully after authorisation
- Written sample appears in native Health app under Browse → Activity → Steps
- Heart rate read returns the most recent sample from Health store
- On iPad: "HealthKit unavailable on this device" banner

## Troubleshooting
- **Entitlement error on launch** → ensure `com.apple.developer.healthkit` is in
  `Entitlements.plist` and enabled in the Developer Portal; a fresh prebuild is required
- **Steps read returns zero** → grant read access and ensure the Health app has
  step count data; walk with the iPhone to generate data
- **Write silently ignored** → confirm `HKQuantityTypeIdentifier.stepCount` write
  access was granted (not just read); check authorization status explicitly

## Implementation references
- Spec: `specs/043-healthkit/spec.md`
- Plan: `specs/043-healthkit/plan.md`
- Module: `src/modules/healthkit-lab/`
- Native bridge: `src/native/healthkit.ts`
- Plugin: `plugins/with-healthkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows