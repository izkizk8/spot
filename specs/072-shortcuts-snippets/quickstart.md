# Quickstart: 072 — Shortcuts Custom UI Snippets

## Running the Lab

```bash
cd C:\Users\izkizk8\spot-072-shortcuts
pnpm ios          # Full iOS simulator — shows all 4 cards
pnpm android      # Shows IOSOnlyBanner
pnpm web          # Shows IOSOnlyBanner
```

## Running Tests

```bash
pnpm test --testPathPattern=shortcuts-snippets
```

## Module Location
`src/modules/shortcuts-snippets-lab/`

## Bridge Location
`src/native/shortcuts-snippets.{ts,android.ts,web.ts,types.ts}`

## Plugin Location
`plugins/with-shortcuts-snippets/`

## Key Concepts Demonstrated

| Concept | Component/File |
|---------|---------------|
| Bridge availability check | `ShortcutsInfoCard` |
| Shortcut donation | `ShortcutPanel` + `useShortcutsSnippets.donateShortcut` |
| Confirmation snippet UI | `SnippetPreviewCard` (type=confirmation) |
| Result snippet UI | `SnippetPreviewCard` (type=result) |
| Add voice phrase sheet | `useShortcutsSnippets.addVoiceShortcut` |
| Setup steps | `SetupGuide` |

## Native Implementation Notes
In a real iOS project you would:
1. Add **Siri & Shortcuts** capability in Xcode
2. Create an **Intents Extension** + **Intents UI Extension** target
3. Implement `IntentHandler` in the Intents Extension
4. Override `configure(with:context:completion:)` in `IntentViewController` for snippet UI
5. Donate via `INInteraction(intent:response:).donate(completion:)`
6. Present `INUIAddVoiceShortcutViewController` from a button in the main app
