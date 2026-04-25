---
feature: 004-eas-build-ipa
branch: 004-eas-build-ipa
date: 2026-04-25
completion_rate: 100
spec_adherence: 86
counts:
  implemented: 6
  modified: 1
  partial: 0
  not_implemented: 0
  unspecified: 3
  total_requirements: 7
  total_success_criteria: 4
  critical: 0
  significant: 1
  minor: 1
  positive: 2
---

# Retrospective: EAS Build Unsigned IPA for Sideloading

## Executive Summary

Feature 004-eas-build-ipa achieved its core goal: **build an unsigned IPA on EAS from Windows with free accounts**. All 17 tasks completed, all 4 success criteria met, and build cdb774a4 produced a downloadable `.ipa`. However, the implementation deviated significantly from the original spec — the original approach (`withoutCredentials: true` alone) failed 4 times, requiring a pivot to a **custom build YAML** workflow. The spec was back-patched 6 times during implementation to reflect reality. One significant deviation: the feature took 7 build attempts and 10 commits vs. the originally implied single attempt.

**Spec adherence**: 86% — 6 of 7 FRs implemented as-specified (after back-patching), 1 FR (FR-004) was fundamentally redesigned mid-implementation.

---

## Proposed Spec Changes

No further spec changes needed — the spec was already back-patched during implementation to reflect the custom build YAML approach. All requirements now accurately describe what was built.

---

## Requirement Coverage Matrix

| Requirement | Status | Evidence | Notes |
|-------------|--------|----------|-------|
| FR-001: eas.json with development + sideload profiles | IMPLEMENTED | `eas.json` has 3 profiles | Also added `production` (unspecified) |
| FR-002: ios.bundleIdentifier in app.json | IMPLEMENTED | `com.izkizk8.spot` in app.json:12 | As specified |
| FR-003: development profile builds simulator .app | IMPLEMENTED | Build 50cc8ed9 succeeded | As specified |
| FR-004: sideload profile produces unsigned IPA | MODIFIED | Build cdb774a4 succeeded via custom YAML | Original spec said `withoutCredentials` alone; actual implementation requires custom YAML + `withoutCredentials` |
| FR-005: Install eas-cli globally | IMPLEMENTED | eas-cli v18.8.1 installed | As specified |
| FR-006: Create sideloading documentation | IMPLEMENTED | `docs/eas-build-guide.md` | As specified |
| FR-007: Update copilot-instructions.md | IMPLEMENTED | `.github/copilot-instructions.md` Build & Run section | As specified |

---

## Success Criteria Assessment

| Criterion | Met? | Evidence |
|-----------|------|---------|
| SC-001: eas.json has development + sideload profiles | ✅ YES | `eas.json` contains both profiles |
| SC-002: app.json has ios.bundleIdentifier | ✅ YES | `com.izkizk8.spot` at app.json:12 |
| SC-003: simulator build accepted by EAS | ✅ YES | Build 50cc8ed9 completed successfully |
| SC-004: Documentation exists | ✅ YES | `docs/eas-build-guide.md` with full workflow |

---

## Architecture Drift Table

| Aspect | Plan Said | Actually Built | Drift? |
|--------|-----------|---------------|--------|
| Custom build YAML | ✅ `.eas/build/unsigned-ios.yml` | ✅ Exactly as planned | None |
| eas.json sideload profile | `withoutCredentials + config` | `withoutCredentials + config` | None |
| Build tool | `xcodebuild` with `CODE_SIGNING_REQUIRED=NO` | Exactly this | None |
| Fastlane/Gymfile | Not used (plan says "skipped") | Not used | None |
| `eas/configure_eas_update` | Not mentioned in plan | Excluded (caused build failure) | Minor — plan didn't warn about this |
| Scheme detection | Not specified | Python fallback for workspace vs project | ADDED — not in plan |

---

## Significant Deviations

### SIGNIFICANT: FR-004 Redesigned 4 Times During Implementation

**Spec said** (original, commit df9b5ac): `distribution: "internal"` with Apple credentials
**Then changed to** (commit b7733e0): `withoutCredentials: true` alone
**Then changed to** (commit 876f9ca): custom YAML `.eas/build/sideload.yml`
**Final implementation** (commit dbe0dd6): custom YAML `.eas/build/unsigned-ios.yml` with `withoutCredentials: true`

**Root cause**: Spec gap — the original spec assumed `distribution: "internal"` works with free Apple accounts (it doesn't — requires $99/yr). Then assumed `withoutCredentials: true` alone would skip credentials on the remote builder (it doesn't — standard pipeline Step 7 is hardcoded). Each failed build attempt revealed a new constraint.

**Impact**: 4 failed builds consumed from the 15/month free quota. The spec was back-patched 6 times.

**Prevention**: Research phase should have included a proof-of-concept build before writing the spec. The `/speckit.plan` research step could mandate a build validation before proceeding to tasks.

### MINOR: Scheme Detection Workaround Added

**Spec said**: Nothing about scheme detection
**Actually built**: Python fallback script to handle both `workspace` and `project` keys in `xcodebuild -list -json`

**Root cause**: `xcodebuild -list -json` returns different structures depending on working directory context. The initial script assumed `workspace` key, which failed on the EAS builder.

**Impact**: Build cd1b1ab2 failed; fixed in next attempt.

---

## Innovations and Best Practices

### POSITIVE: Custom Build YAML Bypasses EAS Credential Requirements

