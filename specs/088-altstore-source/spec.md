# Feature Specification: AltStore source for OTA distribution

**Feature Branch**: `088-altstore-source`
**Created**: 2026-05-01
**Status**: Draft
**Input**: User description: "想通过 AltStore 的 source 安装 app，不要每次都插电脑。EAS 已连接 GitHub 仓库，推送 tag 自动 build。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Install a brand-new build from the phone (Priority: P1)

The owner has the iPhone in hand, AltStore is already installed and signed in with their free Apple ID. A new tagged release has just been published. They want to add the spot source once, install the app, and never need a USB cable for installs again.

**Why this priority**: this is the entire point of the feature. Without it the project is no better than the existing Sideloadly flow.

**Independent Test**: tag and push `vX.Y.Z`, wait for the release workflow, open AltStore on the phone, add the source URL, install spot. Pass when the app launches on the device with no PC interaction beyond running CI.

**Acceptance Scenarios**:

1. **Given** the source URL `https://izkizk8.github.io/spot/altstore/source.json` returns HTTP 200 with valid JSON, **When** the user adds it to AltStore on the iPhone, **Then** the source appears with name "spot dev" and lists at least one version of the spot app.
2. **Given** the source is added and the latest release IPA is reachable, **When** the user taps **Free** / **Get** on spot, **Then** AltStore downloads, re-signs, and installs the app without errors.
3. **Given** the install completed, **When** the user trusts the developer profile and taps the icon, **Then** spot launches and runs the build that matches the release tag.

---

### User Story 2 — Get an update notification when a new version ships (Priority: P1)

The owner pushed a new tag and the workflow finished. They open AltStore later and want to see an update is available without checking expo.dev or GitHub manually.

**Why this priority**: an OTA channel without update notifications is just a slower install button. Update detection is what makes ongoing use ergonomic.

**Independent Test**: with the source already added and an older version installed, push a new tag, wait for the workflow, open AltStore → Updates. Pass when the new version is listed and tapping update completes successfully.

**Acceptance Scenarios**:

1. **Given** version `1.0.0` is installed and `source.json` now lists `1.1.0` as the newest entry in `versions[]`, **When** the user opens AltStore Updates tab, **Then** spot appears with an "Update" button.
2. **Given** the user taps **Update**, **When** download and re-sign complete, **Then** the on-device version matches `1.1.0` (verifiable in **Settings → General → iPhone Storage → spot** or in-app version display).

---

### User Story 3 — Releasing is one command (Priority: P1)

The owner wants to ship a new version by pushing a tag — nothing else. No manual EAS dashboard clicks, no manual GitHub release creation, no hand-edited `source.json`.

**Why this priority**: any manual step in the release loop will be skipped or done wrong. Automation here is the difference between this feature being used and abandoned.

**Independent Test**: bump version in `package.json` and `app.json`, commit, `git tag vX.Y.Z && git push --tags`. Pass when within the workflow's runtime, the GitHub release exists with the IPA attached, `source.json` on Pages reflects the new version, and the source.json change is committed back to the default branch.

**Acceptance Scenarios**:

1. **Given** a clean working tree on `dev` with version `1.1.0` in `package.json`, **When** the user pushes tag `v1.1.0`, **Then** the `release-altstore.yml` workflow starts.
2. **Given** the workflow runs, **When** the EAS sideload build completes, **Then** an `.ipa` is attached to GitHub Release `v1.1.0`.
3. **Given** the release exists, **When** the workflow's source-update step finishes, **Then** `docs/altstore/source.json` on `dev` contains a new entry at the top of `versions[]` with `version: "1.1.0"`, the correct `downloadURL` pointing at the release asset, the correct `buildVersion` from EAS metadata, the correct `size` in bytes, and a valid `date`.
4. **Given** the source.json commit lands, **When** GitHub Pages redeploys, **Then** the public URL returns the updated JSON.
5. **Given** any step fails, **When** CI completes, **Then** the workflow status is **failed** and `source.json` is **not** updated, so the on-phone state stays consistent with the previous release.

---

### User Story 4 — Re-sign weekly without a cable (Priority: P2)

The free Apple ID 7-day cert expires. The owner wants the app to keep working without plugging in.

**Why this priority**: the existing Sideloadly path already supports this manually. The improvement here is documentation and Wi-Fi-only flow, not new code.

**Independent Test**: install via the source, wait 7 days (or revoke the cert manually), follow the documented refresh procedure. Pass when the app works again with no USB connection.

**Acceptance Scenarios**:

1. **Given** spot is installed via the source and the AltStore-signed cert is about to expire, **When** the iPhone is on the same Wi-Fi as a PC running AltServer, **Then** AltStore refreshes the cert in the background without user-initiated cable connection.
2. **Given** the user uses SideStore instead of AltStore Classic, **When** the cert expires, **Then** SideStore refreshes via its anisette server with no PC required.

---

### Edge Cases

