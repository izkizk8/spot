# Documentation System Rules

> Loaded automatically before every Spec Kit lifecycle command via `memory-loader`.
> Full reference: [docs/README.md](../../docs/README.md).

## The Three Doc Classes

| Class | Path | Source | Update mechanism |
|-------|------|--------|------------------|
| **Generated profiles** | `docs/*.md` (flat) | Code scan | `/speckit.repoindex.{overview,architecture,module}` — never hand-edit |
| **File indexes** | `docs/_index/*.json` | Code scan | Same as above (auto, side effect of `repoindex.module`) |
| **Decisions (ADRs)** | `docs/_decisions/NNNN-*.md` | Human judgement | Use `_template.md` |
| **How-tos** | `docs/_howto/*.md` | External tools / manual procedures | Use `_template.md` |

## Hooks: When to Update Docs During the Lifecycle

These reminders fire automatically because this file is loaded by every `before_*` and `after_*` hook.

### After `/speckit.plan`
- If the plan introduces a **new architectural decision** (tool / library / convention divergence) → add an ADR under `docs/_decisions/` before `/speckit.tasks`.

### After `/speckit.implement`
- If `src/` structure changed (new top-level module, refactor) → run `/speckit.repoindex.architecture`.
- If `package.json` runtime deps or SDK version changed → run `/speckit.repoindex.overview`.
- If a specific module's surface changed → run `/speckit.repoindex.module "<topic>"`.
- If an external tool / manual procedure was introduced → add a how-to under `docs/_howto/`.

### After `specify extension add` / `remove`
- Run `/speckit.repoindex.module "speckit"` to refresh `docs/speckit_profile.md` and `docs/sdd-extensions.md`.

### After `.specify/memory/constitution.md` changes
- Bump version reference in `docs/speckit_profile.md` (re-run the speckit module pass).

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

- ❌ Do not hand-edit `docs/*.md` (generated profiles) or `docs/_index/*.json`.
- ❌ Do not create generic "notes" files. Every doc has a class.
- ✅ The PR template (`.github/pull_request_template.md`) is the enforcement gate.
