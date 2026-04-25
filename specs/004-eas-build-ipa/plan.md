# Implementation Plan: EAS Build Unsigned IPA for Sideloading

**Branch**: `004-eas-build-ipa` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-eas-build-ipa/spec.md`

## Summary

Build an unsigned IPA on EAS (free plan, free Apple account) using a **custom build workflow** (`.eas/build/unsigned-ios.yml`) that skips iOS credential steps entirely. The unsigned IPA is then re-signed locally with Sideloadly/AltStore using a free Apple ID and sideloaded to iPhone via USB.

**Key discovery**: `withoutCredentials: true` alone fails because the standard EAS pipeline always runs credential restore. The fix is a **custom build YAML** that replaces the standard pipeline with explicit steps that omit `eas/configure_ios_credentials`, and use `xcodebuild` with `CODE_SIGNING_REQUIRED=NO`.

## Technical Context

**Language/Version**: JSON (eas.json, app.json) + YAML (custom build workflow) + Markdown (docs)
**Primary Dependencies**: `eas-cli` (global), Expo SDK 55
**Storage**: N/A
**Testing**: Manual — build produces downloadable `.ipa` artifact on expo.dev dashboard
**Target Platform**: iOS device (built in EAS cloud, no Mac needed)
**Project Type**: Configuration + custom build workflow + documentation
**Constraints**: Free EAS plan (15 iOS builds/month, 60 min CI/CD) + free Apple ID (7-day cert, 3 app limit via Sideloadly)
**Scale/Scope**: 4 files created/modified

## Constitution Check

| Principle | Applies? | Status |
|-----------|----------|--------|
| I. Cross-Platform Parity | Partially — adds iOS device build | PASS |
| II–IV | No — no UI code | PASS |
| V. Test-First | Exemption — config/docs only | PASS |

**Gate result**: PASS

## Project Structure

### Files Created/Modified

```text
.eas/build/unsigned-ios.yml      # NEW: Custom build workflow (xcodebuild + no signing)
eas.json                         # EDIT: sideload profile with config + withoutCredentials
app.json                         # EDIT: ios.bundleIdentifier, ios.infoPlist
docs/eas-build-guide.md          # NEW/EDIT: Complete unsigned IPA + Sideloadly workflow
.github/copilot-instructions.md  # EDIT: Build & Run section
```

### Files Preserved

```text
src/                             # No source code changes
.specify/                        # No Spec Kit changes
```

## Approach: Custom Build Workflow

The custom build schema (docs.expo.dev/custom-builds/schema, updated 2026-04-02) shows that when `withoutCredentials` or `simulator` is set, the `eas/build` function skips `eas/configure_ios_credentials`. Our custom YAML explicitly:

1. Uses `eas/checkout`, `eas/install_node_modules`, `eas/prebuild` (standard steps)
2. Runs `pod install` manually
3. Builds with `xcodebuild -sdk iphoneos CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO`
4. Packages `.app` → `Payload/` → `unsigned.ipa`
5. Uploads via `eas/upload_artifact`

The resulting `.ipa` targets `iphoneos` SDK (arm64 device binary) and can be re-signed by Sideloadly.
