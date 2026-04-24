# Tasks: Remove memory-md Extension

**Input**: Design documents from `/specs/002-remove-memory-md/`
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: Not applicable — docs/config-only feature. Manual verification per spec success criteria.

**Organization**: Tasks grouped by user story. US1 = delete files, US2 = update docs.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

_(No setup needed)_

---

## Phase 2: Foundational

_(No blocking prerequisites)_

---

## Phase 3: User Story 1 - Delete memory-md Extension (Priority: P1) 🎯 MVP

**Goal**: Remove all memory-md artifacts while preserving docs/memory/ files and memory-loader.

**Independent Test**: `(Get-ChildItem ".github/agents/speckit.memory-md.*").Count` — expect 0.

### Implementation for User Story 1

- [x] T001 [P] [US1] Delete 6 agent files matching speckit.memory-md.*.agent.md from .github/agents/
- [x] T002 [P] [US1] Delete 6 prompt files matching speckit.memory-md.*.prompt.md from .github/prompts/
- [x] T003 [P] [US1] Delete entire directory .specify/extensions/memory-md/
- [x] T004 [US1] Remove the memory-md JSON block from .specify/extensions/.registry
- [x] T005 [US1] Verify docs/memory/ files are preserved unchanged (5 files still exist with same content)
- [x] T006 [US1] Verify zero speckit.memory-md.* files remain in .github/agents/ and .github/prompts/

**Checkpoint**: Extension fully removed. docs/memory/ intact. memory-loader untouched.

---

## Phase 4: User Story 2 - Update Documentation (Priority: P2)

**Goal**: Update all repo index docs to reflect 22 commands, 6 extensions, 22 agents, 22 prompts.

**Independent Test**: `Select-String -Path ".github/speckit/repo_index/*.md" -Pattern "memory-md"` — expect 0.

### Implementation for User Story 2

- [x] T007 [US2] Remove memory-md from Memory Management table, extension table, workflow diagram, file counts, and infrastructure tree in .github/speckit/repo_index/speckit_profile.md
- [x] T008 [US2] Update command/agent/extension counts (28→22 commands, 28→22 agents, 7→6 extensions) in .github/speckit/repo_index/overview.md
- [x] T009 [US2] Update extension count in .github/speckit/repo_index/architecture.md if referenced
- [x] T010 [US2] Verify zero "memory-md" references remain in .github/speckit/repo_index/*.md

**Checkpoint**: All documentation accurate. Zero stale references.

---

## Phase 5: Polish & Verification

- [x] T011 Final verification: confirm SC-001 through SC-005 all pass

---

## Dependencies

```text
T001 ──┐
T002   ├── T006 (verify deletion)
T003 ──┘
T004 ──── (independent)

T005 ──── (independent, run anytime)

T006 ──┐
       ├── T007, T008, T009 (docs update after deletion confirmed)
       │
T007 ──┐
T008   ├── T010 (verify docs) ── T011 (final)
T009 ──┘
```

## Parallel Execution

- T001, T002, T003 can run in parallel (independent deletions)
- T007, T008, T009 can run in parallel (independent doc files)
- T012, T013 can run in parallel (independent deletions)
- T014, T015 can run in parallel (independent doc edits)

## Implementation Strategy

- **Pass 1** (✅ done): US1 (T001–T006) + US2 (T007–T011) — extension removal + doc updates
- **Pass 2**: US3 (T012–T018) — docs/memory/ cleanup + copilot-instructions.md cleanup

---

## Phase 6: User Story 3 - Remove docs/memory/ Layer (Priority: P3)

**Goal**: Delete the orphaned `docs/memory/` directory and clean memory-md workflow references from `copilot-instructions.md`, `specs/README.md`, and `speckit_profile.md`.

**Independent Test**: `Test-Path "docs/memory"` — expect `False`. `Select-String -Path ".github/copilot-instructions.md" -Pattern "Memory Layers"` — expect 0.

### Implementation for User Story 3

- [x] T012 [P] [US3] Delete entire docs/memory/ directory (5 files: PROJECT_CONTEXT.md, ARCHITECTURE.md, DECISIONS.md, BUGS.md, WORKLOG.md)
- [x] T013 [P] [US3] Remove memory-md workflow references from specs/README.md (memory.md, memory-synthesis.md mentions)
- [x] T014 [US3] Remove "Memory Layers" and "Required Workflow" sections from .github/copilot-instructions.md
- [x] T015 [US3] Remove "Memory Layer Structure" diagram and docs/memory/ references from .github/speckit/repo_index/speckit_profile.md
- [x] T016 [US3] Verify docs/memory/ directory does not exist
- [x] T017 [US3] Verify zero "docs/memory" references in .github/copilot-instructions.md and .github/speckit/repo_index/*.md
- [x] T018 Final verification: confirm SC-001 through SC-008 all pass

---

## Pass 2 Dependencies

```text
T012 ── T016 (verify deletion)
T013 ──┐
T014   ├── T017 (verify references) ── T018 (final)
T015 ──┘
```

**Total tasks**: 18 (Pass 1: 11 ✅, Pass 2: 7 new)
**Per-story**: US1: 6 ✅, US2: 5 ✅, US3: 7
**Per-story**: US1: 6, US2: 4, Polish: 1
