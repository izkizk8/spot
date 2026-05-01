# Research: NSUserActivity / Handoff / Continuity Module

**Feature**: 040-handoff-continuity
**Date**: 2026-04-30
**Status**: Complete — spec is autonomous; no open NEEDS CLARIFICATION

This document records the design decisions made before implementation. There were no genuinely open questions — the spec was authored with sufficient platform context that every decision below was already implied. This file makes those decisions explicit so the contracts and tasks have a single referent.

---

## Decision 1: Native bridge — hand-written Swift vs community package

**Decision**: **Hand-written Swift module** under `native/ios/handoff/`, exposed via the `expo-modules-core` `Module` DSL.

**Rationale**:

- No mature community wrapper exists for `NSUserActivity` on Expo SDK 55. (`expo-quick-actions` covers shortcuts, not Handoff.)
- The bridge surface is small: 3 async functions (`setCurrent`, `resignCurrent`, `getCurrent`) + 1 event channel (`onContinue`). Estimated < 80 LOC of Swift.
- Hand-written keeps the educational artifact honest — readers see the actual `NSUserActivity` lifecycle, not a wrapper.
- No new npm dependency means no upgrade-path risk on future Expo SDK bumps.
- Pattern is already established in the repo (see prior native bridges under `native/ios/`).

**Alternatives considered**:

1. **Wrap an unmaintained community package** — rejected; we'd inherit upgrade debt for a 60-line bridge.
2. **Skip the bridge and stub `setCurrent` in JS** — rejected; that would defeat the educational point of the module (Story 4 requires real cross-device continuation).

---

## Decision 2: AppDelegate continuation hook

**Decision**: **`HandoffActivityHandler.swift` registers as an `AppDelegateSubscriber`** via `expo-modules-core`, intercepting `application(_:continue:restorationHandler:)`.

**Rationale**:

- `expo-modules-core` provides the canonical AppDelegate-extension mechanism. Hand-rolling an AppDelegate swizzle would conflict with Expo's lifecycle ownership.
- The handler always **returns `true`** to claim the activity (the JS side decides what to do; refusing would surface as a system fallback that would confuse readers).
- The handler converts `NSUserActivity` into a plain Swift dictionary (`[String: Any]`) before emitting, so the JS bridge sees only JSON-safe values:
  - `activityType: String`
  - `title: String?` (defaults to empty string if missing)
  - `webpageURL: String?` (URL → absolute string)
  - `userInfo: [String: Any]` (Apple guarantees plist-safe types here in practice)
  - `requiredUserInfoKeys: [String]` (Set → sorted Array for stable JS shape — see Decision 4)
- The handler emits via the bridge's `onContinue` event channel; the JS hook subscribes via `addContinuationListener`.

**Alternatives considered**:

1. **AppDelegate swizzle outside expo-modules-core** — rejected; collides with Expo's own AppDelegate management.
2. **Push the conversion into JS** — rejected; non-JSON-safe values from `NSUserActivity` would crash the bridge serialisation. Conversion belongs on the native side.

---

## Decision 3: Plugin merge strategy (`NSUserActivityTypes`)

**Decision**: **Mirror `applySpotlightInfoPlist` exactly** (see `plugins/with-spotlight/index.ts`). Export pure helper `applyHandoffInfoPlist(input)` so unit tests assert byte-identical idempotency without driving the full mod runner.

**Rationale**:

- The 031 helper is already proven (its test suite covers idempotency, missing key, and non-array shapes). Copying the shape verbatim guarantees the union-merge invariant FR-003 / FR-004 / FR-005 / FR-006.
- Pure helper => can be tested in isolation in `test/unit/plugins/with-handoff/index.test.ts` without spinning up `@expo/config-plugins` mocks.
- Order independence (FR-005) falls out automatically from the `includes`-then-`push` pattern: each plugin sees the prior array, appends only if absent, no plugin overwrites or reorders prior entries.

**Algorithm** (pseudocode, matches Decision 3 of `plugins/with-spotlight/index.ts`):

```text
applyHandoffInfoPlist(input):
  next = { ...input }
  prior = isArray(next.NSUserActivityTypes)
            ? next.NSUserActivityTypes.filter(v => typeof v === 'string')
            : []
  if (!isArray(input.NSUserActivityTypes) && input.NSUserActivityTypes !== undefined):
    console.warn('with-handoff: NSUserActivityTypes was not an array; replacing.')
  merged = [...prior]
  if (!merged.includes(HANDOFF_DEMO_ACTIVITY_TYPE)):
    merged.push(HANDOFF_DEMO_ACTIVITY_TYPE)
  next.NSUserActivityTypes = merged
  return next
```

