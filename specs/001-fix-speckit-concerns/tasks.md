# Tasks: Fix Spec Kit Concerns (Expanded)

**Input**: Design documents from `/specs/001-fix-speckit-concerns/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not applicable — this is a documentation/configuration-only feature. Manual verification per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Note**: First pass (T001–T012, FR-001–FR-007) is complete. Task IDs continue sequentially from T013.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — all target files already exist.

_(No tasks in this phase)_

---

## Phase 2: Foundational

**Purpose**: No blocking prerequisites — each user story operates on independent files.

_(No tasks in this phase)_

---

## Phase 3: Previously Completed (T001–T012)

User Stories 1–3 (FR-001 through FR-007) were fully implemented in the first pass.

- [x] T001 [P] [US1] Populate Product/Service, Key Constraints, Important Domains, and Current Priorities sections in docs/memory/PROJECT_CONTEXT.md
- [x] T002 [P] [US1] Populate System Overview, Major Components, Boundaries, Integrations, and Risks sections in docs/memory/ARCHITECTURE.md
- [x] T003 [US1] Verify both files contain zero placeholder text by searching for template markers ("Describe the product", "constraint that affects", "High-level shape", "component", "hotspot", "integration") in docs/memory/PROJECT_CONTEXT.md and docs/memory/ARCHITECTURE.md
- [x] T004 [US2] Set `enabled: true` for `after_specify`, `after_clarify`, `after_plan`, `after_tasks`, `after_implement`, `after_constitution`, `after_checklist`, and `after_analyze` in .specify/extensions/git/git-config.yml
- [x] T005 [US2] Verify all `before_*` events remain `enabled: false` and `after_taskstoissues` remains `enabled: false` in .specify/extensions/git/git-config.yml
- [x] T006 [P] [US3] Remove "Unfilled constitution" concern from the Concerns list in .github/speckit/repo_index/speckit_profile.md
- [x] T007 [P] [US3] Remove "Fill the constitution" from the Recommendations list in .github/speckit/repo_index/speckit_profile.md
- [x] T008 [P] [US3] Update the module structure tree to show `constitution.md (v1.0.0 — ratified)` instead of `(template — unfilled)` in .github/speckit/repo_index/speckit_profile.md
- [x] T009 [P] [US3] Remove "Unfilled constitution" row from the Technical Debt table in .github/speckit/repo_index/architecture.md
- [x] T010 [P] [US3] Add "Constitution" as ✅ in the Best Practice Alignment table in .github/speckit/repo_index/architecture.md
- [x] T011 [US3] Update the "Durable memory is template-only" concern text to note that PROJECT_CONTEXT.md and ARCHITECTURE.md are now populated in .github/speckit/repo_index/speckit_profile.md
- [x] T012 Final verification: run all three independent tests from quickstart.md to confirm SC-001, SC-002, SC-003, SC-004 pass

---

## Phase 4: User Story 4 - Remove Duplicate Alias Agents (Priority: P4)

**Goal**: Delete 6 duplicate alias agent/prompt files and remove the "Duplicated agents" concern from the profile.

**Independent Test**: Run `(Get-ChildItem -Path ".github/agents" -File).Count` — expect 25 (was 31).

### Implementation for User Story 4

- [x] T013 [P] [US4] Delete alias agent file .github/agents/speckit.repoindex-overview.agent.md
- [x] T014 [P] [US4] Delete alias agent file .github/agents/speckit.repoindex-architecture.agent.md
- [x] T015 [P] [US4] Delete alias agent file .github/agents/speckit.repoindex-module.agent.md
- [x] T016 [P] [US4] Delete alias prompt file .github/prompts/speckit.repoindex-overview.prompt.md
- [x] T017 [P] [US4] Delete alias prompt file .github/prompts/speckit.repoindex-architecture.prompt.md
- [x] T018 [P] [US4] Delete alias prompt file .github/prompts/speckit.repoindex-module.prompt.md
- [x] T019 [US4] Remove "Duplicated agents" concern and "Deduplicate alias agents" recommendation from .github/speckit/repo_index/speckit_profile.md
- [x] T020 [US4] Verify agent file count is 28 in .github/agents/ and prompt file count is 28 in .github/prompts/ (was 31 each, deleted 3 from each)

**Checkpoint**: Alias files removed. Agent count reduced from 31 to 25.

---

## Phase 5: User Story 5 - Populate Remaining Memory Files (Priority: P5)

**Goal**: Populate DECISIONS.md, BUGS.md, and WORKLOG.md so all 5 durable memory files contain real content instead of template placeholders.

**Independent Test**: Run `Select-String -Path "docs/memory/DECISIONS.md" -Pattern "What cross-feature choice"` — expect zero matches.

### Implementation for User Story 5

- [x] T021 [P] [US5] Add SDD workflow decision entry to docs/memory/DECISIONS.md following the template format
- [x] T022 [P] [US5] Replace placeholder template text with "no entries yet" note in docs/memory/BUGS.md
- [x] T023 [P] [US5] Replace placeholder template text with "no entries yet" note in docs/memory/WORKLOG.md
- [x] T024 [US5] Remove "No extension tests" concern from .github/speckit/repo_index/speckit_profile.md
- [x] T025 [US5] Remove "Remaining template-only memory" concern from .github/speckit/repo_index/speckit_profile.md
- [x] T026 [US5] Verify all 5 docs/memory/ files contain zero placeholder template text

**Checkpoint**: All 5 memory files populated. All concerns removed from profile.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T027 Update speckit_profile.md agent count from 31 to 28 and prompt count from 31 to 28 in the File Organization section in .github/speckit/repo_index/speckit_profile.md
- [x] T028 Final verification: run all quickstart.md checks to confirm SC-001 through SC-006 pass

---

## Dependencies

```text
T013 ──┐
T014   │
T015   ├── T019 (remove concern) ── T020 (verify count)
T016   │
T017   │
T018 ──┘

T021 ──┐
T022   ├── T026 (verify memory files)
T023 ──┘

T024 ──┐
T025   ├── (depend on T019 completing first — same file)
       │
T020 ──┐
T026   ├── T027 (update file counts) ── T028 (final verification)
T025 ──┘
```

## Parallel Execution Opportunities

- **US4**: T013–T018 can all run in parallel (6 independent file deletions)
- **US5**: T021, T022, T023 can run in parallel (3 independent memory files)
- **Cross-story**: US4 and US5 can run in parallel since they modify different files (except both touch speckit_profile.md in T019/T024/T025)

## Implementation Strategy

- **Incremental**: US4 (T013–T020) — file deletions + profile cleanup
- **Incremental**: US5 (T021–T026) — memory file population + profile cleanup
- **Polish**: T027–T028 — file count update + final verification

**Total new tasks**: 16 (T013–T028)
**Previously completed**: 12 (T001–T012)
**Grand total**: 28 tasks
**Per-story**: US4: 8, US5: 6, Polish: 2
**Parallel opportunities**: T013∥T014∥T015∥T016∥T017∥T018, T021∥T022∥T023, US4∥US5 (partial)
