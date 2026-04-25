# Tasks: EAS Build Unsigned IPA for Sideloading

**Input**: Design documents from `/specs/004-eas-build-ipa/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (available)

**Tests**: Not applicable — config/docs-only feature (Constitution V exemption). Manual verification via EAS build result.

**Organization**: Tasks grouped by user story. US1 = foundation, US2 = unsigned IPA build, US3 = documentation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Install prerequisites and link project to EAS.

- [x] T001 Install eas-cli globally via `npm install -g eas-cli` and verify with `eas --version`
- [x] T002 Run `eas login` to authenticate with Expo account (interactive)
- [x] T003 Run `eas init` to link project to EAS and create project ID on expo.dev (interactive)

**Checkpoint**: Project linked to EAS. `eas-cli` installed and authenticated.

---

## Phase 2: User Story 1 — Configure EAS Build Basics (Priority: P1) 🎯 MVP

**Goal**: Set bundle identifier, create `eas.json` with `development` (simulator) profile, validate the build pipeline works.

**Independent Test**: `eas.json` exists; `app.json` has `ios.bundleIdentifier`; simulator build succeeds on EAS dashboard.

### Implementation for User Story 1

- [x] T004 [US1] Add `ios.bundleIdentifier: "com.izkizk8.spot"` and `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` to app.json
- [x] T005 [US1] Create `eas.json` with `development` profile (`ios.simulator: true`) and `production` profile (empty `{}`) at project root
- [x] T006 [US1] Validate simulator build: run `npx eas build --platform ios --profile development --non-interactive` and confirm build queues/completes on EAS dashboard (SC-003) — ✅ build 50cc8ed9 succeeded

**Checkpoint**: EAS pipeline validated. SC-001 (partial), SC-002, SC-003 met.

---

## Phase 3: User Story 2 — Build Unsigned IPA via Custom Workflow (Priority: P2)

**Goal**: Produce an unsigned `.ipa` targeting `iphoneos` SDK (arm64 device binary) using a custom build YAML that skips all credential steps.

**Independent Test**: `eas build --profile sideload` completes successfully; downloadable artifact on expo.dev is a `.ipa` (not `.tar.gz`).

### Implementation for User Story 2

- [x] T007 [US2] Create `.eas/build/unsigned-ios.yml` custom build workflow with steps: `eas/checkout` → `eas/install_node_modules` → `eas/resolve_build_config` → `eas/prebuild` → `pod install` → xcodebuild with `CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO -sdk iphoneos` → package `.app` into `Payload/` → zip as `unsigned.ipa` → `eas/upload_artifact` (NOTE: do NOT include `eas/configure_eas_update` — expo-updates is not installed)
- [x] T008 [US2] Add `sideload` profile to eas.json with `ios.withoutCredentials: true`, `ios.simulator: false`, and `ios.config: "unsigned-ios.yml"` in eas.json
- [x] T009 [US2] Trigger build: run `npx eas build --platform ios --profile sideload --non-interactive` and verify the custom workflow runs (not the standard pipeline) — ✅ build cdb774a4 succeeded with custom workflow
- [x] T010 [US2] Verify build produces downloadable `.ipa` on expo.dev dashboard — ✅ https://expo.dev/artifacts/eas/rpmUqmvTf8qwjyi8dWSzKi.ipa

**Checkpoint**: Unsigned IPA produced. SC-001 fully met (both `development` and `sideload` profiles).

---

## Phase 4: User Story 3 — Document Complete Sideloading Workflow (Priority: P3)

**Goal**: Comprehensive guide: build unsigned IPA → re-sign with Sideloadly/AltStore → install on iPhone → trust certificate → understand 7-day limit.

**Independent Test**: A developer can read `docs/eas-build-guide.md` and go from zero to app-on-device without prior EAS knowledge.

### Implementation for User Story 3

- [x] T011 [P] [US3] Write docs/eas-build-guide.md with sections: TL;DR, prerequisites, one-time setup, unsigned IPA build command, Sideloadly re-sign workflow, AltStore alternative, free Apple ID limitations (7-day cert, 3 app limit, no capabilities), troubleshooting table, quick reference
- [x] T012 [P] [US3] Update .github/copilot-instructions.md Build & Run section with: `npx eas build --profile sideload` (unsigned IPA), `--profile development` (simulator), Expo Go, and link to docs/eas-build-guide.md
- [x] T013 [US3] Update specs/004-eas-build-ipa/research.md with corrected findings: custom build YAML + `withoutCredentials` DOES work — build cdb774a4 produced unsigned IPA

**Checkpoint**: Documentation complete and accurate. SC-004 met.

---

## Phase 5: Polish & Verification

**Purpose**: Final validation of all success criteria.

- [x] T014 [P] Verify SC-001: `eas.json` has `development` and `sideload` profiles ✅
- [x] T015 [P] Verify SC-002: `app.json` has `ios.bundleIdentifier` set to `com.izkizk8.spot` ✅
- [x] T016 [P] Verify SC-003: builds completed on EAS dashboard — simulator (50cc8ed9) + unsigned IPA (cdb774a4) ✅
- [x] T017 [P] Verify SC-004: docs/eas-build-guide.md exists with unsigned IPA workflow + Sideloadly instructions ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Setup (T001–T003)
- **US2 (Phase 3)**: Depends on US1 (eas.json and app.json must exist)
- **US3 (Phase 4)**: Depends on US2 build result (need to know if custom build works)
- **Polish (Phase 5)**: Depends on all prior phases

### User Story Dependencies

```text
T001 → T002 → T003 → T004, T005 → T006

T006 → T007, T008 → T009 → T010

T010 → T011, T012, T013 → T014, T015, T016, T017
```

### Parallel Opportunities

- T011, T012: Different files (docs/eas-build-guide.md vs .github/copilot-instructions.md)
- T014–T017: All independent verification checks

---

## Implementation Strategy

- **MVP**: US1 (T001–T006) — EAS configured, simulator build validated
- **Core**: US2 (T007–T010) — Unsigned IPA via custom build workflow
- **Docs**: US3 (T011–T013) — Complete sideloading documentation
- **Final**: Verification (T014–T017)

**Total tasks**: 17
- **Setup**: 3 tasks (T001–T003)
- **Per story**: US1: 3 tasks (T004–T006), US2: 4 tasks (T007–T010), US3: 3 tasks (T011–T013)
- **Verification**: 4 tasks (T014–T017)

## Note on Interactive Steps

Tasks T001–T003 require **interactive terminal input** (login, project linking). T009 runs non-interactively but the developer should monitor the build logs on expo.dev to confirm the custom workflow executed.
