# Plan — Feature 070 iCloud Drive

## Design

The feature follows the established bridge-per-module pattern used in features 053–064.

```
src/native/icloud-drive.types.ts      ← shared types + error class
src/native/icloud-drive.ts            ← iOS bridge (requireOptionalNativeModule)
src/native/icloud-drive.android.ts    ← Android stub (rejects all)
src/native/icloud-drive.web.ts        ← Web stub (rejects all)

src/modules/icloud-drive-lab/
  index.tsx                            ← ModuleManifest
  screen.tsx                           ← iOS UI (FileList + actions)
  screen.android.tsx                   ← IOSOnlyBanner
  screen.web.tsx                       ← IOSOnlyBanner
  hooks/useICloudDrive.ts              ← state machine, bridge injection seam
  components/EntitlementBanner.tsx     ← explains paid developer account
  components/FileList.tsx              ← renders ICloudFileItem[]
  components/FileActions.tsx           ← write / refresh buttons
  components/SetupInstructions.tsx     ← step-by-step enablement guide

plugins/with-icloud-drive/
  package.json
  index.ts                             ← sets entitlements + NSUbiquitousContainers
```

## Phases

1. Spec / plan / tasks / quickstart authored.
2. Native bridge stubs (types, iOS, android, web).
3. Module UI + hook.
4. Plugin.
5. Unit tests.
6. Registry + app.json.
7. `pnpm format && pnpm check`.
8. Commit.
