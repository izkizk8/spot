# Data Model: Fix Spec Kit Concerns

**Feature**: 001-fix-speckit-concerns  
**Date**: 2026-04-25

## Entities

This feature has no application data entities. All changes are to configuration and documentation files.

### File Entities Modified

| Entity | File Path | Format | Sections Modified |
|--------|-----------|--------|-------------------|
| **Project Context** | `docs/memory/PROJECT_CONTEXT.md` | Markdown (memory-md template) | Product/Service, Key Constraints, Important Domains, Current Priorities |
| **Architecture Memory** | `docs/memory/ARCHITECTURE.md` | Markdown (memory-md template) | System Overview, Major Components, Boundaries, Integrations, Risks |
| **Git Config** | `.specify/extensions/git/git-config.yml` | YAML | `auto_commit.after_*` events (8 events toggled to `enabled: true`) |
| **Spec Kit Profile** | `.github/speckit/repo_index/speckit_profile.md` | Markdown | Concerns list, Recommendations list, Module Structure tree |
| **Architecture Doc** | `.github/speckit/repo_index/architecture.md` | Markdown | Technical Debt table, Best Practice Alignment table |

### Validation Rules

- `PROJECT_CONTEXT.md` must not contain placeholder text ("Describe the product", "constraint that affects", "domain", "priority")
- `ARCHITECTURE.md` must not contain placeholder text ("High-level shape", "component", "hotspot", "integration")
- `git-config.yml` must have exactly 8 `after_*` events with `enabled: true` and 1 (`after_taskstoissues`) with `enabled: false`
- `git-config.yml` must have all `before_*` events with `enabled: false`
- `speckit_profile.md` must not contain the string "Unfilled constitution"
- `architecture.md` must not contain the string "Unfilled constitution"

### State Transitions

N/A — no stateful entities.
