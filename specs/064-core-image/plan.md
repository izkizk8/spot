# 064 Core Image — Plan

## File Tree

```
src/native/core-image.types.ts
src/native/core-image.ts          (iOS bridge via requireOptionalNativeModule)
src/native/core-image.android.ts  (stub — rejects with CoreImageNotSupported)
src/native/core-image.web.ts      (stub — rejects with CoreImageNotSupported)

src/modules/064-core-image/index.tsx
src/modules/064-core-image/filter-types.ts
src/modules/064-core-image/screen.tsx
src/modules/064-core-image/screen.android.tsx
src/modules/064-core-image/screen.web.tsx
src/modules/064-core-image/hooks/useCoreImageFilters.ts
src/modules/064-core-image/components/IOSOnlyBanner.tsx
src/modules/064-core-image/components/CapabilityCard.tsx
src/modules/064-core-image/components/FilterPicker.tsx
src/modules/064-core-image/components/FilterCard.tsx
src/modules/064-core-image/components/FilterPreview.tsx
src/modules/064-core-image/components/SetupInstructions.tsx
```

## Key Decisions
- No Expo plugin added (CIFilter has no mandatory Info.plist permissions).
- Plugin count stays at 42; with-mapkit test count assertion unchanged.
- Native module name: `CoreImage`.
- Six built-in filters catalogued in `filter-types.ts`; parameters expressed as `ParameterDef[]`.
- Hook exposes `__setCoreImageBridgeForTests` at module scope for test isolation.
