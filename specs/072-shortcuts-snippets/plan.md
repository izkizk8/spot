# Plan: 072 — Shortcuts Custom UI Snippets

## Implementation Approach
Follow the 071-sirikit pattern: thin JS bridge with platform stubs, hook-based state machine, component library, Expo config plugin, unit tests.

## Layers

### 1. Native Bridge (`src/native/shortcuts-snippets.*`)
- `shortcuts-snippets.types.ts` — all shared types + `ShortcutsSnippetsNotSupported` error class
- `shortcuts-snippets.ts` — iOS variant using `requireOptionalNativeModule`
- `shortcuts-snippets.android.ts` — stub, all methods reject
- `shortcuts-snippets.web.ts` — stub, all methods reject

### 2. Module (`src/modules/shortcuts-snippets-lab/`)
- `index.tsx` — `ModuleManifest` with id `shortcuts-snippets-lab`, `minIOS: "12.0"`
- `screen.tsx` — iOS: `Platform.OS !== 'ios'` gate, `ScrollView` with 4 cards
- `screen.android.tsx` — renders `IOSOnlyBanner`
- `screen.web.tsx` — renders `IOSOnlyBanner`
- `hooks/useShortcutsSnippets.ts` — state machine + `__setShortcutsSnippetsBridgeForTests`
- `components/IOSOnlyBanner.tsx`
- `components/ShortcutsInfoCard.tsx`
- `components/ShortcutPanel.tsx`
- `components/SnippetPreviewCard.tsx`
- `components/SetupGuide.tsx`

### 3. Plugin (`plugins/with-shortcuts-snippets/`)
- `package.json` — `@spot/with-shortcuts-snippets`
- `index.ts` — `applyShortcutsSnippetsInfoPlist` seeds `NSUserActivityTypes`

### 4. Registry + app.json
- `src/modules/registry.ts` — append `shortcutsSnippetsLab`
- `app.json` — append `./plugins/with-shortcuts-snippets` (→ 43 plugins)

### 5. Tests
- 7 module tests (manifest, 3 screens, hook, 5 components)
- 1 plugin test (pure helpers + plugin + chain + app.json count)
- 6 coexistence tests bumped 42→43

## Dependencies
- No new npm packages
- Follows existing `ThemedText` / `ThemedView` / `Spacing` conventions