**Alternatives considered**:

1. **`Set`-based dedup** — rejected; would lose source order, and FR-003 requires preserving prior entries' order verbatim.
2. **Read prior `NSUserActivityTypes` from `app.json` directly** — rejected; the `withInfoPlist` modifier is the contract Expo expects, and 031 already proves it works.

---

## Decision 4: `requiredUserInfoKeys` shape — Set vs Array on the wire

**Decision**: Native side **converts to sorted `[String]`** before emitting; JS bridge / hook accepts `string[]` only. (Edge Case #8.)

**Rationale**:

- `NSUserActivity.requiredUserInfoKeys` is a `Set<String>` on the Swift side.
- JSON has no Set primitive. Forwarding as `[String: Bool]` or `{[k]: true}` is uglier than a sorted array.
- Sorting on the Swift side makes the JS-visible shape deterministic, which simplifies snapshot testing.
- The hook normalises one more time (defensive) — if a future bridge build forgets to sort, the JS side still produces a stable order via `[...new Set(arr)].sort()` in the receiver.

---

## Decision 5: `getCurrent` race semantics

**Decision**: The Current Activity card **derives state from a hook-managed mirror** written synchronously after `setCurrent` resolves. `getCurrent` is exposed but the UI **never polls it**. (Edge Case #6.)

**Rationale**:

- Polling `UIApplication.shared.userActivity` from JS would race against rapid composer interactions (user taps "Become current" twice).
- A hook-managed mirror is monotonically consistent with the user's last successful action, which is the correct mental model for the card.
- `getCurrent` remains exposed for debugging / future test scenarios.

---

## Decision 6: iOS-only enforcement

**Decision**: `src/native/handoff.web.ts` **throws `HandoffNotSupported`** on every method and exports `isAvailable: false`. The screen's Android and Web variants render `IOSOnlyBanner` and never import the iOS-only path. (FR-008 / FR-019.)

**Rationale**:

- Throwing in the bridge is the cheapest way to enforce that a future refactor cannot accidentally call the iOS-only API on non-iOS without test failure.
- The `.web.ts` split happens at the bridge module level, so the screen variants don't need to do platform branching themselves.
- `isAvailable` lets components render UI states ("Handoff is not supported on this device") without try/catch.

---

## Decision 7: Universal Links deferral

**Decision**: **Defer Universal Links wiring entirely to a follow-up spec.** The Universal Links card is documentary only — explainer copy + requirements list + "Deferred to follow-up spec" pill. No Associated Domains entitlement, no AASA file, no `applinks:` route handling. (Story 6 / FR-018.)

**Rationale**:

- Universal Links require domain-level infrastructure (HTTPS hosting of `apple-app-site-association` at `/.well-known/apple-app-site-association`) that is out of scope for an in-app educational module.
- The relationship to `NSUserActivity` is real and worth explaining, but adding the implementation would more than double this feature's surface area.
- The card explicitly sets reader expectations with a visually distinct pill.

---

## Decision 8: Log truncation policy

**Decision**: **FIFO truncation at exactly 10 entries**, newest first; oldest dropped on overflow. Screen-scoped (resets on unmount). (FR-014 / Edge Case #5.)

**Rationale**:

- 10 is enough to demonstrate continuation behaviour without growing unboundedly during a long debug session.
- Screen-scoped (rather than app-scoped) is consistent with the "lab" metaphor — leaving the screen and returning is a fresh session.
- Newest-first ordering matches the user's mental model when watching events arrive.

---

## Decision 9: Validation rules in the composer

**Decision**: Three blocking validations + inline errors (FR-010):

1. `activityType` non-empty AND matches `^[a-zA-Z0-9._-]+$` AND contains at least one `.` (cheap reverse-DNS heuristic).
2. `webpageURL` empty OR parseable by `new URL(...)` AND protocol is `http:` or `https:`.
3. Every entry in `requiredUserInfoKeys` is a key in `userInfo`.

**Rationale**:

- Reverse-DNS validation is intentionally permissive (heuristic, not strict RFC) — Apple itself doesn't enforce a strict format, and we don't want to over-constrain learners.
- URL parsing via `new URL()` is the standard JS approach; rejecting non-http(s) protocols prevents the misleading scenario of a `mailto:` URL silently failing on Universal Links.
- Required-key validation prevents the user from shipping a definition that the OS would refuse to deliver (Reality Check #5).

---

## Open Questions

**None.** The spec was authored with sufficient platform context. All decisions above were either explicitly stated in the spec's Reality Check / Edge Cases / FR sections, or are direct consequences of those statements.
