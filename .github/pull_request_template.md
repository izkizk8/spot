<!-- Keep this short. Tick what applies; leave the rest. -->

## What & Why

<!-- 1–2 lines -->

## Linked Spec

<!-- specs/00X-name/  — or "N/A trivial" -->

## Doc System Rules (mandatory)

This repo splits docs into three classes; PRs must keep them in sync.

- [ ] **Code structure / deps changed** → re-ran the matching `/speckit.repoindex.{overview,architecture,module}` so generated `docs/*.md` reflect reality
- [ ] **Spec Kit extension installed/removed** → re-ran `/speckit.repoindex.module "speckit"` (regenerates `docs/speckit_profile.md` + `docs/sdd-extensions.md`)
- [ ] **Made a judgement call** (tool choice, tradeoff, convention divergence) → added an ADR in `docs/_decisions/`
- [ ] **External tool walkthrough** added/changed → updated `docs/_howto/`
- [ ] **None of the above** → no doc changes needed

## Verification

- [ ] `pnpm check` green
- [ ] Exercised on at least one platform
