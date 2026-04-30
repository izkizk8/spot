# Feature Specification: Universal Links / Associated Domains Module

**Feature Branch**: `041-universal-links`
**Feature Number**: 041
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Parent Branch**: `040-handoff-continuity`

## Summary

iOS 9+ educational module that demonstrates **Universal Links** — the
mechanism by which tapping a real `https://` URL on an iOS device opens
the corresponding installed app (instead of Safari) and routes the
user to a target screen. Adds a "Universal Links Lab" card to the 006
iOS Showcase registry (`id: 'universal-links-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '9.0'`).

The module is purely educational: it explains the moving parts
(`apple-app-site-association` JSON, `applinks:` Associated Domains
entitlement, `expo-linking` / `expo-router` integration), generates a
recommended AASA file for the user's bundle id, and exposes a self-
test composer that opens a `https://` URL via `Linking.openURL` and
echoes the final route observed by the app.

The native side reuses **`expo-linking`**: expo-router already wires
incoming URLs into the route tree. This module adds JS-level subscriber
logic on top of `Linking.addEventListener('url', …)` plus an initial-URL
capture, with a 10-entry FIFO log.

A config plugin `plugins/with-universal-links/` adds the
`com.apple.developer.associated-domains` entitlement (and ships
`applinks:spot.example.com` as a placeholder; documented for
replacement). The plugin is **idempotent** and **union-merges** with
any prior `associated-domains` entries (FR-005).

## Universal Links Reality Check (READ FIRST)

1. **Three pieces are required and ALL must be correct**:
   (a) `applinks:<domain>` in `com.apple.developer.associated-domains`
   entitlement; (b) AASA JSON hosted at
   `https://<domain>/.well-known/apple-app-site-association` served as
   `application/json` with **no redirects**; (c) a route handler in the
   app (`expo-router` does this automatically for matching paths).
   Failing any one yields a silent fall-through to Safari.
2. **AASA caching**: AASA is fetched once on first launch and on app
   updates. Mid-session changes to the file are not picked up. iCloud
   signed-in devices use Apple's CDN; signed-out devices fetch directly.
3. **Long-press escape hatch**: long-pressing a UL in iOS reveals an
   "Open in Safari" option; a user who picks that bypasses the app
   entirely. The Explainer card calls this out.
4. **Build-time entitlement**: changing `associatedDomains` cannot be
   delivered OTA — a fresh native build is required.
5. **Android App Links / Web are intentionally out-of-scope**: this
   module focuses on Apple's mechanism. Android and web variants render
   only an `IOSOnlyBanner`.

## User Scenarios

- **US1** — Read the Explainer to learn what Universal Links are and
  what runtime conditions cause them to silently fail.
- **US2** — See which `applinks:` domains are configured (read from
  `app.json` `expo.ios.associatedDomains`) with a status pill per
  entry.
- **US3** — Compose a `https://` URL, dispatch it via
  `Linking.openURL`, and observe the echoed route — a self-test of the
  AASA + entitlement pipeline.
- **US4** — Preview the recommended AASA JSON for the configured
  bundle id and copy it to the clipboard.
- **US5** — Read the Setup Instructions card listing the eight
  end-to-end steps.
- **US6** — See the most recent 10 incoming Universal Link events with
  parsed host / path / timestamp.
- **US7** — Android / web users see an iOS-only banner.

## Functional Requirements

- **FR-001** — Module manifest: id `universal-links-lab`, platforms
  `['ios','android','web']`, `minIOS: '9.0'`.
- **FR-002** — iOS screen renders six cards in this order:
  ExplainerCard, DomainsList, TestComposer, AASAPreviewCard,
  SetupInstructions, InvocationsLog.
- **FR-003** — `useUniversalLinks` hook:
  - subscribes to `Linking.addEventListener('url', …)` on mount;
  - resolves `Linking.getInitialURL()` once on mount (best-effort);
  - normalises events into `{ url, host, path, receivedAt }`;
  - drops events with non-string or empty `url` (with `__DEV__` warn);
  - prepends valid events to `log` and FIFO-truncates at 10;
  - exposes `clear()` and `dispatch(url)` callbacks;
  - cleans up the subscription on unmount;
  - ignores events received after unmount.
- **FR-004** — `aasa-template`: `buildAASA({ bundleIdentifier, teamId?, paths? })`
  returns a JSON-serialisable AASA document with one detail entry of
  `<TEAMID>.<bundleIdentifier>` and paths defaulting to `["*"]`.
- **FR-005** — `with-universal-links` plugin:
  - adds `applinks:spot.example.com` to
    `com.apple.developer.associated-domains` entitlement;
  - is idempotent (re-running on its own output is byte-stable);
  - union-merges with prior entries (preserves order, no duplicates);
  - non-array prior values trigger a single `console.warn` and are
    replaced;
  - coexists with all other entitlement plugins (keychain,
    sign-in-with-apple, app groups, passkit) — none of those touch
    `associated-domains`.
- **FR-006** — `app.json` declares `expo.ios.associatedDomains` with
  the placeholder `applinks:spot.example.com` and the plugin is added
  to `expo.plugins` (32 total, up from 31).
- **FR-007** — Android and web screens render only `IOSOnlyBanner`.

## Out of Scope

- Real domain ownership and AASA hosting (placeholder only).
- Android App Links and Digital Asset Links.
- Web `web+spot://` custom schemes (already handled by expo-router).
- Universal Link continuation via `NSUserActivity` (covered conceptually
  in feature 040; this module re-explains for context).
- Deep route-table introspection (the lab assumes the user inspects
  `expo-router` routes themselves).

## Acceptance Criteria

- All 15 new Jest test files pass.
- `pnpm check` is green (format, lint, typecheck, test).
- No `eslint-disable` directives.
- Constitution v1.1.0 unchanged.
