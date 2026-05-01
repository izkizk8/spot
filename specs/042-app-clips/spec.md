# Feature Specification: App Clips Showcase Module

**Feature Branch**: `042-app-clips`
**Feature Number**: 042
**Created**: 2026-05-01
**Status**: Approved (autonomous, no clarifications needed)
**Parent Branch**: `041-universal-links`

## Summary

iOS 14+ educational scaffold module that demonstrates **Apple App
Clips** — small (<10MB) slices of an iOS app that run without a full
install, invoked via App Clip Codes, NFC tags, QR codes, Smart App
Banners, place cards in Apple Maps, or shared links in Messages. Adds
an "App Clips Lab" card to the 006 iOS Showcase registry
(`id: 'app-clips-lab'`, `platforms: ['ios','android','web']`,
`minIOS: '14.0'`).

The module is purely educational and a code-complete scaffold: a real
App Clip ships as a *separate Xcode target* with its own bundle id,
entitlement file, signing, build phases, and 10MB size budget. No
config plugin can create that sub-target reliably today; that work
must still be performed in Xcode. The scaffold therefore explains the
moving parts, simulates `_XCAppClipURL` invocation payloads in JS, and
documents the exact manual Xcode steps a developer must perform to
turn the scaffold into a shippable App Clip.

A config plugin `plugins/with-app-clips/` writes the parent target's
`com.apple.developer.on-demand-install-capable` boolean entitlement
(true). The plugin is **idempotent**, **coexists** with all prior
entitlement plugins (keychain, sign-in-with-apple, app-groups,
associated-domains, etc.), and warns on non-boolean overwrites.

## App Clips Reality Check (READ FIRST)

1. **Separate Xcode target**: an App Clip is *not* a runtime mode of
   the parent app. It is a completely separate target with its own
   bundle id (`<parent>.Clip`), Info.plist, entitlement file, signing
   identity, and build phases. Config plugins cannot create that
   target today.
2. **Hard 10MB limit**: the uncompressed App Clip payload must be
   under 10MB. Apple rejects the build at submission if it isn't.
3. **Restricted frameworks**: HealthKit, background modes, CallKit,
   CloudKit private database, full StoreKit, and a long list of other
   frameworks are not allowed in App Clips.
4. **Ephemeral**: the App Clip is purged automatically after a period
   of disuse. Treat the clip as ephemeral; long-term flows require
   the full app install.
5. **Invocation surfaces**: NFC tag URI, QR / App Clip Code, Smart
   App Banner, Maps place card, Messages preview, Safari banner; the
   simulator covers all of these as catalog entries.

## User Scenarios

- **US1** — Read the Explainer to learn what App Clips are, how
  they're invoked, and what `_XCAppClipURL` is.
- **US2** — Open the Invocation Simulator, pick a source surface,
  press Simulate launch, and observe a synthetic `_XCAppClipURL`
  payload appear in the Payload Viewer.
- **US3** — Read the Setup Instructions checklist and the
  Limitations card to understand the manual Xcode work and platform
  constraints required to ship a real App Clip.
- **US4** — On Android / web the screen renders only an
  `IOSOnlyBanner` (App Clips is iOS-only).

## Functional Requirements

- **FR-001** — The module manifest declares
  `id: 'app-clips-lab'`, `platforms: ['ios','android','web']`,
  `minIOS: '14.0'`.
- **FR-002** — The iOS screen renders five sections in order:
  Explainer → Invocation Simulator → Payload Viewer → Setup
  Instructions → Limitations.
- **FR-003** — The Invocation Simulator catalog (`invocation-sources.ts`)
  exposes at least the six surfaces NFC, QR, Maps, Safari, Messages,
  Default; ids are stable lowercase kebab-case; the catalog is frozen
  at module load.
- **FR-004** — `simulator-store` is an in-memory FIFO store with a
  configurable capacity (default 20), most-recent-first listing,
  `subscribe()` notifications, listener-error tolerance, frozen
  snapshots, and copied-not-aliased metadata.
- **FR-005** — The config plugin sets the
  `com.apple.developer.on-demand-install-capable` parent-target
  entitlement to `true`. It is idempotent (re-running on its own
  output is byte-identical) and coexists with all prior entitlement
  plugins.
- **FR-006** — Android and Web screens render only the
  `IOSOnlyBanner`; no simulator surfaces, no payload viewer.
- **FR-007** — The plugin is added to `app.json` exactly once;
  `app.json` plugin count grows from 32 → 33.

## Out of Scope

- Creating the actual App Clip Xcode sub-target (must be done
  manually in Xcode).
- Authoring App Clip Experience configuration JSON (server-side; out
  of repo).
- Generating App Clip Codes (designed in App Store Connect).
- Native bridge to receive a real `NSUserActivity` with
  `NSUserActivityTypeBrowsingWeb` from a sub-target — the module
  simulates the payload only.
