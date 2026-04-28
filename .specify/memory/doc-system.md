# Documentation System Rules

> Loaded automatically before every Spec Kit lifecycle command via `memory-loader`.
> Full reference: [docs/README.md](../../docs/README.md).

## Doc Classes

| Class | Path | Source | Update mechanism |
|-------|------|--------|------------------|
| **Generated profiles** | Explicit profile files listed in `docs/README.md` | Code scan | `/speckit.repoindex.{overview,architecture,module}` — never hand-edit |
| **Registry-derived references** | Explicit reference files listed in `docs/README.md` | Local registry/manifests | Derive from source data; verify with `pnpm docs:check` |
| **File indexes** | `docs/_index/*.json` | Code scan | Same as above (auto, side effect of `repoindex.module`) |
| **Decisions (ADRs)** | `docs/_decisions/NNNN-*.md` | Human judgement | Use `_template.md` |
| **How-tos** | `docs/_howto/*.md` | External tools / manual procedures | Use `_template.md` |

## Hooks: When to Update Docs During the Lifecycle

These reminders fire automatically because this file is loaded by every `before_*` and `after_*` hook.

## AI-First Workflow Canon

- **Spec Kit is the core lifecycle**: `specify -> clarify -> plan -> tasks -> analyze -> implement -> verify/archive`.
- **Spec Kit extensions are the capability layer**: validation, review, cleanup, repo indexing, orchestration, bugfix, checkpointing, and status commands extend the lifecycle but do not replace its artifacts.
- **Superpowers, Context Engineering, and RUG are plugin accelerators**: use them for engineering discipline, multi-file planning, and large-task delegation while keeping Spec Kit as the traceability spine.
- If a plugin changes the durable workflow, record the decision in `docs/_decisions/` and refresh the Speckit generated profiles.

### After `/speckit.plan`
- If the plan introduces a **new architectural decision** (tool / library / convention divergence) → add an ADR under `docs/_decisions/` before `/speckit.tasks`.

### After `/speckit.implement`
- If `src/` structure changed (new top-level module, refactor) → run `/speckit.repoindex.architecture`.
- If `package.json` runtime deps or SDK version changed → run `/speckit.repoindex.overview`.
- If a specific module's surface changed → run `/speckit.repoindex.module "<topic>"`.
- If an external tool / manual procedure was introduced → add a how-to under `docs/_howto/`.
- Before handoff → run `pnpm docs:check` or `pnpm check` so doc links, generated-profile boundaries, stale references, JSON indexes, and CRLF line endings are verified.

### After tooling / quality-gate changes
- Update `package.json` scripts and `scripts/check-docs.ps1` together when doc automation changes.
- Re-run `/speckit.repoindex.module "tooling"` so `docs/tooling_profile.md` and `docs/_index/tooling_fileindex.json` match the command surface.
- If the change accepts a workflow tradeoff (for example CRLF as repository policy), add or update an ADR.

### After `specify extension add` / `remove`
- Run `/speckit.repoindex.module "speckit"` to refresh `docs/speckit_profile.md` and `docs/_index/speckit_fileindex.json`.
- Refresh registry-derived `docs/sdd-extensions.md` from `.specify/extensions/.registry`, `.specify/extensions.yml`, and extension manifests; `pnpm docs:check` verifies the counts and extension rows.

### After `.specify/memory/constitution.md` changes
- Bump version reference in `docs/speckit_profile.md` (re-run the speckit module pass).

### After agent stack changes
- If Spec Kit extensions, Superpowers skills, Context Engineering agents, RUG/SWE/QA orchestration, or related command policy changes → update ADR `0001` if the decision changed, then re-run `/speckit.repoindex.module "speckit"`.

### After `/speckit.archive.run`
- Verify the just-archived feature's facts are reflected in the relevant generated profile; if not, re-run that profile's repoindex command.

## Decision Tree (when in doubt)

```
Is the info derivable from code?
├── YES → re-run the matching /speckit.repoindex.* command
└── NO →
    Is it a judgement / tradeoff?
    ├── YES → new ADR in docs/_decisions/
    └── NO →
        Is it an external-tool walkthrough?
        ├── YES → new file in docs/_howto/
        └── NO → it doesn't belong in docs/. Reconsider.
```

## Hard Rules

- ❌ Do not hand-edit generated profile files listed in `docs/README.md` or any `docs/_index/*.json`.
- ⚠️ Registry-derived references may be edited only to mirror their machine-readable sources, then verified with `pnpm docs:check`.
- ✅ `docs/README.md` is a curated index and may be hand-edited when the doc system changes.
- ❌ Do not create generic "notes" files. Every doc has a class.
- ✅ `pnpm docs:check` is the automated local doc gate; `pnpm check` includes it.
- ✅ The PR template (`.github/pull_request_template.md`) is the enforcement gate.
