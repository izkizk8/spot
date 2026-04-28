# Project Changelog

> Append-only log of features merged into main. Maintained by `/speckit.archive.run`.

## 2026-04-26 — Batch archive of features 001, 002, 004, 005

All four feature specs were merged into `.specify/memory/{spec,plan}.md` and the original spec folders preserved under `specs/` for traceability.

### `001-fix-speckit-concerns` — 28/28 tasks ✓
- Filled durable project memory (`docs/memory/PROJECT_CONTEXT.md`, `ARCHITECTURE.md`)
- Enabled auto-commit for all `after_*` Spec Kit hooks (except `after_taskstoissues`)
- Removed 6 alias agent/prompt files (hyphenated repoindex variants)
- Updated stale "unfilled constitution" references; constitution ratified at v1.0.0
- **Note**: `docs/memory/` was later deleted by feature 002 — superseded by `.specify/memory/`

### `002-remove-memory-md` — 18/18 tasks ✓
- Deleted `memory-md` extension (~62 files): 6 agents, 6 prompts, extension dir, registry entry
- Deleted obsolete `docs/memory/` directory (superseded by `.specify/memory/`)
- Updated all repo-index docs: 28→22 commands, 7→6 extensions, 28→22 agent files
- Removed "Memory Layers" / "Required Workflow" sections from `copilot-instructions.md`
- **Decision**: At solo-developer scale, structured memory CLI tooling adds overhead without proportional value; agents read/write `.specify/memory/*.md` directly

### `004-eas-build-ipa` — 17/17 tasks ✓
- Added `eas.json` with `development` (simulator) + `sideload` (unsigned IPA) profiles
- Set `app.json` `ios.bundleIdentifier = com.izkizk8.spot`
- Created `.eas/build/unsigned-ios.yml` custom build pipeline (skips Apple credentials, builds with `CODE_SIGNING_REQUIRED=NO`)
- Wrote complete Windows → iOS sideload how-to
- Verified working: build [cdb774a4](https://expo.dev/accounts/izkizk8/projects/spot/builds/cdb774a4-16b5-4e70-9c6a-ecddeb891663)
- **Captured as ADR**: [`0003-unsigned-ipa-custom-build`](../../docs/_decisions/0003-unsigned-ipa-custom-build.md)
- **How-to**: [`docs/_howto/sideload-iphone.md`](../../docs/_howto/sideload-iphone.md)

### `005-infra-tooling-upgrade` — 60/60 tasks ✓
- Consolidated 14 `package.json` scripts including `pnpm check` aggregate gate
- Adopted OXC (`oxfmt@0.46.0` + `oxlint@1.61.0`) as primary format/lint
- Retained `eslint-plugin-react-hooks@7.1.1` for React Compiler-era Hooks rules
- Added Jest 29 + `jest-expo` + RNTL with copyable examples in `test/unit/examples/`
- Documented compatibility decisions for Expo 55 / RN 0.83.6 / React 19.2 / TS 5.9 / Jest 29 / pnpm hoisted
- **Captured as ADR**: [`0002-toolchain`](../../docs/_decisions/0002-toolchain.md)

---

## Concurrent (out-of-feature) work merged 2026-04-26

These weren't separate SDD features but landed in the same window and matter for memory:

- **Installed 16 community Spec Kit extensions** (superb, status-report, spec-validate, agent-assign, bugfix, catalog-ci, checkpoint, cleanup, fix-findings, fleet, learn, plan-review-gate, doctor, retro, review, orchestrator) plus `Specify CLI 0.8.1`. Skipped `ci-guard` (upstream namespace bug) and `speckit-utils` (command conflict with `doctor`). See ADR [`0004`](../../docs/_decisions/0004-skipped-extensions.md).
- **Restructured docs into classed system**: explicit generated profiles listed in `docs/README.md` + file indexes (`docs/_index/*.json`) + ADRs (`docs/_decisions/`) + how-tos (`docs/_howto/`). Enforced by PR template + `.specify/memory/doc-system.md` (auto-loaded by `memory-loader`).
- **Captured as ADR**: [`0001-agent-first-stack`](../../docs/_decisions/0001-agent-first-stack.md)

---

## How to Append a New Entry

After running `/speckit.archive.run specs/NNN-feature-name`, this file gets a new dated section. Format:

```markdown
### `NNN-feature-name` — X/Y tasks ✓

- Bullet of major outcome
- Bullet of architectural change
- Captured as ADR [NNNN](...) (if applicable)
- How-to (if applicable)
```
