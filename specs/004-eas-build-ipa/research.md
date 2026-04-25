# Research: EAS Build iOS from Windows with Free Apple Account

**Feature**: 004-eas-build-ipa | **Date**: 2026-04-25
**Latest doc verification**: 2026-04-25
**Build verification**: ✅ Build [cdb774a4](https://expo.dev/accounts/izkizk8/projects/spot/builds/cdb774a4-16b5-4e70-9c6a-ecddeb891663) succeeded — unsigned IPA produced at `https://expo.dev/artifacts/eas/rpmUqmvTf8qwjyi8dWSzKi.ipa`

## Definitive Answer

**Q: Can you build an unsigned IPA with free EAS + free Apple account?**

**A: YES.** Using a **custom build YAML** (`.eas/build/unsigned-ios.yml`) + `withoutCredentials: true` + `config: "unsigned-ios.yml"`, EAS Build produces an unsigned `.ipa` targeting the `iphoneos` SDK (arm64 device binary). No Apple credentials needed. The IPA can be re-signed with Sideloadly using a free Apple ID.

---

## Finding 1: `withoutCredentials: true` Alone Does NOT Work — Custom Build YAML Required

**Decision**: Use `withoutCredentials: true` **combined with** a custom build YAML.

**What the docs say** (docs.expo.dev/eas/json, iOS-specific options):
> `withoutCredentials` (boolean) - When set to true, EAS CLI won't require you to configure credentials when building the app. **This comes in handy when using EAS Build custom builds.** Defaults to false.

**What this means in practice**:
- `withoutCredentials: true` alone (without custom YAML): ❌ FAILS — the standard pipeline always runs `IosCredentialsManager.prepare` (Step 7), which crashes without credentials
- `withoutCredentials: true` + custom build YAML: ✅ WORKS — the custom YAML replaces the standard pipeline, skipping credential steps entirely

**Evidence — failed attempts without custom YAML**:

| Attempt | Configuration | Result |
|---------|--------------|--------|
| 1 | `withoutCredentials: true`, no distribution | PREPARE_CREDENTIALS crash |
| 2 | `distribution: "internal"` + `withoutCredentials: true` | Same crash |
| 3 | Old custom workflow (format issue) | Standard pipeline ran instead |
| 4 | `distribution: "store"` + `withoutCredentials: true` | CLI hung |

**Evidence — successful attempt with custom YAML**:

| Attempt | Configuration | Result |
|---------|--------------|--------|
| 5 (40ad5d9e) | Custom YAML + `withoutCredentials` | ❌ `eas/configure_eas_update` failed (expo-updates not installed) |
| 6 (cd1b1ab2) | Fixed YAML (removed eas_update) | ❌ `KeyError: 'workspace'` in scheme detection |
| 7 (cdb774a4) | Fixed scheme detection | ✅ **SUCCESS** — unsigned IPA produced |

---

## Finding 2: Custom Builds Work on Free EAS Plan

**Decision**: Custom builds DO work on the free EAS plan. Previous failures were due to YAML format/content issues, not plan restrictions.

**Evidence**: Build cdb774a4 used:
- Free EAS account (izkizk8)
- `customBuildConfig.path: ".eas/build/unsigned-ios.yml"`
- `customWorkflowName: "Unsigned iOS device build"`
- Build mode: `CUSTOM`
- Result: ✅ Success — IPA artifact uploaded

**Previous misunderstanding**: Earlier attempts with a different YAML file (`.eas/build/sideload.yml`) appeared to silently fall back to the standard pipeline. This was likely due to YAML format issues, not a plan restriction.

---

## Finding 3: The Working Custom Build YAML

The successful YAML (`.eas/build/unsigned-ios.yml`) uses these steps:

1. `eas/checkout` — check out source
2. `eas/install_node_modules` — install dependencies
3. `eas/resolve_build_config` — resolve build config
4. `eas/prebuild` — generate native iOS project
5. `pod install` — install CocoaPods dependencies
6. `xcodebuild` with `CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO -sdk iphoneos` — build unsigned device binary
7. Package `.app` → `Payload/` → zip as `unsigned.ipa`
8. `eas/upload_artifact` — upload IPA to EAS

**Key exclusions** (steps NOT in the YAML):
- ❌ `eas/configure_ios_credentials` — skipped (no credentials needed)
- ❌ `eas/configure_eas_update` — skipped (expo-updates not installed)
- ❌ `eas/generate_gymfile_from_template` — skipped (using xcodebuild directly)
- ❌ `eas/run_fastlane` — skipped (using xcodebuild directly)

---

## Finding 4: Sideloading Workflow

The complete chain from source to device:

```
EAS Build (cloud, free)     Sideloadly (Windows)         iPhone
───────────────────         ────────────────────         ───────
eas build --profile sideload
  custom YAML + withoutCredentials
  → unsigned .ipa              → re-sign with free Apple ID
                               → USB push to device       → Trust developer cert
                                                          → App runs (7 days)
```

**Free Apple ID limitations** (via Sideloadly):
- Apps expire after **7 days** — must re-sign weekly (same IPA, no rebuild)
- Maximum **3 active sideloaded apps** per Apple ID
- No push notifications, iCloud, or other paid capabilities
- Must trust developer certificate on device (Settings → VPN & Device Management)

---

## Finding 5: EAS Pricing — Free Plan Is Sufficient

| Plan | iOS Builds | Custom Builds / CI/CD | Cost |
|------|-----------|----------------------|------|
| Free | 15/month | 60 min CI/CD | $0 |

15 builds/month is sufficient for iterative development. Custom builds use the same build quota (not CI/CD quota).
