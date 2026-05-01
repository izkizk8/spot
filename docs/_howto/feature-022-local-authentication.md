---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (LAContext requires native iOS build)
  - iPhone running iOS 8+ with Face ID (iPhone X+) or Touch ID enrolled
  - Apple Developer account (free tier sufficient)
---

# How to verify Local Authentication (Face ID / Touch ID) on iPhone

## Goal
Confirm LAContext biometric authentication prompts correctly, returns success/failure,
and that the lab screen handles all LAError cases (user cancel, passcode fallback,
biometry not enrolled) gracefully.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 8+ with enrolled Face ID or Touch ID
- `with-local-authentication` plugin registered in `app.json`
- `NSFaceIDUsageDescription` in Info.plist (injected by plugin)

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
4. In the app, navigate to **"Local Authentication"** in the Modules tab.
5. Confirm the Biometry Type card shows `faceID` or `touchID` matching the device.
6. Tap **Authenticate** — the system Face ID / Touch ID prompt appears.
7. Authenticate successfully → confirm result shows `success: true`.
8. Tap **Authenticate** again and cancel — confirm result shows `LAErrorUserCancel`.
9. Tap **Authenticate** and choose "Enter Passcode" if offered — confirm passcode
   fallback works and result shows `success: true`.
10. Verify the policy picker (biometrics only vs. biometrics or passcode) changes
    the prompt behavior.

## Verify
- Biometry Type card correctly identifies faceID / touchID on device
- Successful authentication returns success: true
- User cancellation returns LAErrorUserCancel without crashing
- Passcode fallback works when configured
- On Android: fingerprint/biometric equivalent works via BiometricPrompt
- On web: "Local Authentication is iOS-only" banner; button disabled

## Troubleshooting
- **`NSFaceIDUsageDescription` missing** → verify `with-local-authentication` plugin
  is in `app.json` and a fresh prebuild was run
- **"Biometry not enrolled" error** → enroll Face ID or Touch ID in
  Settings → Face ID & Passcode (or Touch ID & Passcode)
- **LAContext always returns failure on simulator** → use a physical device; the
  simulator Face ID toggle in Simulator menu simulates success/failure differently

## Implementation references
- Spec: `specs/022-local-authentication/spec.md`
- Plan: `specs/022-local-authentication/plan.md`
- Module: `src/modules/local-auth-lab/`
- Native bridge: `src/native/local-auth.ts`
- Plugin: `plugins/with-local-authentication/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows