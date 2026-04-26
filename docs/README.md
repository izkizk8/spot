# Documentation

A **structured** doc system: every file has one home, decided by where its information comes from. No "general notes" bucket.

## Three Classes

| Class | Path | Source of truth | Who writes | Update trigger |
|-------|------|----------------|------------|----------------|
| **Generated profiles** | `docs/*.md` (flat) | Code scan | `/speckit.repoindex.*` | Code structure / deps change |
| **File index** (machine-readable) | `docs/_index/*.json` | Code scan | `/speckit.repoindex.module` | Same as above (auto) |
| **Decisions** (ADRs) | `docs/_decisions/NNNN-*.md` | Human judgement | Author of the decision | Picking X over Y; reversing a decision |
| **How-tos** | `docs/_howto/*.md` | External tools / manual procedures | Whoever first does it | New external workflow |

The PR template enforces this — see [`.github/pull_request_template.md`](../.github/pull_request_template.md).

These same rules are mirrored into [`.specify/memory/doc-system.md`](../.specify/memory/doc-system.md), which `memory-loader` auto-loads before every Spec Kit command. So agents are reminded of the doc rules at every lifecycle phase without anyone needing to ask.

## Generated Profiles

Re-run the generator; **never hand-edit** these files. They have a `**Generated**: <date>` footer.

| File | Re-run command | Trigger |
|------|----------------|---------|
| [overview.md](overview.md) | `/speckit.repoindex.overview` | New SDK / major dep / quarterly refresh |
| [architecture.md](architecture.md) | `/speckit.repoindex.architecture` | Architecture / module / dep-graph change |
| [`<module>_profile.md`](.) | `/speckit.repoindex.module "<topic>"` | That module's surface changes |
| [speckit_profile.md](speckit_profile.md) | `/speckit.repoindex.module "speckit"` | Extension install/remove, hook change, constitution bump |
| [sdd-extensions.md](sdd-extensions.md) | `/speckit.repoindex.module "speckit"` (same pass) | Same as above |
| [eas-sideload_profile.md](eas-sideload_profile.md) | `/speckit.repoindex.module "eas-sideload"` | EAS profile / build config change |

Companion JSON file indexes live in [`_index/`](_index/) (e.g. `speckit_fileindex.json`).

## Decisions ([`_decisions/`](_decisions/))

ADR-style records of judgement calls. Use `_decisions/_template.md`. See [`_decisions/README.md`](_decisions/README.md) for rules.

## How-Tos ([`_howto/`](_howto/))

Step-by-step procedures involving external tools. Use `_howto/_template.md`. See [`_howto/README.md`](_howto/README.md) for rules.

## Pending Generation

No generated profile exists yet for these topics. Until someone runs the matching `/speckit.repoindex.module` command, the source of truth is the listed files + ADRs.

| Topic | Source of truth (today) | Generate with |
|-------|-------------------------|---------------|
| Toolchain (scripts, OXC, ESLint Hooks, Jest) | `package.json`, `.oxfmtrc.json`, `oxlint.json`, `eslint.config.js`, `jest.config.js`, ADR [0002](_decisions/0002-toolchain.md) | `/speckit.repoindex.module "tooling"` |
| Agent workflow (per-phase flow, hooks) | [speckit_profile.md](speckit_profile.md) + [sdd-extensions.md](sdd-extensions.md) + ADR [0001](_decisions/0001-agent-first-stack.md) | `/speckit.repoindex.module "agent-workflow"` (optional — already covered by speckit module) |

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
