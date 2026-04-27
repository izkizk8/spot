# Quickstart: App Intents Showcase

Manual verification steps for the Swift / Siri / Shortcuts paths
that cannot be exercised under Jest. Run after `pnpm check` passes.

## Prerequisites

- iPhone with **iOS 16 or later** (preferably iOS 17+ to verify
  the latest Shortcuts surfacing; on iOS 16 every step here is
  expected to work too)
- Apple's **Shortcuts** app installed (preinstalled on every iOS
  device by default)
- Android device or emulator
- A modern desktop browser (Chrome, Safari, or Firefox)
- Spot dev client built from this branch with the
  `with-app-intents` Expo config plugin applied
- Optional: a second iPhone running iOS 15 to verify the
  registry's `minIOS: '16.0'` gating (FR-004)

## 0. Build prep (one-time, after pulling this branch)

```sh
pnpm install
pnpm check                 # format + lint + typecheck + jest
npx expo prebuild --clean  # runs both with-live-activity and with-app-intents
npx expo run:ios           # rebuilds the dev client with the four App Intents Swift files
npx expo run:android       # Android dev client (no native rebuild needed for this module)
```

The four Swift files live at `native/ios/app-intents/`. The
`with-app-intents` plugin adds them to the main app target's
compile sources at prebuild time. After
`npx expo prebuild --clean` you can verify both plugins coexisted:

```sh
# In the generated ios/spot.xcodeproj/project.pbxproj:
grep -c 'LogMoodIntent.swift'     ios/spot.xcodeproj/project.pbxproj   # → 1
grep -c 'GetLastMoodIntent.swift' ios/spot.xcodeproj/project.pbxproj   # → 1
grep -c 'GreetUserIntent.swift'   ios/spot.xcodeproj/project.pbxproj   # → 1
grep -c 'SpotAppShortcuts.swift'  ios/spot.xcodeproj/project.pbxproj   # → 1
grep -c 'LiveActivityDemoWidget'  ios/spot.xcodeproj/project.pbxproj   # → > 0 (untouched)
plutil -extract NSSupportsLiveActivities raw \
  ios/spot/Info.plist                                                  # → true (untouched)
```

If the second prebuild adds a duplicate file ref, the plugin's
idempotency invariant has regressed (FR-030, SC-011) — re-run the
plugin unit test (`pnpm test plugins/with-app-intents`) and bisect.

## 1. iOS 16+ — happy path (Stories 1, 2)

1. Launch the dev client on iPhone 16+.
2. Open the Modules tab. **Verify**: an "App Intents Lab" card is
   visible alongside the existing modules (FR-002, SC-001).
