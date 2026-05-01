# Spec: 072 — Shortcuts Custom UI Snippets

## Feature Summary
Educational lab demonstrating Shortcuts app integration on iOS 12+ via `INUIAddVoiceShortcutViewController` and custom Intent UI snippets (confirmation and result UIs for the Intents UI Extension).

## Goals
- Show how to present `INUIAddVoiceShortcutViewController` to let users add/edit voice phrases.
- Simulate confirmation snippet UI (shown before intent execution).
- Simulate result snippet UI (shown after intent execution).
- Demonstrate shortcut donation via `INInteraction` / `NSUserActivity`.

## Non-Goals
- Full Intents Extension native implementation (this is a simulator/educational lab).
- Android or Web Shortcuts support.

## Platforms
- **iOS 12+**: full feature  
- **Android / Web**: `IOSOnlyBanner`

## Key APIs
- `INUIAddVoiceShortcutViewController` — system sheet for adding voice shortcuts
- `INUIEditVoiceShortcutViewController` — system sheet for editing
- `IntentViewController` — custom snippet UI (confirmation + result)
- `INInteraction.donate()` — donate shortcut suggestions
- `NSUserActivity` with `isEligibleForPrediction = true`

## Bridge Contract
Exported from `src/native/shortcuts-snippets.ts` (`.android.ts` / `.web.ts` stubs reject all calls):

| Method | Signature | Description |
|--------|-----------|-------------|
| `getInfo` | `() → ShortcutsInfo` | Availability + donated count |
| `getShortcuts` | `() → ShortcutItem[]` | List donated shortcuts |
| `donateShortcut` | `(phrase, intentType) → ShortcutItem` | Donate a shortcut |
| `simulateSnippet` | `(shortcutId, type) → SnippetPreviewData` | Simulate snippet UI |
| `addVoiceShortcut` | `(shortcutId) → ShortcutItem` | Present add-phrase sheet |

## Plugin
`plugins/with-shortcuts-snippets` — seeds `NSUserActivityTypes` in `Info.plist` with `com.spot.ShortcutsSnippetsActivity` for NSUserActivity-based shortcut donation.
