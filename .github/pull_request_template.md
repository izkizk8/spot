<!-- Keep this short. Tick what applies; leave the rest. -->

## What & Why

<!-- 1–2 lines -->

## Linked Spec

<!-- specs/00X-name/  — or "N/A trivial" -->

## Doc System Rules (mandatory)

This repo splits docs into explicit classes; PRs must keep them in sync.

- [ ] **Code structure / deps changed** → re-ran the matching `/speckit.repoindex.{overview,architecture,module}` so generated profile files listed in `docs/README.md` reflect reality
- [ ] **Spec Kit extension installed/removed** → refreshed `docs/speckit_profile.md`, `docs/_index/speckit_fileindex.json`, and registry-derived `docs/sdd-extensions.md`
- [ ] **Made a judgement call** (tool choice, tradeoff, convention divergence) → added an ADR in `docs/_decisions/`
- [ ] **External tool walkthrough** added/changed → updated `docs/_howto/`
- [ ] **None of the above** → no doc changes needed

## Verification

- [ ] `pnpm docs:check` green (or covered by `pnpm check`)
- [ ] `pnpm check` green
- [ ] Exercised on at least one platform
