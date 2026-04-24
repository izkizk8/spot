# Feature Specification: Fix Spec Kit Concerns

**Feature Branch**: `001-fix-speckit-concerns`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "Fix Spec Kit profile concerns: fill durable memory, enable auto-commit, deduplicate agents, update stale documentation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill Durable Project Memory (Priority: P1)

A developer opens the project for the first time and runs a Spec Kit lifecycle command (e.g., `/speckit.plan`). The memory-loader hook fires and loads `docs/memory/` files. Currently these files contain only template placeholders, providing no useful context. After this story is complete, the loaded memory provides real project context, architecture boundaries, and technology constraints that inform planning and implementation decisions.

**Why this priority**: Without populated durable memory, every Spec Kit command operates without project context. This is the highest-value fix because it directly impacts the quality of every downstream specification, plan, and task list.

**Independent Test**: After implementation, run `/speckit.memory-loader.load` and verify the output contains concrete project-specific information (not placeholder text like "Describe the product" or "component").

**Acceptance Scenarios**:

1. **Given** `docs/memory/PROJECT_CONTEXT.md` exists, **When** a developer reads the file, **Then** it contains the product description, key constraints (Expo SDK 55, three-platform target, pnpm), important domains, and current priorities specific to spot.
2. **Given** `docs/memory/ARCHITECTURE.md` exists, **When** a developer reads the file, **Then** it contains the system overview (Expo Router app with token-based theming), major components (route screens, themed components, hooks, design tokens), boundaries (src/app vs src/components vs src/constants), and integration points (Expo SDK services).
3. **Given** both files are populated, **When** `/speckit.memory-loader.load` runs as a before_* hook, **Then** the output provides actionable context — no section contains only placeholder text.

---

### User Story 2 - Enable Auto-Commit for Spec Kit Commands (Priority: P2)

A developer runs Spec Kit lifecycle commands (specify, plan, tasks, implement). After each command completes, generated artifacts are automatically committed with descriptive messages. Currently, auto-commit is disabled for all events, so artifacts accumulate as uncommitted changes. After this story, the developer gets automatic checkpoints without manual git operations.

**Why this priority**: Auto-commit prevents accidental loss of generated artifacts and creates a clear git history of the SDD workflow. It's the second priority because it's a configuration change with immediate workflow benefit, but does not affect the quality of generated content (unlike durable memory).

**Independent Test**: After implementation, verify `git-config.yml` has `after_specify`, `after_plan`, `after_tasks`, and `after_implement` enabled, and that the commit messages are descriptive.

**Acceptance Scenarios**:

1. **Given** `.specify/extensions/git/git-config.yml` is updated, **When** a Spec Kit `after_*` command hook fires, **Then** changes are auto-committed with the configured message (e.g., "[Spec Kit] Add specification").
2. **Given** auto-commit is enabled for after events, **When** a `before_*` hook fires, **Then** outstanding changes are NOT auto-committed (before hooks remain disabled to avoid committing work-in-progress from unrelated work).
3. **Given** auto-commit is enabled, **When** no changes exist after a command, **Then** the commit is skipped gracefully without error.

---

### User Story 3 - Update Stale Documentation References (Priority: P3)

Project documentation (speckit_profile.md, architecture.md) still references the "unfilled constitution" concern even though the constitution was ratified this session. After this story, all generated documentation accurately reflects the current state of the project.

**Why this priority**: Stale documentation causes confusion but does not block workflow functionality. It is lower priority than functional improvements (memory, auto-commit).

**Independent Test**: After implementation, search all files in `.github/speckit/repo_index/` for "unfilled constitution" — there should be zero matches. The constitution should be described as "ratified v1.0.0" with its 5 principles listed.

**Acceptance Scenarios**:

1. **Given** `speckit_profile.md` mentions "Unfilled constitution", **When** the file is updated, **Then** the concern is removed and the constitution is described as ratified with 5 principles.
2. **Given** `speckit_profile.md` has a module structure tree showing `constitution.md` as "template — unfilled", **When** the file is updated, **Then** it shows "constitution.md (v1.0.0 — ratified)".
3. **Given** `architecture.md` lists "Unfilled constitution" in Technical Debt, **When** the file is updated, **Then** that entry is removed and the constitution is listed as ratified in the Best Practice Alignment table.

---

### Edge Cases

- What happens if `docs/memory/PROJECT_CONTEXT.md` is filled but `ARCHITECTURE.md` is not? Each file should be independently useful — partial population is acceptable.
- What happens if auto-commit is enabled but git has merge conflicts? The git extension's `auto-commit` script handles this gracefully — it skips with a warning.
- What happens if future features modify the constitution? The `speckit_profile.md` should reference the constitution version, not repeat its content — so future amendments only require updating the version reference.

## Clarifications

### Session 2026-04-25

