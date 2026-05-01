# Implementation Plan: AltStore source for OTA distribution

**Branch**: `088-altstore-source` | **Date**: 2026-05-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/088-altstore-source/spec.md`

## Summary

Publish a self-hosted AltStore source (`source.json`) backed by GitHub Releases for the IPA and GitHub Pages for the manifest. A `release-altstore.yml` workflow runs on `v*` tag push: it triggers the existing EAS `sideload` profile, downloads the artifact, attaches it to a GitHub release, regenerates `source.json` via a small Node script, commits it back to `dev`, and lets Pages redeploy. The on-phone experience becomes "open AltStore → tap update".

## Technical Context

**Language/Version**: TypeScript 5.x (script), YAML (workflow), JSON (manifest). Node 22 (workflow runtime, matches local Volta pin).
**Primary Dependencies**: `eas-cli` (CLI invocation), `@actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `softprops/action-gh-release`, `actions/configure-pages`, `actions/deploy-pages`. No new runtime deps in the app.
**Storage**: `docs/altstore/source.json` in git; IPAs as GitHub Release assets.
**Testing**: Manual end-to-end (push tag, observe phone). Unit tests for the generator's pure logic (version-merge, schema validity) under `test/unit/scripts/altstore/` using existing Jest setup.
**Target Platform**: GitHub Actions (ubuntu-latest), iPhone running AltStore Classic or SideStore, GitHub Pages.
**Project Type**: Tooling/CI feature; no app source-code change.
**Performance Goals**: Workflow runtime ≈ EAS build time (~15 min) + ~2 min for release/source/pages steps.
**Constraints**: EAS free plan = 15 builds/month; free Apple ID 7-day cert; GitHub Pages must be enabled; `EXPO_TOKEN` secret must exist.
**Scale/Scope**: Single app, single owner, episodic releases. `versions[]` will accumulate; pruning is out of scope until it actually grows.

## Constitution Check

*GATE: must pass before Phase 0; re-check after Phase 1.*

Constitution v1.1.0 highlights (`.specify/memory/constitution.md`):

- **Doc system rules** ([`docs/README.md`](../../docs/README.md)): every doc has one home. This feature adds an ADR (judgement) and a howto (external-tool procedure). No generated profile is touched. ✅
- **CRLF + docs gate**: `pnpm docs:check` must pass. The new ADR + howto + JSON file conform; no generated-profile hand edits. ✅
- **Style**: TS script uses single quotes, `StyleSheet.create` is irrelevant (non-RN code). No new app surface. ✅
- **Spec Kit lifecycle**: spec → plan → tasks → implement, with ADR + howto cross-linked. Followed. ✅

No violations. Complexity-tracking table omitted.

## Project Structure

### Documentation (this feature)

```text
specs/088-altstore-source/
├── spec.md     # this feature's spec
├── plan.md     # this file
└── tasks.md    # generated next
```

### Source Code (repository root)

```text
scripts/
└── altstore/
    └── build-source.ts        # generator: (app.json, package.json, EAS metadata, IPA file, prior source.json) → new source.json

docs/
├── altstore/
│   └── source.json            # the manifest AltStore reads (served by Pages)
├── _decisions/
│   └── 0006-altstore-source-distribution.md   # ADR (already drafted)
└── _howto/
    └── altstore-source.md     # operator walkthrough (already drafted)

.github/
└── workflows/
    └── release-altstore.yml   # tag-triggered orchestration

test/unit/scripts/altstore/
└── build-source.test.ts       # pure-logic tests for the generator

package.json                    # add `altstore:source` script
```

**Structure Decision**: extend the existing repo flat layout; no new top-level packages. The script lives under `scripts/` (matches existing tooling convention). The manifest lives under `docs/altstore/` so it ships through the same Pages workflow that serves docs.

## Phase 0 — Research (already absorbed)

Findings, captured in [ADR 0006](../../docs/_decisions/0006-altstore-source-distribution.md):

- AltStore source schema: <https://faq.altstore.io/developers/make-a-source>. Required keys at root: `name`, `apps[]`. Per app: `name`, `bundleIdentifier`, `developerName`, `iconURL`, `localizedDescription`, `versions[]`, `appPermissions`. Per version: `version`, `buildVersion`, `date`, `downloadURL`, `size`, `minOSVersion`.
- `marketplaceID` is **only** required for AltStore PAL (EU notarized). Not needed here.
- `versions[]` order matters; AltStore picks index 0 as "latest".
- `appPermissions` must exist even if empty (`{ entitlements: [], privacy: [] }`).
- EAS download URLs expire (~7 days) → must re-host (GitHub Releases).
- `eas build --json --non-interactive --wait` returns the build object including `artifacts.buildUrl`, `appVersion`, `appBuildVersion` — these are our authoritative version numbers.
- GitHub Pages can be deployed from a workflow via `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`. We deploy `docs/altstore/` only (small, focused), avoiding entanglement with general docs.

