# Implementation Plan: Fix Spec Kit Concerns (Expanded)

**Branch**: `001-fix-speckit-concerns` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-fix-speckit-concerns/spec.md`

## Summary

Resolve all 5 identified Spec Kit profile concerns: (1) populate durable project memory files, (2) enable auto-commit for after_* lifecycle events, (3) update stale documentation references, (4) remove 6 duplicate alias agent/prompt files, and (5) populate remaining template-only memory files (DECISIONS.md, BUGS.md, WORKLOG.md). Remove the "No extension tests" concern from the profile as accepted out-of-scope.

**Note**: FR-001 through FR-007 were implemented in the first pass (tasks T001–T012, all complete). This plan covers the expanded scope: FR-008 through FR-014.

## Technical Context

**Language/Version**: Markdown (memory files), YAML (git-config.yml) — no application code changes  
**Primary Dependencies**: Spec Kit 0.8.1.dev0, git extension v1.0.0, memory-md extension v0.6.5  
**Storage**: N/A — all files are flat Markdown/YAML in the repository  
**Testing**: Manual verification — grep for placeholder text, count agent files  
**Target Platform**: N/A — configuration/documentation only  
**Project Type**: Configuration + documentation update  
**Performance Goals**: N/A  
**Constraints**: Must follow memory-md file format conventions; must not modify constitution.md; alias file deletion is destructive  
**Scale/Scope**: 3 files modified, 6 files deleted, 2 files updated in repo index

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies? | Status |
|-----------|----------|--------|
| **I. Cross-Platform Parity** | No — no application code changes | PASS |
| **II. Token-Based Theming** | No — no UI components touched | PASS |
| **III. Platform File Splitting** | No — no platform-specific code | PASS |
| **IV. StyleSheet Discipline** | No — no styles touched | PASS |
| **V. Test-First for New Features** | Partially — documentation/config only. Manual verification appropriate. | PASS (justified) |

**Gate result**: PASS — all principles satisfied or N/A.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-speckit-concerns/
├── spec.md              # Feature specification (completed + expanded)
├── plan.md              # This file (regenerated for expanded scope)
├── research.md          # Phase 0 output (from first pass, still valid)
├── data-model.md        # Phase 1 output (from first pass, still valid)
├── quickstart.md        # Phase 1 output (will be updated)
├── checklists/
│   └── requirements.md  # Spec quality checklist (from first pass)
└── tasks.md             # Phase 2 output (will be regenerated)
```

### Files Modified (repository root)

```text
# Already completed (first pass):
docs/memory/
├── PROJECT_CONTEXT.md   # ✅ US1: Populated
└── ARCHITECTURE.md      # ✅ US1: Populated

.specify/extensions/git/
└── git-config.yml       # ✅ US2: 8 after_* events enabled

.github/speckit/repo_index/
├── speckit_profile.md   # ✅ US3: Constitution concern removed (needs further updates for US4/US5)
└── architecture.md      # ✅ US3: Constitution debt removed

# New scope (this pass):
docs/memory/
├── DECISIONS.md         # US5: Add SDD workflow decision entry
├── BUGS.md              # US5: Replace placeholder with "no entries yet"
└── WORKLOG.md           # US5: Replace placeholder with "no entries yet"

.github/agents/          # US4: Delete 3 alias agent files
.github/prompts/         # US4: Delete 3 alias prompt files

.github/speckit/repo_index/
└── speckit_profile.md   # US4+US5: Remove remaining concerns + recommendations
```

### Files Deleted

```text
.github/agents/speckit.repoindex-overview.agent.md
.github/agents/speckit.repoindex-architecture.agent.md
.github/agents/speckit.repoindex-module.agent.md
.github/prompts/speckit.repoindex-overview.prompt.md
.github/prompts/speckit.repoindex-architecture.prompt.md
.github/prompts/speckit.repoindex-module.prompt.md
```

**Structure Decision**: No new files or directories. 3 files modified, 6 files deleted.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Post-Design Constitution Re-Check

| Principle | Post-Design Status |
|-----------|-------------------|
| I. Cross-Platform Parity | PASS — no app code |
| II. Token-Based Theming | PASS — no UI |
| III. Platform File Splitting | PASS — no platform code |
| IV. StyleSheet Discipline | PASS — no styles |
| V. Test-First | PASS — docs/config only, manual verification |

**Re-check result**: PASS