- Q: Should `after_clarify` and `after_taskstoissues` also be enabled for auto-commit? → A: Enable `after_clarify` (spec changes should be checkpointed); keep `after_taskstoissues` disabled (only creates external issues, no significant local file changes).
- Q: Should all repo index documents referencing "unfilled constitution" be updated, or only speckit_profile.md and architecture.md? → A: Update all repo index documents. Verified only `speckit_profile.md` and `architecture.md` contain references — `overview.md` has none. FR-005 and FR-006 already cover the full scope.
- Q: How to resolve duplicated agents? Remove alias files (hyphens) or canonical files (dots)? → A: Remove the 6 alias files (3 agents + 3 prompts with hyphens: `speckit.repoindex-overview`, `speckit.repoindex-architecture`, `speckit.repoindex-module`), keep the 6 canonical files (dots). The extension manifest's alias routing still maps the alias command name to the canonical command file.
- Q: How to resolve remaining template-only memory (DECISIONS.md, BUGS.md, WORKLOG.md)? → A: Record the SDD workflow decision in DECISIONS.md as a durable cross-feature decision. Replace placeholder text in BUGS.md and WORKLOG.md with "no entries yet" notes explaining the threshold for adding entries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `docs/memory/PROJECT_CONTEXT.md` MUST contain spot's product description, key constraints, important domains, and current priorities — all derived from existing repo index analysis.
- **FR-002**: `docs/memory/ARCHITECTURE.md` MUST contain the system overview, major components, module boundaries, Expo SDK integrations, and known complexity hotspots — all derived from existing repo index analysis.
- **FR-003**: `.specify/extensions/git/git-config.yml` MUST have `after_specify`, `after_clarify`, `after_plan`, `after_tasks`, `after_implement`, `after_constitution`, `after_checklist`, and `after_analyze` events set to `enabled: true`. `after_taskstoissues` MUST remain `enabled: false`.
- **FR-004**: `.specify/extensions/git/git-config.yml` MUST keep all `before_*` events set to `enabled: false` (to avoid committing unrelated work-in-progress).
- **FR-005**: `speckit_profile.md` MUST be updated to remove the "Unfilled constitution" concern and update the module structure description to show the constitution as ratified.
- **FR-006**: `architecture.md` MUST be updated to remove "Unfilled constitution" from Technical Debt and mark "Constitution" as ✅ in Best Practice Alignment.
- **FR-007**: The "Fill the constitution" recommendation MUST be removed from `speckit_profile.md` since it is now complete.
- **FR-008**: The 6 alias agent files (`speckit.repoindex-overview.agent.md`, `speckit.repoindex-architecture.agent.md`, `speckit.repoindex-module.agent.md`) and their matching prompt files MUST be deleted from `.github/agents/` and `.github/prompts/`.
- **FR-009**: The "Duplicated agents" concern and "Deduplicate alias agents" recommendation MUST be removed from `speckit_profile.md`.
- **FR-010**: The "No extension tests" concern MUST be removed from `speckit_profile.md` (accepted as out of scope, not a project concern).
- **FR-011**: `docs/memory/DECISIONS.md` MUST contain at least one real decision entry (the SDD workflow choice) following the template format.
- **FR-012**: `docs/memory/BUGS.md` MUST have placeholder text replaced with a "no entries yet" note explaining the threshold for adding bug pattern entries.
- **FR-013**: `docs/memory/WORKLOG.md` MUST have placeholder text replaced with a "no entries yet" note explaining the threshold for adding worklog entries.
- **FR-014**: The "Remaining template-only memory" concern MUST be removed or updated in `speckit_profile.md` to reflect that all 5 memory files are now populated.

### Key Entities

- **Durable Memory Files**: `docs/memory/PROJECT_CONTEXT.md`, `docs/memory/ARCHITECTURE.md` — persistent project knowledge files read by the memory-loader extension before every Spec Kit command.
- **Git Config**: `.specify/extensions/git/git-config.yml` — YAML configuration controlling auto-commit behavior per lifecycle event.
- **Repo Index Documents**: `.github/speckit/repo_index/speckit_profile.md`, `.github/speckit/repo_index/architecture.md` — generated documentation reflecting project state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `/speckit.memory-loader.load` outputs concrete, project-specific content from both `PROJECT_CONTEXT.md` and `ARCHITECTURE.md` — zero placeholder sections remain.
- **SC-002**: After any `after_*` Spec Kit lifecycle event, generated artifacts are auto-committed without manual intervention.
- **SC-003**: All documentation in `.github/speckit/repo_index/` accurately reflects the current project state — zero references to "unfilled constitution" or stale concerns.
- **SC-004**: The number of open concerns in `speckit_profile.md` is reduced from 5 to 0 (all concerns resolved or removed).
- **SC-005**: Agent file count in `.github/agents/` is reduced from 31 to 25 (6 alias files removed).
- **SC-006**: All 5 `docs/memory/` files contain project-specific content — zero placeholder template text remains.

## Assumptions

- The content for durable memory files is derived from the repo index analysis already performed this session (overview.md, architecture.md) — no new research is needed.
- The "No extension tests" concern is removed from the profile (not fixed) because extensions are third-party and testing them is outside the project's current scope.
- The 6 alias agent/prompt files can be safely deleted because the extension manifest's alias routing maps alias command names to canonical command files.

## Out of Scope

- Adding extension tests (third-party extension concern — concern removed from profile, not fixed)
- Modifying the constitution itself (already ratified v1.0.0)
