# Feature Specification: SharePlay Showcase Module

**Feature Branch**: `047-shareplay`
**Feature Number**: 047
**Created**: 2026-05-09
**Status**: Approved (autonomous, no clarifications)
**Parent Branch**: `046-weatherkit`

## Summary

iOS 15+ educational module that demonstrates Apple's
**GroupActivities** framework — building a custom `GroupActivity`
that participants can launch together via FaceTime or Messages.
Adds a "SharePlay" card to the 006 iOS Showcase registry
(`id: 'shareplay-lab'`, `platforms: ['ios','android','web']`,
`minIOS: '15.0'`).

The module ships its own thin Swift bridge (`native/ios/shareplay/`)
exposing a custom `ShowcaseGroupActivity` that conforms to
`GroupActivity` plus a `SharePlayBridge` Expo Module that manages
session state, observes participants, and routes
`GroupSessionMessenger` messages. The bridge is mocked at the
import boundary in unit tests.

A dedicated Expo config plugin is **not required** — basic
`GroupActivity` registration does not require Info.plist keys or
entitlements (see `research.md`). The plugin layer is therefore
**skipped** for this feature; the `app.json` plugins array is
unchanged.

## Sections / UX

1. **Capability card** — shows `GroupActivities` framework
   availability and the current `GroupSession` state.
2. **Activity composer** — pick a demo activity type
   (Counter / Drawing / Quiz). Configure the activity title.
3. **Session status card** — `Start activity` button that
   registers a `GroupActivity`, plus a status pill
   (`none` / `preparing` / `active` / `ended`).
4. **Participants list** — shows participant count plus display
   names where available.
5. **Live state demo (Counter)** — when the active activity is
   `Counter`, shows a shared counter that increments via
   `GroupSessionMessenger`; +/- buttons; live updates from peers.
6. **Setup instructions** — "Start a FaceTime call, then tap the
   activity in the SharePlay menu" plus a Share-via-Messages
   hint.
7. **IOSOnlyBanner** — Android / Web only; explains the framework
   is iOS-exclusive.

## Decisions

- **No config plugin.** SharePlay's basic `GroupActivity`
  registration does not need entitlements or Info.plist keys.
  See `research.md` for the decision matrix and rejected
  alternatives.
- **`app.json` plugins array unchanged** (count stays at 37 —
  no with-mapkit assertion bump).
- **Three frozen activity types** (Counter / Drawing / Quiz) live
  in `activity-types.ts`.
- **Tests** are JS-pure; the native bridge is mocked at the
  import boundary via `__setSharePlayBridgeForTests`.
- **Counter demo** is the only activity type with live shared
  state; Drawing and Quiz are scaffold-only (status reporting
  but no payload UI) to keep scope tight.
