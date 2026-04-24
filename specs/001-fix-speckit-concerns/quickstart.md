# Quickstart: Fix Spec Kit Concerns

**Feature**: 001-fix-speckit-concerns

## What This Feature Does

Resolves all 5 identified Spec Kit profile concerns:

1. ✅ Populating `docs/memory/PROJECT_CONTEXT.md` and `ARCHITECTURE.md` with real project content
2. ✅ Enabling auto-commit for all `after_*` Spec Kit lifecycle events
3. ✅ Updating stale documentation references to reflect the ratified constitution
4. Removing 6 duplicate alias agent/prompt files (repoindex hyphenated aliases)
5. Populating remaining template-only memory files (DECISIONS.md, BUGS.md, WORKLOG.md)
6. Removing "No extension tests" concern from profile (accepted as not a project concern)

## Verification

After implementation, run these checks:

```powershell
# 1. Verify memory files have real content (no placeholder text)
Select-String -Path "docs/memory/PROJECT_CONTEXT.md" -Pattern "Describe the product"
Select-String -Path "docs/memory/ARCHITECTURE.md" -Pattern "High-level shape"
Select-String -Path "docs/memory/DECISIONS.md" -Pattern "What cross-feature choice"
Select-String -Path "docs/memory/BUGS.md" -Pattern "What was observed"
Select-String -Path "docs/memory/WORKLOG.md" -Pattern "why this is durable"
# Expected: no matches for any of the above

# 2. Verify auto-commit is enabled for after_* events
Select-String -Path ".specify/extensions/git/git-config.yml" -Pattern "enabled: true"
# Expected: 8 matches

# 3. Verify no stale constitution references
Select-String -Path ".github/speckit/repo_index/*.md" -Pattern "Unfilled constitution"
# Expected: no matches

# 4. Verify alias agent files removed
(Get-ChildItem -Path ".github/agents" -File).Count
# Expected: 25 (was 31)

# 5. Verify zero concerns remain in profile
Select-String -Path ".github/speckit/repo_index/speckit_profile.md" -Pattern "^### Concerns"
# Then check: the Concerns section should be empty or removed
```

## Files Changed

| File | Change |
|------|--------|
| `docs/memory/PROJECT_CONTEXT.md` | ✅ Populated with spot product context |
| `docs/memory/ARCHITECTURE.md` | ✅ Populated with system architecture |
| `docs/memory/DECISIONS.md` | Add SDD workflow decision entry |
| `docs/memory/BUGS.md` | Replace placeholder with "no entries yet" note |
| `docs/memory/WORKLOG.md` | Replace placeholder with "no entries yet" note |
| `.specify/extensions/git/git-config.yml` | ✅ 8 `after_*` events enabled |
| `.github/speckit/repo_index/speckit_profile.md` | All concerns removed, recommendations cleared |
| `.github/speckit/repo_index/architecture.md` | ✅ Constitution debt removed, best practices updated |

## Files Deleted

| File | Reason |
|------|--------|
| `.github/agents/speckit.repoindex-overview.agent.md` | Duplicate alias |
| `.github/agents/speckit.repoindex-architecture.agent.md` | Duplicate alias |
| `.github/agents/speckit.repoindex-module.agent.md` | Duplicate alias |
| `.github/prompts/speckit.repoindex-overview.prompt.md` | Duplicate alias |
| `.github/prompts/speckit.repoindex-architecture.prompt.md` | Duplicate alias |
| `.github/prompts/speckit.repoindex-module.prompt.md` | Duplicate alias |
