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
| [feature-019-speech-synthesis.md](feature-019-speech-synthesis.md) | Verify Speech Synthesis on iPhone |
