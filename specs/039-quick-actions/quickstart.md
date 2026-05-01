# Quickstart: Quick Actions Module

**Feature**: 039-quick-actions
**Audience**: developer pulling the branch and validating the module locally

---

## Prerequisites

- Node 20+, pnpm 9+, Xcode 15+ (for iOS build)
- Branch checked out: `git switch 039-quick-actions`
- Working tree clean

## 1. Install dependencies

```bash
pnpm install
npx expo install expo-quick-actions   # 6.0.1, peer expo:* — already in package.json after this feature lands
```

## 2. Run the test suite

```bash
pnpm test                # all tests, jest --runInBand
# or focused
pnpm jest test/unit/modules/quick-actions-lab
pnpm jest test/unit/plugins/with-quick-actions
pnpm jest test/unit/plugins/with-mapkit            # plugin-count assertion (now 30)
```

Expected: all green; ~35 new tests across the module + plugin.

## 3. Type-check, lint, format

```bash
pnpm check               # typecheck + lint + format + tests
```

Expected: zero errors. **Verify zero `eslint-disable`** in new files:

```bash
git diff --stat 038-contacts.. -- 'src/modules/quick-actions-lab/**' 'plugins/with-quick-actions/**' \
  | xargs grep -l 'eslint-disable' && echo "VIOLATION" || echo "OK"
```

## 4. Build & install on iOS device

The Quick Actions feature requires a real device launch (or simulator with
Home Screen access) to validate the long-press menu.

```bash
npx expo prebuild --clean      # regenerates ios/ from app.json + plugins
npx expo run:ios --device       # build & install on connected device
```

After install **close the app fully** (the Home Screen menu only appears
when the app is not in the foreground).

## 5. Verify static actions (Story 1 / SC-1)

1. Long-press the spot app icon on the iOS Home Screen.
2. Verify exactly **4 menu rows** in this order:
   1. **Open Liquid Glass** — _Material playground_ — `drop.fill`
   2. **Open Sensors** — _Motion & device data_ — `gauge`
   3. **Open Audio Lab** — _Recording demo_ — `mic.fill`
   4. **Add Mood: Happy** — _Quick journal entry_ — `face.smiling`

> **The 4-item cap**: iOS shows at most 4 shortcut items, **combined** for
> static + dynamic. Static items are shown first; dynamic fills remaining
> slots. Until you reduce statics (rebuild) or use the "Pretend N statics"
> toggle in the Lab, you cannot add a dynamic action because the cap is
> already full.

## 6. Verify routing (Story 6 / SC-2)

For each of the 4 defaults: long-press → tap row → verify the app opens
on the matching route:

| Action | Expected route |
|---|---|
| Open Liquid Glass | `/modules/liquid-glass-playground` |
| Open Sensors | `/modules/sensors-playground` |
| Open Audio Lab | `/modules/audio-lab` |
| Add Mood: Happy | `/modules/app-intents-lab` |

**Cold-launch**: terminate the app, long-press, pick → routes via
`router.replace()`.
**Warm-launch**: app backgrounded, long-press, pick → routes via
`router.navigate()`.

## 7. Verify dynamic management (Story 3 / SC-3)

1. Open the modules grid → tap **Quick Actions** card.
2. Scroll to **Dynamic Actions Manager**.
3. Toggle **"Pretend 2 statics"**.
4. Tap **"Add dynamic action"** twice; fill each form with a unique
   `title`, `subtitle`, `iconName` (e.g. `star.fill`), and a route
   (e.g. `/modules/haptics-playground`).
5. Verify both rows appear in the dynamic list.
6. Tap the down-arrow on the first; verify reorder.
7. Tap remove on a row; confirm; verify the row is gone.
8. Toggle "Pretend 4 statics"; verify the **Add** button is disabled and
   tapping shows the cap banner.

## 8. Verify last-invoked card (Story 4 / SC-4)

1. Terminate the app.
2. Long-press → **Add Mood: Happy**.
3. App cold-launches into `/modules/app-intents-lab`.
4. Navigate to **Quick Actions** lab.
5. Last Invoked Action card shows
   `{ type: 'add-mood-happy', userInfo: { route: '/modules/app-intents-lab', mood: 'happy' }, timestamp: <ISO> }`.
6. Background the app, long-press → pick a different action, foreground.
   Verify the card updates within 1 second.

## 9. Verify reset (Story 5 / SC-5)

1. With 1+ dynamic actions present, tap **"Restore default static actions only"**.
2. Confirm prompt → dynamic list clears, statics unaffected.
3. Cancel a second prompt → no-op.

## 10. Verify cross-platform graceful degradation (Story 7 / SC-6)

```bash
npx expo start --android   # or run on web
```

On Android & Web: open the **Quick Actions** module → verify
`IOSOnlyBanner` is shown, all interactive controls are disabled or
absent, no native bridge calls fire (test logs / no errors).

## 11. Verify plugin idempotency (SC-7)

```bash
npx expo prebuild --clean
diff <(plutil -p ios/spot/Info.plist) /tmp/info-pass-1.txt   # capture pass 1
npx expo prebuild --clean
diff <(plutil -p ios/spot/Info.plist) /tmp/info-pass-1.txt   # diff = empty
```

Expected: byte-identical `UIApplicationShortcutItems` after running prebuild
twice (no duplicate / reordered entries).

## 12. Verify additive-only diff (FR-016)

```bash
git diff 038-contacts.. --name-only
```

Expected files (new):

- `src/modules/quick-actions-lab/**`
- `plugins/with-quick-actions/**`
- `test/unit/modules/quick-actions-lab/**`
- `test/unit/plugins/with-quick-actions/**`
- `specs/039-quick-actions/**`

Expected files (modified — exactly these three, additive lines only):

- `src/modules/registry.ts`        (one import + one entry)
- `app.json`                        (one `plugins[]` entry, 29 → 30)
- `test/unit/plugins/with-mapkit/index.test.ts` (29 → 30 number bump)
- `package.json` + `pnpm-lock.yaml` (the `expo-quick-actions` install)
- `.github/copilot-instructions.md` (SPECKIT block plan reference bump)

No edits to other module files.

---

## Done

If steps 5–12 all pass, the feature satisfies SC-1 through SC-11 in the
spec. Hand off to `/speckit.tasks` for the dependency-ordered task list.