## Phase 1 — Design

### Generator contract

`scripts/altstore/build-source.ts` is the single owner of `source.json`. Inputs:

| Input | Source |
|---|---|
| `name`, `subtitle`, `description`, `tintColor`, `iconURL` | hardcoded constants in the script |
| `apps[].bundleIdentifier`, `name` | `app.json` `expo.ios.bundleIdentifier`, `expo.name` |
| `apps[].iconURL` | constant pointing at `raw.githubusercontent.com/.../assets/images/icon.png` on `dev` |
| New version entry: `version`, `buildVersion` | EAS build JSON (`appVersion`, `appBuildVersion`) |
| New version entry: `downloadURL` | `https://github.com/izkizk8/spot/releases/download/v<version>/spot-<version>.ipa` |
| New version entry: `size` | `fs.statSync(ipaPath).size` |
| New version entry: `date` | UTC ISO date of the build, supplied by workflow |
| New version entry: `minOSVersion` | `app.json` `expo.ios.deploymentTarget` (or fallback `"16.0"`) |
| Prior `versions[]` | parsed from existing `docs/altstore/source.json` if present |

Logic:

1. Load prior `source.json` if it exists; otherwise start from skeleton.
2. Build new version entry from CLI args + filesystem reads.
3. **Idempotency**: if a version entry with the same `version` + `buildVersion` already exists, **replace it in place** (don't append). This makes re-running the workflow on the same tag safe (FR-009).
4. Sort `versions[]` so the new entry is at index 0 if its `version` (semver) is highest.
5. Emit JSON with 2-space indent + trailing newline.

CLI shape:

```bash
tsx scripts/altstore/build-source.ts \
  --version 1.2.3 \
  --build-version 7 \
  --ipa ./spot-1.2.3.ipa \
  --date 2026-05-01 \
  --out docs/altstore/source.json
```

### Workflow contract

`.github/workflows/release-altstore.yml`:

- Trigger: `push: tags: ['v*']`.
- Permissions: `contents: write` (release + commit), `pages: write`, `id-token: write` (Pages deploy).
- Concurrency: `group: release-altstore`, `cancel-in-progress: false` (avoid two source-updates racing — FR edge case).
- Jobs:
    1. **build-and-publish** (ubuntu-latest):
        a. Checkout `dev` (the tag points to a `dev` commit; we need the branch ref to commit back to).
        b. Setup Node 22 via Volta or `setup-node`, install pnpm, `pnpm install --frozen-lockfile`.
        c. Sanity check: `${{ github.ref_name }}` (`vX.Y.Z`) matches `package.json` and `app.json` `version`. Fail otherwise (SC-003).
        d. `eas build --platform ios --profile sideload --non-interactive --wait --json` → parse to get `appBuildVersion` and the artifact URL.
        e. `curl -L -o spot-<version>.ipa <buildUrl>`.
        f. `gh release create v<version> spot-<version>.ipa --title "v<version>" --notes-file <release-notes>` (or update if exists).
        g. `pnpm altstore:source --version <version> --build-version <build> --ipa spot-<version>.ipa --date <iso-date> --out docs/altstore/source.json`.
        h. `git config user.name/email` to a bot, `git commit -am "chore(altstore): publish v<version>"`, `git push origin dev`.
        i. Upload `docs/altstore/` as Pages artifact.
    2. **deploy-pages** (depends on `build-and-publish`):
        a. `actions/deploy-pages`.

Failure semantics: any failed step fails the job; `git commit/push` runs only after release upload succeeds, so partial states are bounded — either the release exists with no source update (recoverable by re-running), or both exist (success).

### Testing strategy

- **Unit (Jest)**: generator pure logic — given prior source + new entry, assert idempotency, ordering, schema-shape.
- **Integration (manual)**: push a real `v1.0.1` tag, walk through the howto on the phone.
- **Validation**: load the generated `source.json` against AltStore's published schema (no formal JSON Schema is published; we'll structurally validate required fields in a unit test).

## Phase 1 — Constitution Re-check

Same gates as Phase 0 — no new code in `src/`, no new dependencies in `package.json` runtime deps; only dev-side script + workflow + docs. ✅

## Complexity Tracking

No constitution violations to justify. Section omitted.
