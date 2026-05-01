# How-To Guides

Step-by-step procedures that involve **information from outside this repo** (external tools, services, manual workflows). Anything generated profiles can't capture.

## When to add a how-to

- Walkthrough of an external tool (Sideloadly, EAS dashboard, App Store Connect...)
- Multi-step manual procedure that's not just "run this command"
- Onboarding-style: "first time doing X"

## When NOT

- "How to run lint" → that's just `pnpm lint`, lives in (future generated) `tooling_profile.md`
- Architecture explanation → `architecture.md` (generated)
- Why we chose X → `_decisions/`

## How

Copy `_template.md` to `<short-slug>.md`. Keep it task-focused.

## Index

| File | Topic |
|------|-------|
| [sideload-iphone.md](sideload-iphone.md) | Install free unsigned IPA on iPhone (Windows → iOS sideload) |
| [feature-053-swiftdata.md](feature-053-swiftdata.md) | Verify SwiftData on iPhone |
| [feature-057-photokit.md](feature-057-photokit.md) | Verify PhotoKit / PHPicker on iPhone |
| [feature-060-visual-look-up.md](feature-060-visual-look-up.md) | Verify Visual Look Up (long-press image recognition, iOS 15+) on iPhone |
| [feature-062-realitykit-usdz.md](feature-062-realitykit-usdz.md) | Verify RealityKit USDZ AR Quick Look on iPhone |
| [feature-064-core-image.md](feature-064-core-image.md) | Verify Core Image filters (CIFilter) on iPhone |
| [feature-070-icloud-drive.md](feature-070-icloud-drive.md) | Verify iCloud Drive (requires paid Apple Developer account) on iPhone |
| [feature-071-sirikit.md](feature-071-sirikit.md) | Verify SiriKit Custom Intents on iPhone |
| [feature-072-shortcuts-snippets.md](feature-072-shortcuts-snippets.md) | Verify Shortcuts custom UI snippets on iPhone |
| [feature-080-live-text.md](feature-080-live-text.md) | Verify Live Text OCR (iOS 16+) on iPhone |
| [feature-082-pencilkit.md](feature-082-pencilkit.md) | Verify PencilKit drawing canvas on iPhone |
| [feature-083-live-stickers.md](feature-083-live-stickers.md) | Verify Live Stickers cut-out subjects (iOS 17+) on iPhone |
| [feature-087-controls.md](feature-087-controls.md) | Verify Control Center custom Controls (iOS 18+) on iPhone |