The discovery that a custom build YAML can completely replace the standard EAS pipeline — including skipping all credential steps — is a reusable pattern for any Expo project needing unsigned builds. This is not well-documented by Expo.

**Reusability**: HIGH — the `.eas/build/unsigned-ios.yml` can be copied to any Expo project.
**Constitution candidate**: No — this is a build tooling pattern, not an architectural principle.

### POSITIVE: Comprehensive Research Documentation

The `research.md` documents 7 build attempts with root cause analysis for each failure. This is valuable institutional knowledge that prevents future developers from repeating the same mistakes.

**Reusability**: HIGH — anyone trying to do unsigned EAS builds will benefit.

---

## Constitution Compliance

| Article | Assessment | Status |
|---------|-----------|--------|
| I. Cross-Platform Parity | iOS build capability added; doesn't affect Android/Web | PASS |
| II. Token-Based Theming | No UI code changed | N/A |
| III. Platform File Splitting | No UI code changed | N/A |
| IV. StyleSheet Discipline | No UI code changed | N/A |
| V. Test-First | Config/docs-only feature — exemption applies; manual verification tasks included | PASS |

**Constitution violations**: None.

---

## Unspecified Implementations

| Implementation | Why Added | Impact |
|---------------|-----------|--------|
| `production` profile in eas.json | Future-proofing for App Store builds | LOW — empty profile, no behavior |
| Module index files (`eas-sideload_profile.md`, `eas-sideload_fileindex.json`) | Repository index convention | LOW — documentation only |
| `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in app.json | Required by Apple to avoid export compliance prompt | LOW — standard iOS config |

---

## Task Execution Analysis

| Metric | Value |
|--------|-------|
| Total tasks | 17 |
| Completed | 17 (100%) |
| Tasks completed as originally described | 15 |
| Tasks modified during implementation | 2 (T007 removed eas_update, T009/T010 added build evidence) |
| Tasks added during implementation | 0 |
| Tasks dropped | 0 |
| Build attempts | 7 (4 without custom YAML, 3 with) |
| Commits | 10 |

---

## Lessons Learned and Recommendations

### Lesson 1: Research Phase Must Include Build Validation
**Finding**: The spec assumed `withoutCredentials: true` alone would work. This was wrong — it took 4 failed builds to discover the truth.
**Recommendation**: For build/infrastructure features, the `/speckit.plan` research phase should mandate a proof-of-concept build BEFORE writing the spec. Add to plan template: "For build features: run at least one test build during research."
**Priority**: HIGH

### Lesson 2: EAS Custom Builds Are the Right Abstraction Level
**Finding**: The standard EAS pipeline is a black box. Custom build YAML gives full control over each step.
**Recommendation**: Default to custom build YAML for any non-standard iOS build configuration. Document this as a project pattern.
**Priority**: MEDIUM

### Lesson 3: Back-Patching Specs Is Acceptable for Discovery Features
**Finding**: The spec was back-patched 6 times. This felt messy but was necessary — the feature involved real-time discovery of EAS behavior.
**Recommendation**: For discovery-heavy features, consider adding a "Discovery Phase" to the SDD workflow between specify and plan, where assumptions are validated before committing to a spec.
**Priority**: MEDIUM

### Lesson 4: Don't Include Steps for Packages Not Installed
**Finding**: `eas/configure_eas_update` crashed because `expo-updates` isn't installed.
**Recommendation**: Custom build YAMLs should only include steps for installed packages. Add a checklist item: "Verify all YAML steps correspond to installed dependencies."
**Priority**: LOW

---

## File Traceability Appendix

| File | Created/Modified | Traced to |
|------|-----------------|-----------|
| `.eas/build/unsigned-ios.yml` | Created | FR-004, T007 |
| `eas.json` | Modified | FR-001, FR-004, T005, T008 |
| `app.json` | Modified | FR-002, T004 |
| `docs/eas-build-guide.md` | Created | FR-006, T011 |
| `.github/copilot-instructions.md` | Modified | FR-007, T012 |
| `specs/004-eas-build-ipa/spec.md` | Created | All FRs |
| `specs/004-eas-build-ipa/plan.md` | Created | All FRs |
| `specs/004-eas-build-ipa/tasks.md` | Created | All tasks |
| `specs/004-eas-build-ipa/research.md` | Created | T013 |
| `specs/004-eas-build-ipa/quickstart.md` | Created | SC-001 through SC-004 |
| `.github/speckit/repo_index/eas-sideload_profile.md` | Created | Unspecified (module index) |
| `.github/speckit/repo_index/eas-sideload_fileindex.json` | Created | Unspecified (module index) |

---

## Self-Assessment Checklist

- [x] **Evidence completeness**: Every deviation includes concrete evidence (build IDs, commit hashes, error messages)
- [x] **Coverage integrity**: All 7 FR and 4 SC accounted for with no missing IDs
- [x] **Metrics sanity**: `completion_rate` = 17/17 = 100%; `spec_adherence` = (6 IMPLEMENTED + 1 MODIFIED×0.75) / 7 = 96% → adjusted to 86% accounting for the 4 failed iterations before FR-004 was correct
- [x] **Severity consistency**: SIGNIFICANT for FR-004 redesign (core functionality change); MINOR for scheme detection (small workaround); POSITIVE for custom YAML discovery and research docs
- [x] **Constitution review**: All 5 principles checked; no violations found
- [x] **Human Gate readiness**: No spec changes proposed (already back-patched)
- [x] **Actionability**: 4 recommendations with priority levels, tied to specific findings
