---
last_verified: 2026-05-01
prerequisites:
  - iPhone with AltStore (Classic) or SideStore already installed
  - This repo's GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)
  - `EXPO_TOKEN` repo secret with EAS build access (Settings → Secrets and variables → Actions)
  - For the weekly re-sign only: a PC on the same Wi-Fi running AltServer (Classic) — SideStore users skip this
---

# How to install spot via the AltStore source (OTA, no USB)

## Goal

Install and update **spot** on an iPhone over the air using AltStore, instead of plugging into a PC and running Sideloadly each time. Builds, hosting, and source-manifest updates are automated by a GitHub Actions release workflow.

> **Why this exists**: see ADR [0006](../_decisions/0006-altstore-source-distribution.md). Upstream unsigned-IPA pipeline is ADR [0003](../_decisions/0003-unsigned-ipa-custom-build.md).

## One-time setup (per phone)

1. Open AltStore on the iPhone → **Browse** → **Sources** → **+** (top right).
2. Paste the source URL:

    ```
    https://izkizk8.github.io/spot/altstore/source.json
    ```

3. Tap **Add**. The "spot dev" source appears in the list.
4. Open the source → **spot** → **Free**. AltStore downloads the IPA, re-signs it with your free Apple ID, and installs.
5. Trust the developer cert: **Settings → General → VPN & Device Management → Developer App → \<your Apple ID\>** → **Trust**.

## Releasing a new version (per build)

1. Bump `version` in `package.json` and `app.json`. Commit on `dev`.
2. Tag and push:

    ```bash
    git tag v1.2.3
    git push origin v1.2.3
    ```

3. GitHub Actions (`release-altstore.yml`) does the rest:
    - Triggers `eas build --platform ios --profile sideload --non-interactive --wait`
    - Downloads the resulting `.ipa`
    - Creates GitHub release `v1.2.3`, attaches `spot-1.2.3.ipa`
    - Regenerates `docs/altstore/source.json` with the new `versions[]` entry
    - Commits the source update back to `dev`
    - Publishes GitHub Pages
4. Within a minute of the workflow finishing, AltStore on the phone shows an update badge → **Updates** → **Update**.

The whole post-tag flow is hands-off. Build minutes count against your EAS free plan (15 builds/month).

## Weekly re-sign (free Apple ID)

Free Apple ID certificates expire after 7 days. AltStore handles the renewal:

- **AltStore Classic**: keep AltServer running on the PC and connect the phone to the same Wi-Fi. AltStore re-signs in the background, no cable needed. Open the AltStore app once a week to nudge it.
- **SideStore**: re-signs itself using a remote anisette server, no PC at all.

If you miss the window, the app gets greyed out — open AltStore (with AltServer on, for Classic) and tap **Refresh All** to recover without rebuilding.

## Verify

- After the release workflow finishes, `https://izkizk8.github.io/spot/altstore/source.json` returns HTTP 200 with `Content-Type: application/json` and the new `version` shows up at the top of `versions[]`.
- AltStore on the phone shows the new version under **Updates**.
- Tapping update completes without errors and the app launches on the new build.

## Troubleshooting

- **Source URL fails to load in AltStore** → confirm Pages is enabled and the URL returns 200 in a browser. CDN cache can lag a couple of minutes after a deploy.
- **`Invalid source` in AltStore** → schema mismatch. Validate the file with [AltStudio](https://altstudio.app/) or re-run `pnpm altstore:source` locally; common cause is a missing `appPermissions` object.
- **Update doesn't appear** → AltStore caches sources for ~30 min. Pull-to-refresh in the source detail page, or remove and re-add the source.
- **`bundleIdentifier mismatch`** → `source.json` `bundleIdentifier` must equal the IPA's `Info.plist`. Currently `com.izkizk8.spot`. The generator reads it from `app.json`; if you ever rename the bundle ID, regenerate.
- **`Unable to download app`** → 99% of the time the GitHub Release asset URL is wrong (release not yet published, or workflow failed before `gh release upload`). Check the release page for the IPA asset.
- **EAS build fails in CI** → same diagnosis as a local `pnpm ios:ipa`; check the build logs on expo.dev. The workflow fails the job, no source is updated.
- **`Maximum 3 apps` from Apple** → free Apple ID hard limit, unchanged from Sideloadly path.
- **App expired after 7 days, AltStore won't refresh** → Classic: AltServer must be running and on the same Wi-Fi as the phone. SideStore: check the configured anisette server is reachable.

## Fallback

If the AltStore route is broken (Pages outage, EAS down, source schema change), fall back to USB sideload — see [`sideload-iphone.md`](sideload-iphone.md). The IPA produced by `pnpm ios:ipa` is identical in both paths.

## See Also

- ADR [0006](../_decisions/0006-altstore-source-distribution.md) — why AltStore source over USB-only
- ADR [0003](../_decisions/0003-unsigned-ipa-custom-build.md) — upstream unsigned IPA pipeline
- [`sideload-iphone.md`](sideload-iphone.md) — USB fallback
- [`eas-sideload_profile.md`](../eas-sideload_profile.md) — EAS sideload module reference
- [AltStore: Make a Source](https://faq.altstore.io/developers/make-a-source)
