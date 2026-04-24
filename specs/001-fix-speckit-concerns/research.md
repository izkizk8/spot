# Research: Fix Spec Kit Concerns

**Feature**: 001-fix-speckit-concerns  
**Date**: 2026-04-25

## Research Tasks

### 1. Content source for PROJECT_CONTEXT.md

**Decision**: Derive content from existing repo index analysis (`overview.md`, `architecture.md`) and `copilot-instructions.md`.

**Rationale**: The repo index was generated this session with full codebase analysis. It contains verified technology stack, architecture, and conventions. No additional research is needed — the content should be distilled into the memory-md template format.

**Alternatives considered**:
- Run a fresh codebase scan → Rejected: the repo index already contains this information.
- Ask the user for product description → Rejected: the user hasn't defined a product purpose yet; we should fill what's objectively known and mark product purpose as TBD.

### 2. Content source for ARCHITECTURE.md

**Decision**: Derive from `.github/speckit/repo_index/architecture.md` sections 1-3 (Project Structure, Core Components, Architecture Overview).

**Rationale**: The architecture doc was generated and refreshed this session. It contains the exact information the memory file needs: system overview, major components, boundaries, integrations, and complexity hotspots.

**Alternatives considered**: None — the architecture doc is the single source of truth.

### 3. Auto-commit event selection

**Decision**: Enable all `after_*` events except `after_taskstoissues`. Keep all `before_*` events disabled.

**Rationale**: Per spec clarification, `after_*` events checkpoint completed work (specifications, plans, tasks, implementations). `before_*` events would commit unrelated work-in-progress. `after_taskstoissues` only creates external GitHub Issues with minimal local changes.

**Alternatives considered**:
- Enable `default: true` → Rejected: would also enable `before_*` events. Per-event control is safer.
- Enable only core lifecycle events → Rejected per clarification: `after_clarify` also deserves checkpointing.

### 4. Documentation update scope

**Decision**: Update `speckit_profile.md` and `architecture.md` only. `overview.md` has no constitution references.

**Rationale**: Verified via grep that only these two files reference "unfilled constitution". The update is surgical: remove the concern, update the module tree annotation, update the recommendation list, and update the Best Practice Alignment table.

**Alternatives considered**: None — scope confirmed by grep search during clarification.

## All Research Complete

No NEEDS CLARIFICATION items remain.
