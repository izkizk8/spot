---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 14+
  - Apple Developer account (free tier is sufficient for capability card + intent simulator)
---

# How to verify SiriKit Custom Intents on iPhone

## Goal

View the SiriKit capability card, exercise the in-app intent simulator with sample
messaging / note-taking / reminder intents, and understand the Xcode steps required
to add a real Intents Extension target for production use.

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 14+ (`NSSiriUsageDescription` and custom intents require iOS 14+)
- Free Apple Developer account (intent simulator and UI work without a paid account;
  live Siri integration requires Siri capability which is available on free accounts)
- `pnpm install` already run

## Steps

1. Build the JS layer and run the quality gate:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native iOS project (macOS only):
   ```bash
   npx expo prebuild --clean
   ```
3. Open `ios/Spot.xcworkspace` in Xcode, select your personal team under
   **Signing & Capabilities**, and connect your iPhone.
4. Build and run with **Product → Run** (⌘R).
5. In the app, open the **Modules** tab and tap **SiriKit**.
6. Review the **SiriKit Capability** card — it shows feature availability for this device.
7. In the **Intent Simulator** panel, tap each sample intent card
   (Messaging, Note-Taking, Reminders) to simulate a handler response.
8. Open the **Vocabulary** panel and inspect the registered vocabulary entries.
9. Read the **Setup Guide** card for the Xcode-side Intents Extension steps.

> **Note:** A production SiriKit integration requires an **Intents Extension** target
> and an **Intents UI Extension** target added in Xcode. The lab demonstrates the
> capability surface and bridging; the extensions are not shipped in this feature.

## Verify

- SiriKit capability card loads without errors
- Intent simulator shows a response for each sample intent type
- Setup Guide renders all five configuration steps
- `NSSiriUsageDescription` is present in the built Info.plist
  (verify via Xcode → Product → Show Build Folder → Info.plist)

## Troubleshooting

- **"Siri is not available" shown in capability card** → Siri must be enabled in
  **Settings → Siri & Search** on the device
- **Intent simulator shows no response** → the bridge is a stub; responses are
  simulated in JS. If the card is blank, check the Xcode console for module errors
- **`NSSiriUsageDescription` missing** → run `npx expo prebuild --clean`; the
  `with-sirikit` plugin injects the key

## Implementation references

- Spec: `specs/071-sirikit/spec.md`
- Plan: `specs/071-sirikit/plan.md`
- Module: `src/modules/sirikit-lab/`
- Native bridge: `src/native/sirikit.ts`
- Plugin: `plugins/with-sirikit/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows
- [feature-072-shortcuts-snippets.md](feature-072-shortcuts-snippets.md) — Shortcuts
  custom UI snippets (related `NSUserActivityTypes` integration)