# Feature Specification: EAS Build IPA for Sideloading

**Feature Branch**: `004-eas-build-ipa`
**Created**: 2026-04-25
**Status**: Complete (Archived 2026-04-26 -> .specify/memory/)
**Input**: User description: "I only have Windows. I want to use EAS Build to produce an unsigned IPA, then self-sign and sideload it to iOS."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure EAS Build for iOS Simulator Build (Priority: P1)

A developer on Windows runs `npx eas build --platform ios --profile development` from the terminal. EAS Build runs in the cloud (no Mac needed), produces a `.tar.gz` containing a `.app` bundle suitable for the iOS Simulator. The developer downloads the artifact and runs it in a simulator (if available) or proceeds to create a signed IPA for device sideloading.

**Why this priority**: EAS Build configuration is the foundational prerequisite. Without `eas.json` and an EAS project link, no build can happen. The simulator build profile validates the pipeline works before attempting device builds.

**Independent Test**: Run `npx eas build --platform ios --profile development --non-interactive` and verify it succeeds (or produces a clear error about missing Apple credentials, which is expected).

**Acceptance Scenarios**:

1. **Given** `eas.json` does not exist, **When** the developer runs `npx eas init`, **Then** the project is linked to an EAS project and `eas.json` is created with build profiles.
2. **Given** `eas.json` exists with a `development` profile, **When** the developer runs `npx eas build --platform ios --profile development`, **Then** EAS cloud builds a simulator-compatible `.app` bundle.
3. **Given** `app.json` has no `ios.bundleIdentifier`, **When** EAS Build is configured, **Then** a bundle identifier is set to `com.izkizk8.spot`.

---

### User Story 2 - Build Unsigned IPA for Device Sideloading (Priority: P2)

A developer on Windows runs `npx eas build --platform ios --profile sideload` to produce an **unsigned IPA** targeting the `iphoneos` SDK (arm64 device binary). The build uses a **custom build YAML** (`.eas/build/unsigned-ios.yml`) that skips all credential steps and builds with `CODE_SIGNING_REQUIRED=NO`. The resulting `.ipa` is downloaded from the EAS dashboard and re-signed locally using Sideloadly with a free Apple ID, then installed on iPhone via USB.

**Why this priority**: This is the core goal — getting a standalone app onto a real iOS device from Windows without paying $99/yr for Apple Developer Program.

**Independent Test**: `npx eas build --platform ios --profile sideload --non-interactive` completes successfully; the downloadable artifact on expo.dev is a `.ipa` file (not `.tar.gz`).

**Acceptance Scenarios**:

1. **Given** `eas.json` has a `sideload` profile with `withoutCredentials: true` and `config: "unsigned-ios.yml"`, **When** the developer runs the sideload build, **Then** EAS uses the custom build workflow (not the standard pipeline) and produces an unsigned `.ipa`.
2. **Given** the developer has the unsigned `.ipa`, **When** they use Sideloadly on Windows with a free Apple ID, **Then** the IPA is re-signed and installed on the connected iPhone. The certificate expires after 7 days and must be re-signed.

> **Note**: `withoutCredentials: true` alone (without custom build YAML) does NOT work — the standard EAS pipeline always runs `IosCredentialsManager.prepare`. The custom build YAML is required to skip credential steps entirely. See plan.md and research.md for details.

---

### User Story 3 - Document the Complete Sideloading Workflow (Priority: P3)

The project includes clear documentation on how to go from source code to a running app on an iOS device using only Windows. This covers EAS Build commands, Apple account requirements, signing options, and sideloading tools.

**Why this priority**: Without documentation, the developer will forget the workflow between sessions. The SDD workflow demands that implementation knowledge is captured.

**Independent Test**: A new developer can read the documentation and successfully build and sideload the app without prior EAS knowledge.

**Acceptance Scenarios**:

1. **Given** documentation exists, **When** a developer reads it, **Then** they understand the prerequisites (Expo account, free Apple Developer account), the build commands, and the sideloading process.
2. **Given** the developer has a free Apple account, **When** they read the docs, **Then** they understand the limitations (7-day re-signing, 3 app limit) and how to work within them.

---

### Edge Cases

- What if the developer has no Apple Developer account at all? The `development` profile (simulator build) works without one. Device builds require at minimum a free Apple ID enrolled in Apple Developer.
- What if EAS Build fails due to missing native modules? The `expo prebuild` step generates native projects. The `eas.json` should use managed workflow to avoid this.
- What if the developer wants to test on a physical device connected to their Windows PC? iOS devices cannot be accessed from Windows for app installation — sideloading tools (AltStore/Sideloadly) handle this via the device's network or iTunes protocol.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Create `eas.json` with at least two build profiles: `development` (simulator) and `sideload` (device IPA).
- **FR-002**: Set `ios.bundleIdentifier` in `app.json` to `com.izkizk8.spot` (required for any iOS build).
- **FR-003**: The `development` profile MUST build a simulator-compatible `.app` bundle using managed workflow.
- **FR-004**: The `sideload` profile MUST use a custom build workflow (`.eas/build/unsigned-ios.yml`) with `withoutCredentials: true` and `config: "unsigned-ios.yml"` to produce an unsigned IPA. The custom YAML skips `eas/configure_ios_credentials` and builds with `CODE_SIGNING_REQUIRED=NO`. Do NOT use `distribution: "internal"` (requires paid Apple Developer account).
- **FR-005**: Install `eas-cli` globally and document the requirement.
- **FR-006**: Create documentation covering the complete Windows → iOS sideload workflow.
- **FR-007**: Update `copilot-instructions.md` Build & Run section with EAS build commands.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `eas.json` exists with `development` and `sideload` profiles.
- **SC-002**: `app.json` has `ios.bundleIdentifier` set.
- **SC-003**: `npx eas build --platform ios --profile development` is accepted by EAS CLI and the build appears as queued or in-progress on the EAS dashboard.
- **SC-004**: Documentation exists covering prerequisites, build commands, and sideloading steps.

## Clarifications

### Session 2026-04-25

- Q: What bundle identifier should be used? → A: `com.izkizk8.spot` (username-based reverse domain, unique).
- Q: Free or paid Apple Developer account? → A: Free Apple ID only. Custom build YAML (`.eas/build/unsigned-ios.yml`) + `withoutCredentials: true` produces unsigned IPA — no Apple credentials needed for the build step. Sideloadly re-signs with free Apple ID on Windows. Note: `withoutCredentials` alone (without custom YAML) does NOT work; `distribution: "internal"` also requires paid account.

## Assumptions

- The developer has an Expo account (free, required for EAS Build).
- The developer has a **free Apple ID** (sufficient for Sideloadly re-signing).
- The bundle identifier is `com.izkizk8.spot`.
- EAS Build produces an **unsigned IPA** via custom build YAML + `withoutCredentials: true`. The standard pipeline's `withoutCredentials` alone does NOT work — a custom build YAML is required to skip credential steps.
- **Sideloadly** on Windows re-signs the unsigned IPA with a free Apple ID and installs via USB.
- The project uses Expo managed workflow (no custom native code beyond Expo modules).
- Free Apple ID certificates expire after 7 days — the same IPA can be re-signed without rebuilding.

## Out of Scope

- Setting up a Mac build environment
- App Store submission (TestFlight, App Store Connect)
- Android APK/AAB builds (can be added later)
- CI/CD pipeline for automated builds
- Custom native modules requiring `expo prebuild`
