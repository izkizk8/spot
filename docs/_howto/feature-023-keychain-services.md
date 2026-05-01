---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; basic Keychain path works in Expo Go)
  - iPhone running iOS 8+
  - Apple Developer account (free tier sufficient for basic; paid for shared Keychain)
---

# How to verify Keychain Services on iPhone

## Goal
Confirm Keychain CRUD (add, read, delete) operations work with the specified
accessibility class, that biometry-bound items trigger Face ID / Touch ID on
read, and that the access group probe works for entitled builds.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `with-keychain-services` plugin registered in `app.json`
- For biometry: custom dev client built with the plugin (Expo Go has limited keychain access)

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build for device:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Keychain Lab"** in the Modules tab.
5. Confirm the empty-state message "No keychain items yet".
6. Tap **Add item** → fill `label = "demo"`, `value = "hello"`,
   accessibility class `whenUnlockedThisDeviceOnly`, biometry off → **Save**.
7. Confirm one row appears with label "demo" and the accessibility class label.
8. Tap **Show** → value "hello" appears inline; button becomes **Hide**.
9. Tap **Delete** → row disappears; empty-state message returns.
10. Add another item with **biometry on** → row shows 🔒 biometry badge →
    tap **Show** → Face ID / Touch ID prompt appears; on success value is revealed.

## Verify
- Add/Show/Delete CRUD operations all work for basic items
- Biometry-bound items trigger the system biometric prompt on Show
- User cancel of biometric prompt shows informational inline message (not error toast)
- Accessibility class `whenPasscodeSetThisDeviceOnly` fails if no passcode is set
- On web: only "iOS-only" banner visible; all controls disabled

## Troubleshooting
- **Biometry badge not appearing** → ensure custom dev client built with `with-keychain-services`
  plugin; Expo Go may not have entitlements for all keychain operations
- **`errSecMissingEntitlement` on shared keychain test** → requires Keychain Sharing
  capability with the access group entitlement enabled in Xcode
- **`errSecDuplicateItem`** → bridge upgrades to update silently; should never surface to UI

## Implementation references
- Spec: `specs/023-keychain-services/spec.md`
- Plan: `specs/023-keychain-services/plan.md`
- Module: `src/modules/keychain-lab/`
- Native bridge: `src/native/keychain.ts`
- Plugin: `plugins/with-keychain-services/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows