# Spec Kit / SDD Extensions

Registry-derived reference for the Spec Kit extension layer installed in this workspace.

Sources used for this file:

- `.specify/extensions/.registry`
- `.specify/extensions.yml`
- `.specify/extensions/*/extension.yml`

Extension skip decisions are intentionally outside this registry reference; see [ADR 0004](_decisions/0004-skipped-extensions.md).

## Registry Snapshot

| Field | Value |
|-------|-------|
| Registry schema | `1.0` |
| Enabled extensions | 22 |
| Bundled core extensions | 6 |
| Community extensions | 16 |
| Disabled extensions | 0 |
| Extension config `installed` list | Empty (`[]`) |
| Canonical commands in manifests | 58 |
| Registered Copilot command entries | 65 |
| Registry source value | `local` for every installed extension |
| Registry priority | `10` for every installed extension |
| Derived | 2026-04-28 |

## Installed Extensions

### Bundled Core (6)

| ID | Name | Version | Canonical Commands | Registered Copilot Entries | Aliases Registered |
|----|------|---------|--------------------|----------------------------|--------------------|
| `git` | Git Branching Workflow | `1.0.0` | 5 | 5 | None |
| `memory-loader` | Memory Loader | `1.0.0` | 1 | 1 | None |
| `repoindex` | Repository Index | `1.0.0` | 3 | 6 | `speckit.repoindex-overview`, `speckit.repoindex-architecture`, `speckit.repoindex-module` |
| `archive` | Archive Extension | `1.0.0` | 1 | 1 | None |
| `retrospective` | Retrospective Extension | `1.0.0` | 1 | 1 | None |
| `status` | Project Status | `1.0.0` | 1 | 2 | `speckit.status` |

### Community Installed (16)

| ID | Name | Version | Canonical Commands | Registered Copilot Entries | Aliases Registered |
|----|------|---------|--------------------|----------------------------|--------------------|
| `doctor` | Project Health Check | `1.0.0` | 1 | 2 | `speckit.doctor` |
| `superb` | Superpowers Bridge | `1.3.0` | 8 | 8 | None |
| `status-report` | Status Report | `1.3.4` | 1 | 1 | None |
| `spec-validate` | Spec Validate | `1.0.1` | 6 | 6 | None |
| `agent-assign` | Agent Assign | `1.0.0` | 3 | 3 | None |
| `bugfix` | Bugfix Workflow | `1.0.0` | 3 | 3 | None |
| `catalog-ci` | Catalog CI | `1.0.0` | 4 | 4 | None |
| `cleanup` | Cleanup Extension | `1.0.0` | 1 | 2 | `speckit.cleanup` |
| `fix-findings` | Fix Findings | `1.0.0` | 1 | 2 | `speckit.fix-findings` |
| `fleet` | Fleet Orchestrator | `1.1.0` | 2 | 2 | None |
| `learn` | Learning Extension | `1.0.0` | 2 | 2 | None |
| `plan-review-gate` | Plan Review Gate | `1.0.0` | 1 | 1 | None |
| `retro` | Retrospective | `1.0.0` | 1 | 1 | None |
| `review` | Review Extension | `1.0.1` | 7 | 7 | None |
| `orchestrator` | Spec Orchestrator | `1.0.0` | 4 | 4 | None |
| `checkpoint` | Spec Checkpoint | `1.0.0` | 1 | 1 | None |

## Canonical Commands

| Extension | Command | Manifest Description |
|-----------|---------|----------------------|
| `git` | `speckit.git.feature` | Create a feature branch with sequential or timestamp numbering |
| `git` | `speckit.git.validate` | Validate current branch follows feature branch naming conventions |
| `git` | `speckit.git.remote` | Detect Git remote URL for GitHub integration |
| `git` | `speckit.git.initialize` | Initialize a Git repository with an initial commit |
| `git` | `speckit.git.commit` | Auto-commit changes after a Spec Kit command completes |
| `memory-loader` | `speckit.memory-loader.load` | Read all project memory files and output their contents for context |
| `repoindex` | `speckit.repoindex.overview` | Generate overview reference data for the repository |
| `repoindex` | `speckit.repoindex.architecture` | Generate deep architectural analysis of the repository |
| `repoindex` | `speckit.repoindex.module` | Generate deep analysis of an individual module |
| `archive` | `speckit.archive.run` | Archive a feature specification into main project memory after merge |
| `retrospective` | `speckit.retrospective.analyze` | Generate retrospective.md with spec adherence and drift analysis |
| `status` | `speckit.status.show` | Show project status and SDD workflow progress |
| `doctor` | `speckit.doctor.check` | Run a full project health diagnostic |
| `superb` | `speckit.superb.check` | Verify required and optional superpowers skills and report hook readiness |
| `superb` | `speckit.superb.tdd` | Enforce pre-implementation RED-GREEN-REFACTOR through the Spec Kit task structure |
| `superb` | `speckit.superb.review` | Verify tasks.md covers every requirement in spec.md before implementation |
| `superb` | `speckit.superb.verify` | Enforce completion verification with fresh spec-coverage evidence |
| `superb` | `speckit.superb.critique` | Review diffs against spec.md, plan.md, and tasks.md by severity |
| `superb` | `speckit.superb.debug` | Enforce root-cause debugging before repeated fix attempts |
| `superb` | `speckit.superb.finish` | Present branch completion options after verification passes |
| `superb` | `speckit.superb.respond` | Verify review feedback technically before implementing responses |
| `status-report` | `speckit.status-report.show` | Display project status and feature progress |
| `spec-validate` | `speckit.spec-validate.validate` | Validate comprehension of spec.md |
| `spec-validate` | `speckit.spec-validate.validate-tasks` | Validate comprehension of tasks.md |
| `spec-validate` | `speckit.spec-validate.review` | Record peer review outcomes |
| `spec-validate` | `speckit.spec-validate.gate` | Hard gate before implementation |
| `spec-validate` | `speckit.spec-validate.status` | Show approval and warning state |
| `spec-validate` | `speckit.spec-validate.analytics` | Show private and aggregate analytics |
| `agent-assign` | `speckit.agent-assign.assign` | Scan available agents and assign them to tasks in tasks.md |
| `agent-assign` | `speckit.agent-assign.validate` | Validate that all agent assignments are correct and agents exist |
| `agent-assign` | `speckit.agent-assign.execute` | Execute tasks by spawning the assigned agent for each task |
| `bugfix` | `speckit.bugfix.report` | Capture a bug and trace it back to relevant spec artifacts |
| `bugfix` | `speckit.bugfix.patch` | Surgically update spec, plan, and tasks to address the reported bug |
| `bugfix` | `speckit.bugfix.verify` | Verify bugfix patches are consistent across all spec artifacts |
| `catalog-ci` | `speckit.catalog-ci.validate` | Validate catalog JSON structure, fields, ID format, semver, ordering, and duplicates |
| `catalog-ci` | `speckit.catalog-ci.check-urls` | Verify all URLs in catalog entries are accessible via HTTP HEAD |
| `catalog-ci` | `speckit.catalog-ci.diff` | Compare catalog against a git ref to show added, modified, and removed entries |
| `catalog-ci` | `speckit.catalog-ci.lint` | Compare local extension.yml against its catalog entry for consistency |
| `cleanup` | `speckit.cleanup.run` | Review implementation, fix small issues, and identify tech debt |
| `fix-findings` | `speckit.fix-findings.run` | Iteratively analyze and fix spec findings until no issues remain |
| `fleet` | `speckit.fleet.run` | Orchestrate a full feature lifecycle with human-in-the-loop checkpoints |
| `fleet` | `speckit.fleet.review` | Run cross-model evaluation of plan.md and tasks.md before implementation |
| `learn` | `speckit.learn.review` | Generate an educational guide explaining decisions, patterns, and concepts |
| `learn` | `speckit.learn.clarify` | Clarify spec ambiguities with pros, cons, recommendations, and mentoring context |
| `plan-review-gate` | `speckit.plan-review-gate.check` | Check that spec.md and plan.md have been merged before task generation |
| `retro` | `speckit.retro.run` | Conduct a structured retrospective of the completed development cycle |
| `review` | `speckit.review.run` | Run comprehensive code review using specialized agents |
| `review` | `speckit.review.code` | Review general code quality, guideline compliance, and bug risk |
| `review` | `speckit.review.comments` | Review comment accuracy, documentation completeness, and comment rot |
| `review` | `speckit.review.tests` | Review behavioral coverage, critical gaps, and test resilience |
| `review` | `speckit.review.errors` | Review silent failures, catch blocks, and error logging |
| `review` | `speckit.review.types` | Review type design, invariants, usefulness, and enforcement |
| `review` | `speckit.review.simplify` | Suggest clarity improvements and removal of unnecessary complexity |
| `orchestrator` | `speckit.orchestrator.status` | Show every feature and its SDD phase |
| `orchestrator` | `speckit.orchestrator.next` | Query and prioritize tasks across all features |
| `orchestrator` | `speckit.orchestrator.conflicts` | Detect when parallel features touch the same files |
| `orchestrator` | `speckit.orchestrator.sync` | Consolidate feature state into specs/status.json |
| `checkpoint` | `speckit.checkpoint.commit` | Commit changes at meaningful checkpoints |

## Hook Bindings

These rows are copied from `.specify/extensions.yml`; commands with `optional: false` are listed as required.

| Hook | Extension | Command | Required | Prompt |
|------|-----------|---------|----------|--------|
| `before_constitution` | `git` | `speckit.git.initialize` | Yes | Execute speckit.git.initialize? |
| `before_specify` | `git` | `speckit.git.feature` | Yes | Execute speckit.git.feature? |
| `before_specify` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_clarify` | `git` | `speckit.git.commit` | No | Commit outstanding changes before clarification? |
| `before_clarify` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_plan` | `git` | `speckit.git.commit` | No | Commit outstanding changes before planning? |
| `before_plan` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_tasks` | `git` | `speckit.git.commit` | No | Commit outstanding changes before task generation? |
| `before_tasks` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_tasks` | `plan-review-gate` | `speckit.plan-review-gate.check` | Yes | Execute speckit.plan-review-gate.check? |
| `before_implement` | `git` | `speckit.git.commit` | No | Commit outstanding changes before implementation? |
| `before_implement` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_implement` | `superb` | `speckit.superb.tdd` | Yes | Execute speckit.superb.tdd? |
| `before_implement` | `spec-validate` | `speckit.spec-validate.gate` | Yes | Execute speckit.spec-validate.gate? |
| `before_checklist` | `git` | `speckit.git.commit` | No | Commit outstanding changes before checklist? |
| `before_checklist` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_analyze` | `git` | `speckit.git.commit` | No | Commit outstanding changes before analysis? |
| `before_analyze` | `memory-loader` | `speckit.memory-loader.load` | Yes | Execute speckit.memory-loader.load? |
| `before_taskstoissues` | `git` | `speckit.git.commit` | No | Commit outstanding changes before issue sync? |
| `after_constitution` | `git` | `speckit.git.commit` | No | Commit constitution changes? |
| `after_specify` | `git` | `speckit.git.commit` | No | Commit specification changes? |
| `after_specify` | `spec-validate` | `speckit.spec-validate.validate` | No | Spec generated. Run comprehension validation now? |
| `after_clarify` | `git` | `speckit.git.commit` | No | Commit clarification changes? |
| `after_plan` | `git` | `speckit.git.commit` | No | Commit plan changes? |
| `after_tasks` | `git` | `speckit.git.commit` | No | Commit task changes? |
| `after_tasks` | `superb` | `speckit.superb.review` | No | Review tasks.md for coverage and TDD-readiness before implementation? |
| `after_tasks` | `spec-validate` | `speckit.spec-validate.validate-tasks` | No | Tasks generated. Run task validation now? |
| `after_tasks` | `agent-assign` | `speckit.agent-assign.assign` | No | Assign agents to the generated tasks? |
| `after_tasks` | `fleet` | `speckit.fleet.review` | No | Run cross-model review to evaluate plan and tasks before implementation? |
| `after_implement` | `git` | `speckit.git.commit` | No | Commit implementation changes? |
| `after_implement` | `retrospective` | `speckit.retrospective.analyze` | No | Run retrospective analysis now? (spec changes require explicit confirmation) |
| `after_implement` | `superb` | `speckit.superb.verify` | Yes | Execute speckit.superb.verify? |
| `after_implement` | `bugfix` | `speckit.bugfix.verify` | No | Run bugfix consistency check after implementation? |
| `after_implement` | `cleanup` | `speckit.cleanup.run` | No | Run cleanup to review implementation changes and identify tech debt? |
| `after_implement` | `fix-findings` | `speckit.fix-findings.run` | No | Run fix-findings to analyze and resolve spec findings automatically? |
| `after_implement` | `learn` | `speckit.learn.review` | No | Generate a learning guide from this implementation? |
| `after_implement` | `review` | `speckit.review.run` | No | Run PR review on implemented changes? |
| `after_checklist` | `git` | `speckit.git.commit` | No | Commit checklist changes? |
| `after_analyze` | `git` | `speckit.git.commit` | No | Commit analysis results? |
| `after_taskstoissues` | `git` | `speckit.git.commit` | No | Commit after syncing issues? |

---

**Derived**: 2026-04-28
