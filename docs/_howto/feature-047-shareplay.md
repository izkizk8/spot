---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (GroupActivities requires native iOS build)
  - Two iPhones running iOS 15+ in an active FaceTime call (or GroupActivities simulator)
  - Apple Developer account (free tier sufficient)
---

# How to verify SharePlay on iPhone

## Goal
Confirm GroupActivity is prepared and advertised correctly, both participants in a
FaceTime call see the SharePlay banner and can join the shared activity, and activity
state is synchronised in real time.

## Prerequisites
- macOS with Xcode 15+
- Two iPhones running iOS 15+ signed into different Apple IDs
- `with-shareplay` plugin registered in `app.json`
  (registers `GroupActivities` capability and `NSUserActivityTypes`)

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
3. Install the IPA on both iPhones.
4. Start a FaceTime call between the two devices.
5. On Device A, open Spot and navigate to **"SharePlay"** in the Modules tab.
6. Tap **Start SharePlay Activity** → confirm the SharePlay banner appears on both
   devices (Device B sees a "Join SharePlay" prompt).
7. On Device B, tap **Join** — confirm both screens now show the shared activity UI.
8. Perform an interaction on Device A (e.g., increment counter) — confirm the state
   updates on Device B within ~1 second.
9. Tap **End SharePlay** on Device A — confirm the session ends on both devices.

## Verify
- SharePlay banner appears on both FaceTime participants' screens
- Second participant can join the activity
- Real-time state sync propagates within ~1 s
- Ending SharePlay on one device ends the session for all
- On iOS < 15: in-app banner "SharePlay requires iOS 15+"

## Troubleshooting
- **SharePlay banner not appearing** → ensure both devices are in an active FaceTime
  call; also verify `GroupActivity.activate()` is called after `prepareForActivation()`
  returns `.activationPreferred`
- **Join button not appearing on Device B** → confirm the `GroupActivity` type identifier
  is declared in `NSUserActivityTypes` and both devices have the same app installed
- **State not syncing** → check that `GroupSessionMessenger` is configured and
  both devices are observing the `messages` publisher

## Implementation references
- Spec: `specs/047-shareplay/spec.md`
- Plan: `specs/047-shareplay/plan.md`
- Module: `src/modules/shareplay-lab/`
- Native bridge: `src/native/shareplay.ts`
- Plugin: `plugins/with-shareplay/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows