# Quickstart — PhotoKit Lab (Feature 057)

## What ships

| Path | Purpose |
|------|---------|
| `src/native/photokit.types.ts` | Shared types: `PhotoAsset`, `PickerConfig`, `AuthorizationStatus`, `PhotoKitBridge` |
| `src/native/photokit.ts` | iOS bridge via `requireOptionalNativeModule('PhotoKit')` |
| `src/native/photokit.android.ts` | Android stub (rejects all calls) |
| `src/native/photokit.web.ts` | Web stub (rejects all calls) |
| `src/modules/photokit-lab/` | Lab module: manifest, screens, hook, components |
| `plugins/with-photokit/` | Expo config plugin: sets `NSPhotoLibraryUsageDescription` |

## Running on device

```bash
pnpm ios   # tap "PhotoKit" in the Modules tab
```

## Running tests

```bash
pnpm test -- --testPathPattern=photokit
```