- **Tag pushed without a corresponding `version` bump in `package.json` / `app.json`** → workflow must fail loudly before creating a release, so the source never references an IPA whose `Info.plist` version disagrees.
- **Two tags pushed in quick succession** → workflow runs must not interleave commits to `source.json`. Sequential ordering or a lock is required so the file's `versions[]` history stays linear.
- **EAS build succeeds but artifact download fails** → no GitHub release should be created, no source update should be committed.
- **GitHub release created but Pages deploy fails** → the release exists but the source still points at the previous version; AltStore won't show the update yet. Acceptable, recovers on next Pages deploy.
- **`source.json` commit conflicts with a concurrent commit on `dev`** → workflow must rebase/retry, not force-push.
- **Source URL temporarily unreachable** → AltStore caches the last good copy and shows existing installs unaffected.
- **An older version's release asset is deleted** → AltStore install of that specific old version fails, but newer versions remain installable. Acceptable; we only need the latest few.
- **`bundleIdentifier` changes in `app.json`** → existing AltStore install is treated as a different app and won't update; user must reinstall. Documented in howto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST publish a `source.json` file conforming to the AltStore Classic source schema, served over HTTPS at a stable URL under `izkizk8.github.io/spot/`.
- **FR-002**: `source.json` MUST contain at least one entry in `apps[]` for spot, with `bundleIdentifier` matching `app.json` (`com.izkizk8.spot`), `developerName`, `name`, `localizedDescription`, `iconURL`, and a non-empty `versions[]`.
- **FR-003**: Each entry in `versions[]` MUST include `version`, `buildVersion`, `date` (ISO 8601), `downloadURL` (HTTPS), `size` (bytes, integer), and `minOSVersion`. `version` and `buildVersion` MUST equal the values in the IPA's `Info.plist` for that release.
- **FR-004**: `versions[]` MUST be ordered with the newest version first; AltStore uses ordering, not dates, to determine "latest".
- **FR-005**: The IPA referenced by each `downloadURL` MUST be hosted on GitHub Releases for this repository, attached as an asset of a tag-named release (e.g. `v1.2.3`).
- **FR-006**: A release-automation workflow MUST trigger on git tag push matching `v*`, perform an EAS sideload build, attach the IPA to the matching GitHub release, regenerate `source.json`, and commit the change to the default branch.
- **FR-007**: The source-generation script MUST derive `version`, `buildVersion`, and `size` from authoritative sources (EAS build metadata + the actual IPA file), not from manually maintained values.
- **FR-008**: If any step in the release workflow fails — EAS build, IPA download, release upload, source regeneration, or commit — the workflow MUST fail and `source.json` MUST NOT be partially updated.
- **FR-009**: Re-running the workflow on the same tag MUST be safe: either it short-circuits (release and source already up to date) or it overwrites idempotently. It MUST NOT append duplicate entries to `versions[]`.
- **FR-010**: The repository MUST document, in `docs/_howto/altstore-source.md`, the one-time phone setup, the per-release flow, the weekly re-sign procedure, and the fallback to USB sideload.
- **FR-011**: The decision rationale MUST be captured in an ADR under `docs/_decisions/`.
- **FR-012**: `pnpm docs:check` MUST pass with the new files in place.

### Key Entities

- **Source manifest** (`docs/altstore/source.json`): the public manifest AltStore reads. Versioned in git, served by Pages.
- **Release asset** (GitHub Release `vX.Y.Z` → `spot-X.Y.Z.ipa`): the actual binary AltStore downloads. Permanent, public.
- **EAS build**: the upstream artifact source. Identified by build ID and carries the authoritative `buildVersion`.
- **Source generator** (`scripts/altstore/build-source.ts`): pure function from (`app.json`, `package.json`, EAS build metadata, IPA file size, prior `source.json`) to a new `source.json`.
- **Release workflow** (`.github/workflows/release-altstore.yml`): orchestrates EAS build → release → source update → commit → Pages deploy on `v*` tag push.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Installing or updating spot on the iPhone after a tag push requires zero PC interactions beyond pushing the tag and (weekly) having AltServer on the same Wi-Fi.
- **SC-002**: Time from `git push --tags` to the update appearing in AltStore on the phone is bounded by `EAS build time + ~5 min`, with no manual intervention.
- **SC-003**: Pushing a tag whose `version` does not match `package.json` / `app.json` fails the workflow before a release is created, with a clear error message.
- **SC-004**: `pnpm docs:check` passes after adding the new ADR, howto, generator, workflow, and `source.json`.
- **SC-005**: The published `source.json` validates against the AltStore source schema (manually verified once via [AltStudio](https://altstudio.app/) or by successful add-source on a real phone).
- **SC-006**: Re-running the release workflow on an already-released tag does not produce duplicate `versions[]` entries.

## Assumptions

- The owner has AltStore (Classic) or SideStore already installed on the iPhone and a free Apple ID configured. AltStore install itself is out of scope.
- The repository remains public; if it goes private, GitHub Releases asset URLs require auth and the design needs to revisit hosting.
- GitHub Pages is enabled for this repository (workflow source).
- An `EXPO_TOKEN` secret with build permissions is available to GitHub Actions.
- EAS free plan build quota (15/month) is sufficient for this owner's release cadence.
- Tagging convention is `v<semver>` matching `package.json` `version`.
- The free Apple ID 7-day cert and 3-app cap from ADR [0003] still apply; this feature does not attempt to fix them.
- AltStore Classic remains compatible with unsigned IPA re-signing on free Apple IDs. If AltStore drops Classic support entirely, the design needs revisiting.
- This is a personal lab repo with one consumer (the owner); multi-user concerns (Patreon gating, signed-source verification, news items) are explicitly out of scope.
