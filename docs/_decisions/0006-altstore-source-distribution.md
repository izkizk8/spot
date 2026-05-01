---
status: accepted
date: 2026-05-01
deciders: project owner
---

# 0006. Distribute the unsigned IPA via an AltStore source

## Context

ADR [0003](0003-unsigned-ipa-custom-build.md) gave us a free unsigned `.ipa` from EAS. The current install path ([`docs/_howto/sideload-iphone.md`](../_howto/sideload-iphone.md)) requires plugging the iPhone into the Windows machine and running Sideloadly for **every** install — both the initial install and the weekly free-Apple-ID re-sign.

The goal of this decision is to keep the same unsigned-IPA pipeline but eliminate the cable round-trip from the day-to-day loop, ideally allowing install / update entirely from the phone.

## Decision

Publish an [AltStore source](https://faq.altstore.io/developers/make-a-source) — a self-hosted JSON manifest pointing at the IPA — and distribute the app through AltStore (already installed on the device).

Concretely:

- **IPA hosting**: GitHub Releases on this repo. Each tagged version uploads the IPA as a release asset, giving a permanent HTTPS URL.
- **`source.json` hosting**: GitHub Pages from this repo, served at `https://izkizk8.github.io/spot/altstore/source.json`.
- **Generation**: a Node script (`scripts/altstore/build-source.ts`) regenerates `source.json` from `package.json` + the EAS build metadata for the tagged version.
- **Automation**: a GitHub Actions workflow runs on `v*` tag push — it triggers the EAS `sideload` build, downloads the artifact, attaches it to the GitHub release, regenerates `source.json`, commits it back to `dev`, and publishes Pages.

The free-Apple-ID re-sign every 7 days is handled by AltServer-on-Wi-Fi (PC on the same network, **no cable**), or by switching to SideStore for fully PC-free re-signs. Both consume the same `source.json`.

## Alternatives Considered

- **Status quo (Sideloadly only)** — works, but requires USB on every install. Unacceptable for routine updates.
- **Self-hosted IPA on S3 / R2** — works, but adds an unrelated cloud dependency for a public repo. Rejected: GitHub Releases is permanent, free, and already in the trust boundary.
- **Reuse the EAS download URL directly in `source.json`** — rejected: EAS artifact URLs expire in roughly 7 days, breaking the source.
- **Raw GitHub URL (`raw.githubusercontent.com`) for `source.json`** — works, but `Content-Type: text/plain`. GitHub Pages serves `application/json` and survives if we ever rename the default branch.
- **TestFlight / paid Apple Developer Program ($99/yr)** — kills the 7-day cert problem for real, but costs money and requires App Store Connect provisioning. Out of scope for this decision; remains an option if the project ever ships to others.

## Consequences

- ✅ Installs and version updates happen from the phone — no cable for those.
- ✅ AltStore shows update badges automatically when `source.json` `versions[]` advances.
- ✅ Release artifacts are versioned, public, and tied to git tags — easy to roll back.
- ✅ Same pipeline works for SideStore users (no PC required at all) without extra config.
- ⚠️ Weekly cert refresh still requires AltServer on the same Wi-Fi (free Apple ID limit, not a source-design issue).
- ⚠️ The `bundleIdentifier`, `version`, and `buildVersion` in `source.json` must match the IPA's `Info.plist` exactly. The generator must read EAS build metadata, not guess from `package.json` (which only carries `version`, not `buildVersion`).
- ⚠️ The generator script and Pages workflow are now critical-path for distribution. Failures must surface clearly in CI.
- 🔁 Revisit if AltStore Classic becomes incompatible with unsigned IPAs, if free Apple ID rules tighten further, or if the project moves to a paid distribution channel.

## References

- [docs/_howto/altstore-source.md](../_howto/altstore-source.md) — operator walkthrough
- [AltStore: Make a Source](https://faq.altstore.io/developers/make-a-source) — JSON schema
- [AltStore: Updating Apps](https://faq.altstore.io/developers/updating-apps) — version-ordering rules
- ADR [0003](0003-unsigned-ipa-custom-build.md) — upstream unsigned-IPA decision this builds on
- `scripts/altstore/build-source.ts`, `.github/workflows/release-altstore.yml`, `docs/altstore/source.json`
