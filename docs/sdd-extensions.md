# Spec Kit Extensions — Installed Catalog

Catalog of every extension registered in `.specify/extensions/.registry`. Pure reference data — derivable from the registry + each extension's `extension.yml`.

> **Source of truth**: `specify extension list` (run from repo root)
> **For *why* certain extensions were skipped**: see ADR [0004](_decisions/0004-skipped-extensions.md)
> **For workflow / when-to-use guidance**: see [speckit_profile.md](speckit_profile.md)

## Bundled Core (6)

| ID | Version | Role |
|----|---------|------|
| `git` | 1.0.0 | Branch creation, validation, auto-commit hooks |
| `memory-loader` | 1.0.0 | Loads `.specify/memory/*` before every lifecycle command (mandatory) |
| `repoindex` | 1.0.0 | Generates `docs/*.md` profiles + `docs/_index/*.json` from codebase analysis |
| `archive` | 1.0.0 | Archives merged feature into project memory after merge |
| `retrospective` | 1.0.0 | Post-implement spec adherence + drift analysis (auto-offered) |
| `status` | 1.0.0 | `/speckit.status` — current phase, artifacts, task progress |

## Community-Installed (12)

Grouped by lifecycle stage they bind to.

### Pre-Spec (Discovery & Setup)

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `doctor` | 1.0.0 | KhawarHabibKhan | `/speckit.doctor.check` |
| `status-report` | 1.3.4 | Open-Agent-Tools | `/speckit.status-report.show` |

### Spec & Clarify

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `learn` | 1.0.0 | imviancagrace | `/speckit.learn.{clarify,review}` |
| `spec-validate` | 1.0.1 | aeltayeb | `/speckit.spec-validate.{validate,review,gate,status,analytics,validate-tasks}` |

### Plan & Tasks

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `plan-review-gate` | 1.0.0 | luno | `/speckit.plan-review-gate.check` |
| `agent-assign` | 1.0.0 | xymelon | `/speckit.agent-assign.{assign,validate,execute}` |
| `fix-findings` | 1.0.0 | Quratulain-bilal | `/speckit.fix-findings.run` |

### Implement

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `superb` (superpowers-bridge) | 1.3.0 | RbBtSn0w | `/speckit.superb.{check,tdd,review,verify,critique,debug,respond,finish}` |
| `checkpoint` | 1.0.0 | aaronrsun | `/speckit.checkpoint.commit` |

### Post-Implement Quality

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `cleanup` | 1.0.0 | dsrednicki | `/speckit.cleanup.run` |
| `review` | 1.0.1 | ismaelJimenez | `/speckit.review.{run,code,comments,tests,errors,types,simplify}` |
| `bugfix` | 1.0.0 | Quratulain-bilal | `/speckit.bugfix.{report,patch,verify}` |
| `retro` | 1.0.0 | arunt14 | `/speckit.retro.run` |

### Multi-Feature Orchestration

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `orchestrator` | 1.0.0 | Quratulain-bilal | `/speckit.orchestrator.{status,next,conflicts,sync}` |
| `fleet` | 1.1.0 | sharathsatish | `/speckit.fleet.{run,review}` |

### Catalog Maintenance

| ID | Version | Author | Commands |
|----|---------|--------|----------|
| `catalog-ci` | 1.0.0 | Quratulain-bilal | `/speckit.catalog-ci.{validate,lint,diff,check-urls}` |

## Hook Bindings (selected)

Full mapping lives in `.specify/extensions.yml`.

| Hook | Default-fired commands |
|------|------------------------|
| `before_specify` | `git.feature`, `memory-loader.load` |
| `before_*` (clarify/plan/tasks/implement) | `git.commit` (optional), `memory-loader.load` |
| `before_implement` | `superb.tdd` (mandatory if Superpowers skills installed) |
| `before_tasks` | `plan-review-gate.check` |
| `after_tasks` | `superb.review`, `agent-assign.validate` |
| `after_implement` | `git.commit`, `superb.verify`, `cleanup.run`, `retrospective.analyze`, `retro.run`, `learn.review`, `review.run` |

## Installing More

```powershell
specify extension search <keyword>
specify extension add <id> --from <release-zip-url>
specify extension list
```

Community catalog: <https://github.com/github/spec-kit/blob/main/extensions/catalog.community.json>

---

**Generated**: 2026-04-26 (manually seeded; will be overwritten by `/speckit.repoindex.module "speckit"` from `.specify/extensions/.registry`) | **Spec Kit Version**: 0.8.1
