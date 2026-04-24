# Implementation Plan: Remove memory-md Extension (Expanded)

**Branch**: `002-remove-memory-md` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)

## Summary

Complete removal of all memory-md artifacts and its leftover `docs/memory/` layer. Pass 1 (T001–T011, complete) deleted the extension files, agents, prompts, and registry entry. Pass 2 removes the `docs/memory/` directory (5 files), cleans Memory Layers + Required Workflow sections from `copilot-instructions.md`, and cleans `specs/README.md`.

**Rationale**: `memory-loader` only reads `.specify/memory/` (constitution). It does NOT read `docs/memory/`. The `docs/memory/` layer was created by memory-md's bootstrap command and is orphaned now that memory-md is removed. The content overlaps with the repo index documents.

## Technical Context

**Language/Version**: N/A — file deletions and documentation edits only
**Primary Dependencies**: None
**Testing**: Manual verification — file existence checks, grep
**Project Type**: Configuration cleanup
**Scale/Scope**: Pass 1: ~74 files deleted, 4 files edited (✅ done). Pass 2: 5 files deleted, 3 files edited

## Constitution Check

| Principle | Applies? | Status |
|-----------|----------|--------|
| I–IV | No — no application code | PASS |
| V. Test-First | Exemption — docs/config only | PASS |

**Gate result**: PASS

## Pass 1 (✅ Complete)

Deleted: 6 agents, 6 prompts, ~62 extension files, registry entry.
Updated: speckit_profile.md, overview.md, architecture memory.

## Pass 2 — Files Deleted

```
docs/memory/PROJECT_CONTEXT.md
docs/memory/ARCHITECTURE.md
docs/memory/DECISIONS.md
docs/memory/BUGS.md
docs/memory/WORKLOG.md
docs/memory/                         (directory itself)
```

## Pass 2 — Files Edited

```
.github/copilot-instructions.md      # Remove Memory Layers + Required Workflow sections
specs/README.md                       # Remove memory-md workflow references
.github/speckit/repo_index/speckit_profile.md  # Remove Memory Layer Structure section, update file layout
```

## Files Preserved (NOT touched)

```
.specify/memory/constitution.md      # Loaded by memory-loader — essential
.specify/extensions/memory-loader/   # Separate extension, stays
```
