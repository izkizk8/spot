# Quickstart: NSUserActivity / Handoff / Continuity Module

**Feature**: 040-handoff-continuity
**Audience**: developer pulling the branch and validating the module locally

---

## Prerequisites

- Node 20+, pnpm 9+, Xcode 15+ (for iOS prebuild and device run)
- Branch checked out: `git switch 040-handoff-continuity`
- Working tree clean

---

## 1. Install dependencies

```bash
pnpm install
```

No new npm packages are added by this feature — the bridge is hand-written Swift and the plugin uses `@expo/config-plugins` (already in the lockfile).

---

## 2. Run the test suite

```bash
pnpm test                                              # all tests
# or focused
pnpm jest test/unit/modules/handoff-lab
pnpm jest test/unit/plugins/with-handoff
pnpm jest test/unit/plugins/with-mapkit                # plugin-count assertion (now 31)
pnpm jest test/unit/native/handoff.test.ts             # non-iOS bridge throws
```

Expected: all green. The native Swift bridge is mocked at the import boundary (`jest.mock('@/native/handoff', …)`) — no Xcode build is required for the test pass.

---

## 3. Lint

```bash
pnpm lint
```

Expected: zero warnings, zero errors. **Zero `eslint-disable` directives** are permitted in this feature (FR-021 / constitution v1.1.0).

---

## 4. Type-check

```bash
pnpm tsc --noEmit
```

Expected: zero errors.

---

## 5. Prebuild & run on iOS device (cross-device test)

This is the only step that actually exercises Handoff end-to-end. JS-pure tests cover everything else.

```bash
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
npx expo run:ios --device
```

Then on a **second** Apple device (iPad, Mac, or another iPhone):

1. Sign into the **same iCloud account** as the first device.
2. Enable **Handoff** in Settings → General → AirPlay & Handoff (iOS 13+) or General → Handoff (older).
3. Turn on **Bluetooth** on both devices and bring them within ~10 m.
4. Wake both devices (lock-screen counts on iOS).
5. Install the same spot build on the second device (must contain the same `NSUserActivityTypes` entry).
6. On Device A, open the **Handoff & Continuity** lab card → "Become current" with the default activity.
7. On Device B, look for the Handoff hint on the lock screen, app switcher, or Mac Dock.
8. Tap the hint → the spot app launches on Device B → the lab screen's **Incoming Activity Log** gains a new row at the top.

If the hint does not appear, the four runtime conditions (iCloud / Bluetooth / Handoff toggle / both devices awake) are the most common cause — see Setup Instructions card on the lab screen.

---

## 6. Verify Info.plist union-merge

After prebuild, inspect the generated Info.plist:

```bash
plutil -p ios/spot/Info.plist | grep -A 5 NSUserActivityTypes
```

Expected (order may vary depending on plugin run order; both entries MUST be present):

```text
"NSUserActivityTypes" => [
  0 => "spot.showcase.activity"
  1 => "com.izkizk8.spot.activity.handoff-demo"
]
```

Re-running `npx expo prebuild --platform ios` MUST produce a byte-identical Info.plist (idempotency, FR-004).

---

## 7. Smoke check the registry

```bash
pnpm jest test/unit/modules/registry.test.ts
```

Expected: registry contains 1 new entry with `id: 'handoff-lab'`, `platforms: ['ios','android','web']`, `minIOS: '8.0'`.

---

## What is NOT covered by this quickstart

- **Universal Links continuation** — deferred to a follow-up spec (Story 6).
- **State restoration into the navigation stack** — the module surfaces `NSUserActivity` conceptually but does not wire actual restoration (Reality Check #7).
- **Android / Web behaviour** — covered by JS-pure tests (`screen.android.test.tsx`, `screen.web.test.tsx`); on a real device or browser, the module renders an `IOSOnlyBanner` and is non-interactive.
