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
