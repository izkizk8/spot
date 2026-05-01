# Plan — Feature 057 PhotoKit Lab

## Layers

| Layer | Files |
|-------|-------|
| Types | `src/native/photokit.types.ts` |
| Bridge | `src/native/photokit.ts`, `.android.ts`, `.web.ts` |
| Hook | `src/modules/photokit-lab/hooks/usePhotoKit.ts` |
| Components | `IOSOnlyBanner`, `CapabilityCard`, `PhotoGrid`, `PhotoPicker`, `SetupInstructions` |
| Screens | `screen.tsx`, `screen.android.tsx`, `screen.web.tsx` |
| Manifest | `src/modules/photokit-lab/index.tsx` |
| Registry | `src/modules/registry.ts` (append) |
| Plugin | `plugins/with-photokit/index.ts`, `package.json` |
| Config | `app.json` (append plugin) |
| Tests | `test/unit/modules/photokit-lab/`, `test/unit/plugins/with-photokit/` |

## Key decisions

- `PHPickerViewController` requires no permission for read access; `NSPhotoLibraryUsageDescription`
  is still needed for any write/full-access path and is added by the plugin.
- The bridge exposes `getAuthorizationStatus` (synchronous-ish query) and `requestAuthorization`
  (triggers the system dialog) separately so the UI can react to pre-authorized state without
  re-prompting.
- `presentPicker` accepts an optional `PickerConfig` (`selectionLimit`, `mediaTypes`) so the
  demo can show different configurations.
- Assets returned include `uri`, `filename`, `width`, `height`, `mediaType`, `creationDate`.