3. Tap the card. **Verify**: the screen renders the title
   "App Intents Lab"; no "iOS 16+ only" banner is shown
   (FR-018(a)). The mood picker is visible with **`neutral`
   pre-selected** (FR-020, planning resolution of
   NEEDS CLARIFICATION #2). Three buttons are visible:
   "Log mood", "Get last mood", "Greet user". A name text field
   sits above "Greet user". An empty event log region is shown
   under the buttons with a heading like "Recent intent
   invocations". A "Mood History" list is shown below the event
   log; a "Shortcuts integration guide" card with an
   "Open Shortcuts" button is shown at the bottom.
4. Tap **Log mood** with the picker on `neutral`. **Verify**:
   within the same render pass a result line appears
   ("Logged neutral at HH:MM"); a new entry appears at the top
   of the event log with intent name `LogMoodIntent`,
   parameters `{ mood: "neutral" }`, and a recent timestamp
   (SC-002); a new entry appears at the top of the Mood History
   list with mood "neutral" and the same timestamp (SC-004).
5. Switch the picker to `happy`, tap **Log mood** again.
   **Verify**: a second event log entry appears above the first;
   Mood History now has two entries with `happy` on top.
6. Tap **Get last mood**. **Verify**: result line reads
   "Last mood: happy"; a new event log entry appears with
   intent name `GetLastMoodIntent`, no parameters, result
   "happy".
7. Type "Ada" in the name field. **Verify**: the **Greet user**
   button enables (it was disabled while empty per the empty-name
   resolution). Tap it. **Verify**: result line reads
   "Hello, Ada!"; a new event log entry appears with intent
   name `GreetUserIntent`, parameters `{ name: "Ada" }`, result
   "Hello, Ada!".
8. Clear the name field. **Verify**: the **Greet user** button
   disables. Type two spaces; **verify** the button stays
   disabled (`name.trim().length === 0`). Type "  Ada  " (with
   surrounding whitespace); **verify** the button enables and on
   tap the result line reads "Hello, Ada!" (trimmed).
9. Fire any of the three buttons rapidly 12 times in any order.
   **Verify**: the event log displays exactly **10** entries,
   newest-first; the oldest two are evicted (SC-003).
10. Navigate away from the screen, then back. **Verify**: the
    event log is empty (FR-022 — not persisted across unmount);
    the Mood History list is unchanged (FR-013 — persisted).

## 2. iOS 16+ — Shortcuts integration (Story 3)

1. Open the App Intents Lab on iOS 16+ and tap **Open Shortcuts**.
   **Verify**: the Shortcuts app launches via the
   `shortcuts://` URL (FR-028).
2. In Shortcuts, browse the **App Shortcuts** list (Gallery →
   "App Shortcuts" or the "Apps" tab depending on iOS version).
   **Verify**: the **Spot** app appears with **three actions**
   listed under it: `Log mood`, `Get last mood`, `Greet user`,
   each with parameter prompts matching their declared
   parameters (FR-009, SC-005). The mood action's parameter
   prompt offers the three cases Happy / Neutral / Sad
   (capitalised display labels per `caseDisplayRepresentations`).
3. Tap **Log mood** in Shortcuts and run it with mood `sad`.
4. Return to Spot, re-open the App Intents Lab. **Verify**: the
   **Mood History** list has a new top entry with mood `sad`
   and a recent timestamp (SC-004). The event log is empty
   (the new screen mount started with an empty buffer per
   FR-022).
5. Run **Greet user** in Shortcuts with the name field left
   blank. **Verify**: the response is `"Hello, there!"`
   (planning resolution of the empty-name clarification — the
   Swift body's defence against the JS-side disable rule being
   bypassable from Siri / Shortcuts).
6. From the home screen, invoke **"Hey Siri, log my mood happy"**
   (donation surfacing requires at least one prior in-app
   invocation per FR-006). **Verify**: Siri confirms with the
   intent's dialog ("Logged happy at HH:MM"); returning to Spot
   shows the new entry at the top of Mood History.

## 3. iOS 15 (FR-004) — optional, skip if no iOS 15 device

1. On an iPhone running iOS 15, open the Modules tab.
2. **Verify**: the App Intents Lab card is either hidden or
   rendered with the registry's standard "unavailable" treatment
   per spec 006 (FR-004). The exact treatment is owned by
   feature 006 and not re-asserted here.
3. **Developer**: confirm in the bundler logs that the iOS-only
   `AppIntents` Swift symbol was never resolved on this device
   (the `requireOptionalNativeModule` returns `null`; no native
   module error appears in the logs).

## 4. Android (Story 4)

1. Build the dev client for Android and launch.
2. Open the Modules tab → App Intents Lab.
3. **Verify**: the screen renders with the **"App Intents are
   iOS 16+ only"** banner at the top (FR-019(a)). Below the
   banner: the **JS-only Mood Logger** panel with the picker
   pre-selected to `neutral` and a Log button; the **Greet**
   input field with an initially-disabled Greet button; the
   **Mood History** list. The event log, the iOS-only "Get last
   mood" button, and the Shortcuts integration guide card are
   **NOT shown** (FR-019).
4. Tap **Log** with mood `happy`. **Verify**: the Mood History
   list updates within the same render pass with a new top
   entry "happy" + recent timestamp (FR-024, FR-026).
5. Type "Mae" in the name field. **Verify**: the Greet button
   enables. Tap it. **Verify**: an inline result line reads
   "Hello, Mae!"; no native bridge call was made (developer
   check: no `requireNativeModule` warnings in the Metro logs).
6. **Verify** (developer): if you hand-call any of the three
   bridge methods other than `isAvailable()` from a JS
   debugger, they each throw `AppIntentsNotSupported` rather
   than no-oping (FR-011, SC-007).
7. Background the app, foreground it. **Verify**: the Mood
   History list is unchanged (FR-033) — no Siri / Shortcuts on
   Android, so no new entries; the listener still fires
   harmlessly.

## 5. Web (Story 4)

1. Run `pnpm web` and open the page in Chrome on a desktop.
2. Navigate to Modules → App Intents Lab.
3. **Verify**: same composition as Android — banner + JS Mood
   Logger + Greet form + Mood History; no event log; no
   Shortcuts card.
4. Open the browser devtools console. **Verify**: no runtime
   errors related to missing iOS-only App Intents symbols
   (SC-007). The bridge file imports without throwing because
   `requireOptionalNativeModule` resolves to `null` cleanly on
   web.
5. Cycle through mood logging and Greet. **Verify**: the Mood
   History list updates on each Log; the Greet inline result
   line updates on each Greet (FR-024, FR-019(c)).
6. Refresh the page. **Verify**: the Mood History list still
   shows the previously logged entries (AsyncStorage on web is
   `localStorage`-backed by default and is persisted across
   reloads).

## 6. Edge cases & lifecycle (FR-032, FR-033, Edge Cases)

1. **Empty mood store + Get last mood (iOS 16+)**: clear app
   data (or call `mood-store.clear()` from a test build), open
   the App Intents Lab, tap **Get last mood**. **Verify**: the
   result line reads "No moods logged yet" (or the equivalent
   documented empty-result string); a new event log entry
   records the empty-result state (FR-007).
2. **Rapid intent firing (iOS 16+)**: tap **Log mood**,
   **Get last mood**, **Greet user** in quick succession 5
   times each. **Verify**: every invocation appears in the
   event log in the order it was fired; the Mood History list
   reflects the final state of the mood store; no crash.
3. **AsyncStorage failure (test build only)**: stub
   AsyncStorage to throw on `setItem`. Tap **Log mood**.
   **Verify**: a user-visible error line appears; the screen
   does not crash; the event log records a failure entry on
   iOS (FR-016, FR-023).
4. **Backgrounding mid-intent (iOS 16+)**: tap **Log mood**,
   immediately background the app. Wait 5 s. Foreground the
   app. **Verify**: the Mood History list (re-read on
   foreground) reflects the completed write; the event log
   contains either a success or a clearly-marked failure
   entry; no crash (FR-033, Edge Cases).
5. **Navigating away during an in-flight bridge call (iOS
   16+)**: tap **Log mood**, immediately navigate back to the
   Modules grid. **Verify** (developer): no React state-update
   warnings in the console after unmount; no crash (FR-032).
6. **Shortcuts deep-link failure**: on the iOS Simulator
   without the Shortcuts app, tap **Open Shortcuts**.
   **Verify**: a user-visible error line appears; the screen
   does not crash (FR-028, SC-006).

## 7. Accessibility (FR-034, FR-035, FR-036)

1. On iOS, enable VoiceOver (Settings → Accessibility →
   VoiceOver).
2. Open the App Intents Lab. **Verify**: each affordance
   announces its purpose:
   - The mood picker announces "Mood: happy / neutral / sad".
   - The three buttons announce "Log mood", "Get last mood",
     "Greet user".
   - The name field announces its label and current value.
   - The "Open Shortcuts" button announces "Open Shortcuts
     app" (FR-034).
3. Trigger an intent. **Verify**: the new event log row
   announces the intent name, parameters, and result as a
   single coherent string (FR-035).
4. On Android with TalkBack and on Web with the screen reader
   of choice, open the App Intents Lab. **Verify**: the
   "iOS 16+ only" banner is announced as a single message on
   screen mount (FR-036). The mood picker, Greet form, Log
   button, and Mood History rows announce their function.

## 8. Quality gates (SC-012, FR-043)

```sh
pnpm check
```

**Verify**: format, lint, typecheck, and Jest all pass with
zero warnings introduced by the new module.

## 9. Additive-only invariant (SC-010, FR-039)

```sh
git diff --stat main..HEAD -- ':!src/modules/app-intents-lab/' \
                              ':!src/native/app-intents.ts' \
                              ':!plugins/with-app-intents/' \
                              ':!native/ios/app-intents/' \
                              ':!test/unit/modules/app-intents-lab/' \
                              ':!test/unit/native/app-intents.test.ts' \
                              ':!test/unit/plugins/with-app-intents/' \
                              ':!specs/013-app-intents/'
```

**Verify**: the only file outside the module / native / plugin
/ test / spec directories with diffs is:

- `src/modules/registry.ts` — exactly one added import line and
  one added array entry (after `swiftChartsLab`).

If `app.json` or `Podfile.properties.json` required edits to
register the `with-app-intents` plugin (Expo expects it in the
`plugins` array), they are documented here and counted as the
documented exception in SC-010 — but the preferred path is to
register the plugin via Expo's auto-discovery of
`plugins/with-app-intents/package.json` (`"main": "index.ts"`)
so no app-config edit is needed. Verify with the diff above
before opening the PR.

## 10. Stress (Edge Cases)

1. Push 110 mood entries from the JS console
   (`for (let i=0;i<110;i++) await moodStore.push({...})`).
   **Verify**: `(await moodStore.list()).length === 100`; the
   first 10 pushed are absent; the most recent push is at
   index 0 (FR-015 + planning resolution of NEEDS
   CLARIFICATION #3).
2. On iOS 16+, fire **Log mood** 25 times in a row.
   **Verify**: the event log shows 10 entries (FR-022, SC-003);
   the Mood History list shows 20 entries (FR-025).
