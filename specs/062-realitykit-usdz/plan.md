# Plan: 062 — RealityKit USDZ AR Preview

## Implementation Order

1. Native types (`src/native/realitykit-usdz.types.ts`)
2. Bridge iOS / Android / Web variants
3. Module components (IOSOnlyBanner, CapabilityCard, ModelPicker, PreviewButton, SetupInstructions)
4. Hook (`useRealityKitUsdz.ts`)
5. Screens (screen.tsx, screen.android.tsx, screen.web.tsx)
6. Module manifest (index.tsx)
7. Register in registry.ts
8. Unit tests
9. Spec docs (quickstart.md)
10. `pnpm format && pnpm check`
