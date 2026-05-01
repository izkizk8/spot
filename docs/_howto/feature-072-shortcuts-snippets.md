---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+
  - iPhone running iOS 16+
  - Apple Developer account (free tier is sufficient)
---

# How to verify Shortcuts custom UI snippets on iPhone

## Goal

Donate a shortcut from the lab, add a voice phrase via the system
`INUIAddVoiceShortcutViewController` sheet, and confirm the four Shortcuts
integration cards render correctly (bridge info, donation, confirmation snippet,
result snippet).

## Prerequisites

- macOS with Xcode 15+
- iPhone running iOS 16+ (`NSUserActivityTypes` and Shortcuts UI require iOS 16+)
- Free Apple Developer account
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
5. In the app, open the **Modules** tab and tap **Shortcuts Snippets**.
6. The **Bridge Info** card shows availability status for this OS version.
7. In the **Shortcut Panel**, tap **Donate Shortcut** — an `INInteraction`
   donation is submitted and a success toast appears.
8. Tap **Add Voice Phrase** — the system
   `INUIAddVoiceShortcutViewController` sheet appears.
9. Follow the prompts to record a voice phrase, then tap **Done**.
10. Open the iOS Shortcuts app and confirm the donated shortcut appears under
    **My Shortcuts**.
11. Back in the lab, inspect the **Snippet Preview** cards (confirmation and
    result types) for the correct layout.

## Verify

- "Donate Shortcut" shows a success indicator without crashing
- "Add Voice Phrase" sheet opens and can be completed or dismissed
- Donated shortcut appears in the iOS Shortcuts app
- Both Snippet Preview cards (confirmation, result) render without layout errors

## Troubleshooting

- **"Add Voice Phrase" sheet does not open** → Siri must be enabled in
  **Settings → Siri & Search**; grant Siri permission when prompted
- **Donated shortcut not visible in Shortcuts app** → `INInteraction.donate`
  is asynchronous; wait a few seconds and refresh the Shortcuts app
- **`NSUserActivityTypes` missing from Info.plist** → run
  `npx expo prebuild --clean`; the `with-shortcuts-snippets` plugin injects
  the activity types
- **IOSOnlyBanner shown instead of lab** → Android and Web are expected to show
  this banner; run on an iOS device or simulator

## Implementation references

- Spec: `specs/072-shortcuts-snippets/spec.md`
- Plan: `specs/072-shortcuts-snippets/plan.md`
- Module: `src/modules/shortcuts-snippets-lab/`
- Native bridge: `src/native/shortcuts-snippets.ts`
- Plugin: `plugins/with-shortcuts-snippets/`

## See Also

- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows
- [feature-071-sirikit.md](feature-071-sirikit.md) — SiriKit Custom Intents