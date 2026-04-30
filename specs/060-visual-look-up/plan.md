# Plan — Feature 060 Visual Look Up

## Architecture

```
src/native/visual-look-up.types.ts   ← shared types + error class
src/native/visual-look-up.ts         ← iOS bridge (requireOptionalNativeModule)
src/native/visual-look-up.android.ts ← Android stub (all methods reject)
src/native/visual-look-up.web.ts     ← Web stub (all methods reject)

src/modules/visual-look-up-lab/
  index.tsx                          ← ModuleManifest (id: 'visual-look-up-lab')
  screen.tsx                         ← iOS screen
  screen.android.tsx                 ← Android gate
  screen.web.tsx                     ← Web gate
  hooks/useVisualLookUp.ts           ← state machine + bridge seam
  components/CapabilityCard.tsx      ← support status + last analysed URI
  components/IOSOnlyBanner.tsx       ← platform gate banner
  components/SubjectsList.tsx        ← renders Subject[] rows
  components/SetupInstructions.tsx   ← setup guidance

plugins/with-visual-look-up/
  index.ts                           ← ConfigPlugin: adds NSPhotoLibraryUsageDescription
  package.json
```

## Key Decisions

1. **Bridge seam** — `__setVisualLookUpBridgeForTests` replaces the module-level bridge singleton so unit tests never touch native modules.
2. **Plugin** — adds `NSPhotoLibraryUsageDescription` only when absent (idempotent).
3. **Demo mode** — the screen provides a hard-coded image URI placeholder so CI tests pass without a real camera roll.
