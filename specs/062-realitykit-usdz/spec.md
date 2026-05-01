# Spec: 062 — RealityKit USDZ AR Preview

## Overview

An iOS-only educational module that demonstrates 3D model preview and AR Quick
Look via RealityKit and USDZ files. On iOS 13+ users can view a bundled USDZ
model in a full-screen AR Quick Look sheet and inspect RealityKit capability
metadata. Android and Web show the IOSOnlyBanner gate.

## Platforms

| Platform | Support |
|----------|---------|
| iOS 13+  | Full (AR Quick Look + capability card) |
| Android  | IOSOnlyBanner |
| Web      | IOSOnlyBanner |

## Native Bridge Surface (`realitykit-usdz.ts`)

```ts
interface RealityKitUsdzBridge {
  getCapabilities(): Promise<RKCapabilities>;
  previewModel(modelName: string): Promise<void>;
}
```

`getCapabilities` returns device AR support flags.  
`previewModel` opens AR Quick Look for the named USDZ asset.

## Screens & Components

- `screen.tsx` — iOS: capability card + model picker + preview button + setup instructions  
- `screen.android.tsx` — IOSOnlyBanner  
- `screen.web.tsx` — IOSOnlyBanner  
- `components/IOSOnlyBanner.tsx` — reused gate component  
- `components/CapabilityCard.tsx` — AR capability summary  
- `components/ModelPicker.tsx` — select from bundled USDZ models  
- `components/PreviewButton.tsx` — trigger AR Quick Look  
- `components/SetupInstructions.tsx` — info on native requirements  
- `hooks/useRealityKitUsdz.ts` — state machine; bridge injectable for tests  

## Test Requirements

- `manifest.test.ts` — id, title, description, platforms, render  
- `screen.test.tsx` — iOS path renders all sections  
- `screen.android.test.tsx` — shows IOSOnlyBanner  
- `screen.web.test.tsx` — shows IOSOnlyBanner  
- `components/*.test.tsx` — each component  
- `useRealityKitUsdz.test.tsx` — hook state machine  
- `test/unit/native/realitykit-usdz-bridge.test.ts` — android + web stubs reject  
