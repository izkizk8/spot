# Quickstart: Sensors Playground

Manual verification steps for each user story's acceptance scenarios
that cannot be exercised under Jest. Run after `pnpm check` passes.

## Prerequisites

- iPhone with iOS 13+ (preferably iOS 17+ to verify the SF Symbol
  rotation indicator on the Gyroscope card)
- Android device or emulator (sensor support varies on emulators —
  prefer a physical device for the magnetometer)
- A modern desktop browser (Chrome, Safari, or Firefox)
- Spot dev client built from this branch with `expo-sensors` installed
  and the iOS motion permission string set in `app.json`

## 0. Build prep (one-time, after pulling this branch)

```sh
pnpm install
npx expo install expo-sensors
pnpm check                 # format + lint + typecheck + jest
```

If `app.json` does not yet declare the `expo-sensors` config plugin,
add the entry shown in `research.md` Decision 5 and rebuild the dev
client (the motion permission string is bake-time on iOS).

## 1. iOS — happy path (Stories 1, 2, 3)

1. Launch the dev client on iPhone.
2. Open the Modules tab. **Verify**: a "Sensors Playground" card is
   visible in source order alongside the existing modules
   (FR-002, SC-001).
3. Tap the card. **Verify**: the screen renders with four cards
   stacked in this exact order: Accelerometer, Gyroscope,
   Magnetometer, Device Motion (FR-006). All four start in the
   Stopped state with em-dashes or zeros in the readouts.
4. Tap Start on the Accelerometer card. If iOS prompts for motion
   permission (it should not — accelerometer is permissionless;
   FR-034), grant it. **Verify**: x / y / z readouts update visibly
   at 60 Hz, and the bar chart's three rows animate as you tilt the
   phone.
5. Tap Stop. **Verify**: readouts and chart freeze on their last
   value (FR-008).
6. Tap Start on the Gyroscope card. Rotate the phone about its
   vertical axis. **Verify**: the rotation indicator rotates in
   proportion to integrated yaw (FR-019), and x / y / z readouts
   update.
7. Tap Stop on the Gyroscope card, then Start again. **Verify**:
   the rotation indicator resumes from its last angle, not from 0
   (FR-020).
8. Tap Start on the Magnetometer card. iOS may prompt for the motion
   permission — grant it. Rotate the phone in the horizontal plane.
   **Verify**: the compass needle holds a stable absolute
   direction (it counter-rotates relative to the device frame)
   (FR-022). The readouts update.
9. Tap Start on the Device Motion card. Tilt the phone forward,
   backward, left, right. **Verify**: the inner spirit-level disc
   moves toward the corresponding edge of the outer circle and
   stays clamped at the edge at extreme tilts (FR-025). The
   pitch / roll / yaw readouts update — if "Device Motion" units
   are degrees per Decision 1 in `research.md`, expect values in
   `±180°` range.
10. With one or more cards Started, observe the header button label
    is "Stop All". Tap it. **Verify**: every card transitions to
    Stopped (FR-013, FR-015).
11. Tap "Start All". **Verify**: every available card transitions to
    Started (FR-014).
12. On any started card, switch the Sample rate from 60 to 120 Hz.
    **Verify**: the visualization visibly updates faster within
    100 ms — no Stop/Start cycle required (FR-011, SC-006). Switch
    to 30 Hz and verify it slows.

## 2. iOS — permission denied (Story 4, FR-032, SC-009)

1. Open Settings → Spot → toggle Motion & Fitness off (or, on first
   prompt, deny it).
2. Reopen the Sensors Playground screen.
3. **Verify**: the Magnetometer and Device Motion cards each show an
   inline "Permission denied" notice with an "Open Settings" button.
   The Accelerometer and Gyroscope cards remain interactive.
4. Tap "Open Settings". **Verify**: iOS opens the system Settings
   app on Spot's permissions page.
5. Re-grant Motion & Fitness, return to the app. **Verify**: the
   denied notice clears on next mount and Start works.
6. While Magnetometer is Started, in iOS Settings revoke Motion &
   Fitness. **Verify**: the card stops cleanly and switches to the
   denied notice without crashing (FR-033).

## 3. Android (Story 4)

1. Build the dev client for Android and launch on a physical device.
2. Open the Sensors Playground.
3. **Verify**: all four cards render their title, readouts row,
   sample-rate control, and Start button (SC-003).
4. Start each card in turn. Tilt / rotate the device.
   **Verify**: each card's readouts update and visualization
   animates. (Magnetometer requires a magnetometer-equipped device;
   if absent, the card shows the unsupported notice — that's
   acceptable per FR-030.)
5. Verify there is no permission prompt for accelerometer /
   gyroscope (FR-034).

## 4. Web (Story 4, FR-030, FR-035, SC-008)

1. Run `pnpm web` (or whatever the project's web dev server script
   is) and open the URL in Chrome on a desktop without a real
   accelerometer.
2. Navigate to Modules → Sensors Playground.
3. **Verify**: the screen renders with all four cards. Each card's
   title, readouts row, sample-rate control, and Start button are
   visible (SC-003).
4. **Verify**: cards for sensors the browser doesn't expose show a
   "Not supported in this browser" notice with their Start and
   sample-rate controls disabled (FR-030). Magnetometer is the
   guaranteed unsupported case (it is iOS+Android only per
   `expo-sensors`).
5. Open the browser devtools console.
   **Verify**: no runtime errors related to missing sensor APIs
   appear during navigation (SC-008, FR-035).
6. On a mobile Safari + HTTPS context (or via a tunnel), open the
   page on iPhone. Tap Start on Device Motion. **Verify**: the iOS
   Safari permission prompt appears (it must be triggered inside the
   tap gesture). Grant. The readouts update.

## 5. Lifecycle (Edge Cases, FR-036, SC-007)

1. Start all four cards. Press the device's home button (background
   the app).
2. Wait ~5 seconds. Re-open the app.
3. **Verify**: either the cards have automatically resumed and
   readouts are updating, OR they visibly reflect the Stopped state.
   They MUST NOT be in a "Started but not receiving data" zombie
   state (FR-037).
4. Start all cards. Navigate back to the Modules grid.
5. **Verify** (developer): no sensor callbacks fire after navigation
   (instrument with a `console.log` in the hook's listener if
   needed). Memory snapshot shows no leaked subscriptions
   (FR-036, SC-007).

## 6. Stress (Edge Cases)

1. On the Accelerometer card, tap Start / Stop rapidly 20 times.
   **Verify**: no crash, no duplicate readouts, the final state
   matches the final tap (Edge Case "Rapid Start/Stop tapping").
2. On the Magnetometer card, place the phone next to a strong magnet
   or surround with mu-metal foil. **Verify**: the compass needle
   holds its previous direction or renders the "no signal" state
   rather than spinning wildly (Edge Case).

## 7. Quality gates (SC-011, FR-044)

```sh
pnpm check
```

**Verify**: format, lint, typecheck, and Jest all pass with zero
warnings introduced by the new module.

## 8. Additive-only invariant (SC-010)

```sh
git diff --stat main..HEAD -- ':!src/modules/sensors-playground/' ':!test/unit/modules/sensors-playground/' ':!specs/011-sensors-playground/'
```

**Verify**: the only files outside the module / test / spec
directories with diffs are:

- `src/modules/registry.ts` — exactly one import line + one array
  entry
- `package.json` / `pnpm-lock.yaml` — `expo-sensors` added
- `app.json` — `expo-sensors` config plugin entry (motion permission
  string)
