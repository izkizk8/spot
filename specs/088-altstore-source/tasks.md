# Tasks: AltStore source for OTA distribution

**Feature**: 088-altstore-source
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)

Tasks are dependency-ordered. `[P]` = parallelizable with the previous group.

## Phase A — Generator (User Story 3, FR-007/008/009)

- **A1** Add minimal `tsx`/`ts-node` invocation pattern (likely `tsx` already installed via Expo). Verify with `pnpm exec tsx --version`.
- **A2** Create `scripts/altstore/build-source.ts`:
    - Parse CLI args (`--version`, `--build-version`, `--ipa`, `--date`, `--out`, optional `--app-json`, `--source-json`).
    - Load `app.json` to read `expo.ios.bundleIdentifier`, `expo.name`, `expo.ios.deploymentTarget`.
    - Load existing `source.json` if present, otherwise start from skeleton with the static metadata constants documented in `plan.md`.
    - Compute new version entry with deterministic `downloadURL` (`https://github.com/izkizk8/spot/releases/download/v<version>/spot-<version>.ipa`) and `size = fs.statSync(ipa).size`.
    - **Idempotent merge**: if a `versions[]` entry with same `version` + `buildVersion` exists, overwrite; otherwise prepend.
    - Sort `versions[]` by semver `version` desc (tie-break by `buildVersion` desc).
    - Write 2-space JSON + trailing newline.
    - Exit non-zero on any IO/validation failure with a clear message.
- **A3** [P] `test/unit/scripts/altstore/build-source.test.ts`:
    - Generates a valid skeleton when no prior source exists.
    - Idempotency: running twice with the same args yields a single entry.
    - Ordering: `1.2.0` placed before `1.1.5`.
    - Schema completeness: required keys present at root, app, version levels.
- **A4** Add `package.json` script: `"altstore:source": "tsx scripts/altstore/build-source.ts"`. Run `pnpm altstore:source --help` (or no-args) to ensure it surfaces usage.

## Phase B — Initial source.json checked in

- **B1** Manually run the generator with a placeholder version `0.0.0` and a fake `--ipa` to bootstrap `docs/altstore/source.json`? **Skip** — AltStore rejects empty `versions[]`, but a `0.0.0` placeholder would be exposed publicly. Instead: **commit the source.json only after the first real release lands via the workflow**. This phase is intentionally empty; the file appears in the workflow's first commit.
- **B2** Add `docs/altstore/.gitkeep` so the directory exists pre-first-release and Pages config is straightforward. (Or omit and rely on the workflow's first commit creating it. Choosing `.gitkeep` for clarity.)

## Phase C — GitHub Actions workflow (User Story 3, FR-006/008)

- **C1** Create `.github/workflows/release-altstore.yml`:
    - Trigger: `push: tags: ['v*']`.
    - Concurrency group `release-altstore`, no cancel-in-progress.
    - Permissions: `contents: write`, `pages: write`, `id-token: write`.
    - Job `build-and-publish`:
        1. `actions/checkout@v4` with `ref: dev` and `fetch-depth: 0` (need branch + tag history).
        2. `actions/setup-node@v4` with `node-version: 22` and pnpm cache.
        3. `pnpm/action-setup@v4` and `pnpm install --frozen-lockfile`.
        4. **Version sanity check**: tag (`${{ github.ref_name }}` minus leading `v`) must equal `package.json` `version` and `app.json` `expo.version`. Fail otherwise.
        5. `eas-cli` install (`pnpm add -g eas-cli` or use action) and login via `EXPO_TOKEN`.
        6. `eas build --platform ios --profile sideload --non-interactive --wait --json > build.json`.
        7. Parse `build.json` for `artifacts.buildUrl` and `appBuildVersion`.
        8. Download IPA: `curl -fL -o spot-<version>.ipa "$(jq -r '.[0].artifacts.buildUrl' build.json)"`.
        9. `gh release create v<version> spot-<version>.ipa --title "v<version>" --notes "Built from $(git rev-parse --short HEAD)"` (use `gh release upload --clobber` if release already exists from a prior run).
        10. `pnpm altstore:source --version <version> --build-version <build> --ipa spot-<version>.ipa --date $(date -u +%Y-%m-%d) --out docs/altstore/source.json`.
        11. Commit `docs/altstore/source.json` with `git commit` (skip if no diff — handles re-runs), push to `dev`.
        12. `actions/upload-pages-artifact@v3` with `path: docs/altstore`.
    - Job `deploy-pages` (`needs: build-and-publish`):
        1. `actions/configure-pages@v5`.
        2. `actions/deploy-pages@v4`.
- **C2** Add `EXPO_TOKEN` secret instructions to `docs/_howto/altstore-source.md` prerequisites (already there) and ADR.
- **C3** Verify GitHub Pages source is set to "GitHub Actions" (manual repo setting, called out in howto).

## Phase D — Docs system gate

- **D1** Add ADR `docs/_decisions/0006-altstore-source-distribution.md`. (Already drafted in this branch.)
- **D2** Add howto `docs/_howto/altstore-source.md`. (Already drafted in this branch.)
- **D3** Cross-link from `docs/_howto/sideload-iphone.md` to the new howto under "See Also" / fallback note.
- **D4** Update `docs/README.md` if the doc-decision-tree implies any new entry (it doesn't — ADR + howto are existing classes — but verify nothing stale).
- **D5** Update root `README.md` table to mention the AltStore install option (mirrors the `pnpm ios:ipa` row).
- **D6** Run `pnpm docs:check`. Fix anything it reports.

## Phase E — Verification

- **E1** Run `pnpm typecheck` and `pnpm test` (unit tests for generator).
- **E2** Run the generator locally against a fake IPA file to produce a sample `source.json`; eyeball it for required keys.
- **E3** Push a real tag (out of band, after merge): observe workflow, observe phone, document any deviation.
- **E4** Mark spec acceptance scenarios pass/fail in a follow-up retrospective if used.

## Parallelization

- A2 and A3 are tightly coupled — write the test alongside the implementation (TDD where useful).
- D3, D4, D5 can run in parallel after A/B/C land.
- C1 cannot start until A4 (the script must exist for the workflow to call it).

## Out of scope (intentional)

- Pruning old `versions[]` entries.
- News items, screenshots, Patreon gating.
- Signed AltStore source / source authentication.
- Multi-app sources.
- Switching from AltStore Classic to AltStore PAL.
