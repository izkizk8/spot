# Documentation

A **structured** doc system: every file has one home, decided by where its information comes from. No "general notes" bucket.

## Doc Classes

| Class | Path | Source of truth | Who writes | Update trigger |
|-------|------|----------------|------------|----------------|
| **Generated profiles** | Explicit files listed below at `docs/` root | Code scan | `/speckit.repoindex.*` | Code structure / deps change |
| **Registry-derived references** | Explicit files listed below at `docs/` root | Local registry/manifests | Regenerate or update from registry data, then run `pnpm docs:check` | Extension registry / hook change |
| **File index** (machine-readable) | `docs/_index/*.json` | Code scan | `/speckit.repoindex.module` | Same as above (auto) |
| **Decisions** (ADRs) | `docs/_decisions/NNNN-*.md` | Human judgement | Author of the decision | Picking X over Y; reversing a decision |
| **How-tos** | `docs/_howto/*.md` | External tools / manual procedures | Whoever first does it | New external workflow |

The PR template enforces this — see [`.github/pull_request_template.md`](../.github/pull_request_template.md).

These same rules are mirrored into [`.specify/memory/doc-system.md`](../.specify/memory/doc-system.md), which `memory-loader` auto-loads before every Spec Kit command. So agents are reminded of the doc rules at every lifecycle phase without anyone needing to ask.

## AI-First Workflow Model

Spec Kit is the core lifecycle. Spec Kit extensions add command capabilities around that lifecycle. Superpowers, Context Engineering, and RUG are plugin layers that make the lifecycle safer, wider, and easier to verify.

| Layer | Role | Source of truth | Typical use |
|-------|------|-----------------|-------------|
| **Core lifecycle** | Spec Kit (`/speckit.specify -> plan -> tasks -> implement`) | [speckit_profile.md](speckit_profile.md) | Every non-trivial feature/change |
| **Capability layer** | Spec Kit extensions (`review`, `superb`, `orchestrator`, `repoindex`, etc.) | [sdd-extensions.md](sdd-extensions.md) | Validation, indexing, review, cleanup, orchestration |
| **Engineering discipline** | Superpowers skills | ADR [0001](_decisions/0001-agent-first-stack.md) | TDD, debugging, review response, verification |
| **Change planning** | `@context-architect` | ADR [0001](_decisions/0001-agent-first-stack.md) | Multi-file impact mapping before edits |
| **Large-work orchestration** | `@rug -> @SWE + @QA` | ADR [0001](_decisions/0001-agent-first-stack.md) | Decompose, delegate, independently validate |

The operating rule is: **Spec Kit owns the artifacts and phase order; extensions and plugins strengthen a phase, but do not replace the lifecycle record.**

## Generated Profiles

Re-run the generator; **never hand-edit** these files. They have a `**Generated**: <date>` footer. [README.md](README.md) is the curated docs index, not a generated profile.

| File | Re-run command | Trigger |
|------|----------------|---------|
| [overview.md](overview.md) | `/speckit.repoindex.overview` | New SDK / major dep / quarterly refresh |
| [architecture.md](architecture.md) | `/speckit.repoindex.architecture` | Architecture / module / dep-graph change |
| [`<module>_profile.md`](.) | `/speckit.repoindex.module "<topic>"` | That module's surface changes |
| [speckit_profile.md](speckit_profile.md) | `/speckit.repoindex.module "speckit"` | Extension install/remove, hook change, constitution bump |
| [eas-sideload_profile.md](eas-sideload_profile.md) | `/speckit.repoindex.module "eas-sideload"` | EAS profile / build config change |
| [tooling_profile.md](tooling_profile.md) | `/speckit.repoindex.module "tooling"` | Package scripts, lint/format/test config, or quality gate change |

Companion JSON file indexes live in [`_index/`](_index/) (e.g. `speckit_fileindex.json`).

## Registry-Derived References

These files are not generic repoindex module profiles. They are derived from local machine-readable project metadata and checked by `pnpm docs:check`.

| File | Source | Trigger |
|------|--------|---------|
| [sdd-extensions.md](sdd-extensions.md) | `.specify/extensions/.registry`, `.specify/extensions.yml`, `.specify/extensions/*/extension.yml` | Extension install/remove, hook change, command alias change |

## Decisions ([`_decisions/`](_decisions/))

ADR-style records of judgement calls. Use `_decisions/_template.md`. See [`_decisions/README.md`](_decisions/README.md) for rules.

## How-Tos ([`_howto/`](_howto/))

Step-by-step procedures involving external tools. Use `_howto/_template.md`. See [`_howto/README.md`](_howto/README.md) for rules.

## Coverage Notes

All current generated-profile topics have been materialized.

Agent workflow is covered by [speckit_profile.md](speckit_profile.md), registry-derived [sdd-extensions.md](sdd-extensions.md), and ADR [0001](_decisions/0001-agent-first-stack.md); a separate `agent-workflow_profile.md` is unnecessary unless the agent layer grows beyond Spec Kit.

## Automation Gate

Run this before handoff, and it is included in `pnpm check`:

```bash
pnpm docs:check
```

The docs gate verifies:

- tracked text files use CRLF line endings
- generated profile files listed above exist and carry a generated footer
- registry-derived references match their local source data
- `docs/` root contains only the curated index, explicit generated profiles, and explicit registry-derived references
- `docs/_index/*.json` parses successfully
- local Markdown links resolve
- common stale paths and stale facts are absent

## Decision Tree (when adding/changing docs)

```
Is the info derivable from code?
├── YES → re-run the matching repoindex command. Done.
└── NO →
    Is it a judgement / tradeoff / "why X over Y"?
    ├── YES → new ADR in _decisions/
    └── NO →
        Is it a step-by-step using an external tool?
        ├── YES → new file in _howto/
        └── NO → it doesn't belong in docs/. Reconsider.
```
