# Feature Specification: Remove memory-md Extension

**Feature Branch**: `002-remove-memory-md`
**Created**: 2026-04-25
**Status**: Complete (Archived 2026-04-26 -> .specify/memory/)
**Input**: User decision: "memory-md adds process overhead with marginal value at solo-developer scale. Remove it entirely."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove memory-md Extension (Priority: P1)

The memory-md extension (v0.6.5) provides 6 commands for structured memory management (bootstrap, capture, capture-from-diff, audit, log-finding, plan-with-memory). At solo-developer scale, these add overhead without proportional value — the `docs/memory/` files are plain Markdown that agents can read/write directly. The `memory-loader` extension (which loads `.specify/memory/` before every command) is separate and stays. Remove all memory-md artifacts: 6 agent files, 6 prompt files, the extension directory (~62 files), and the registry entry.

**Independent Test**: Run `Get-ChildItem ".github/agents/speckit.memory-md.*"` — expect zero matches. Run `Test-Path ".specify/extensions/memory-md"` — expect `False`.

**Acceptance Scenarios**:

1. **Given** 6 memory-md agent files exist in `.github/agents/`, **When** the extension is removed, **Then** zero `speckit.memory-md.*` agent files remain.
2. **Given** 6 memory-md prompt files exist in `.github/prompts/`, **When** the extension is removed, **Then** zero `speckit.memory-md.*` prompt files remain.
3. **Given** `.specify/extensions/memory-md/` directory exists with ~62 files, **When** the extension is removed, **Then** the directory no longer exists.
4. **Given** `.specify/extensions/.registry` contains a `memory-md` entry, **When** the extension is removed, **Then** the registry no longer contains that entry.
5. **Given** `docs/memory/` files exist with real content, **When** the extension is removed, **Then** the memory files are preserved unchanged — only the extension tooling is removed.

### User Story 2 - Update Documentation (Priority: P2)

All repo index documents and the speckit_profile.md reference memory-md as an installed extension with 6 commands. After removal, documentation must reflect the current state: 6 extensions (not 7), 22 commands (not 28), 22 agent files (not 28), 22 prompt files (not 28).

**Independent Test**: Run `Select-String -Path ".github/speckit/repo_index/*.md" -Pattern "memory-md"` — expect zero matches.

**Acceptance Scenarios**:

1. **Given** speckit_profile.md lists memory-md as an extension with 6 commands, **When** updated, **Then** memory-md is removed from all tables and counts are updated (28→22 agents, 7→6 extensions).
2. **Given** overview.md references "28 Copilot agent commands" and "7 extensions", **When** updated, **Then** counts show 22 commands and 6 extensions.
3. **Given** the workflow diagram shows `/speckit.memory-md.capture` in Phase 8, **When** updated, **Then** the memory capture step references direct `docs/memory/` editing instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Delete all 6 agent files matching `speckit.memory-md.*.agent.md` from `.github/agents/`.
- **FR-002**: Delete all 6 prompt files matching `speckit.memory-md.*.prompt.md` from `.github/prompts/`.
- **FR-003**: Delete the entire `.specify/extensions/memory-md/` directory.
- **FR-004**: Remove the `memory-md` entry from `.specify/extensions/.registry` JSON.
- **FR-005**: ~~`docs/memory/` files MUST be preserved unchanged.~~ *(Superseded by SC-006 — docs/memory/ is now deleted as memory-md leftover.)*
- **FR-006**: Update `speckit_profile.md` — remove memory-md from all command tables, extension list, workflow diagrams, and update all counts.
- **FR-007**: Update `overview.md` — update command count (28→22), extension count (7→6), remove memory-md references.
- **FR-008**: Update `architecture.md` — update extension count if referenced.

## Success Criteria *(mandatory)*

- **SC-001**: Zero `speckit.memory-md.*` files exist in `.github/agents/` and `.github/prompts/`.
- **SC-002**: `.specify/extensions/memory-md/` directory does not exist.
- **SC-003**: `.specify/extensions/.registry` does not contain `memory-md`.
- **SC-004**: ~~All 5 `docs/memory/` files are preserved with unchanged content.~~ *(Superseded by SC-006 — docs/memory/ deleted.)*
- **SC-005**: All documentation counts are accurate (22 agents, 22 prompts, 6 extensions, 22 commands).
- **SC-006**: `docs/memory/` directory does not exist.
- **SC-007**: `copilot-instructions.md` contains no "Memory Layers" or "Required Workflow" sections.
- **SC-008**: Zero references to `docs/memory/` in any repo index document.

## Clarifications

### Session 2026-04-25

- Q: Should docs/memory/ be removed along with memory-md? → A: Yes. memory-loader only reads `.specify/memory/` (constitution). The `docs/memory/` layer was created by memory-md's bootstrap and nothing auto-loads it. Content overlaps with repo index documents.

## Assumptions

- The `memory-loader` extension is NOT removed — it loads `.specify/memory/constitution.md` before every command and is essential.
- The `docs/memory/` files are memory-md leftover — nothing reads them automatically. Content is duplicated in the repo index.
- The Memory Layers and Required Workflow sections in copilot-instructions.md describe a workflow that no longer has tooling support.

## Out of Scope

- Removing memory-loader (separate extension, stays)
- Removing `.specify/memory/constitution.md` (loaded by memory-loader, essential)
