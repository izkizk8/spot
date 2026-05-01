---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (AuthenticationServices requires native iOS build)
  - iPhone running iOS 13+
  - Apple Developer account (paid account required to configure Sign in with Apple capability)
---

# How to verify Sign in with Apple on iPhone

## Goal
Confirm the Sign In with Apple button triggers the system credential sheet,
returns a valid identity token and user details, and that subsequent sign-ins
recognize a returning user.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- Paid Apple Developer account (Sign in with Apple capability must be enabled
  in the Apple Developer portal for the app's Bundle ID)
- `with-sign-in-with-apple` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project on macOS:
   ```bash
   npx expo prebuild --clean
   ```
3. Open `ios/Spot.xcworkspace` in Xcode, select your Apple ID team, and verify the
   **Sign in with Apple** capability is listed under Signing & Capabilities.
4. Build and run with **Product → Run** (⌘R) to your iPhone.
5. In the app, navigate to **"Sign in with Apple"** in the Modules tab.
6. Tap **Sign in with Apple** — the system credential sheet appears.
7. Authenticate with Face ID or passcode — confirm the identity token and user info
   (name, email) are returned and displayed in the lab screen.
8. Sign out, sign in again — confirm Apple routes the returning user without
   re-prompting for name/email.

## Verify
- System credential sheet appears on button tap
- Identity token and user details displayed after successful sign-in
- Returning user recognized without re-prompting
- On Android/web: "Sign in with Apple is iOS 13+ only" banner; button disabled

## Troubleshooting
- **Capability not showing in Xcode** → enable Sign in with Apple in the Apple
  Developer portal under Identifiers → your App ID → Capabilities
- **Sheet appears but login fails** → confirm the device is signed into an Apple ID
  in Settings → Apple ID
- **Token not returned after auth** → verify the native bridge listens to
  `ASAuthorizationControllerDelegate`'s `didCompleteWithAuthorization` callback

## Implementation references
- Spec: `specs/021-sign-in-with-apple/spec.md`
- Plan: `specs/021-sign-in-with-apple/plan.md`
- Module: `src/modules/sign-in-with-apple/`
- Native bridge: `src/native/sign-in-with-apple.ts`
- Plugin: `plugins/with-sign-in-with-apple/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows