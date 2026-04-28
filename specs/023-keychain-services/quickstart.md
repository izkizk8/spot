# Quickstart — 023 Keychain Services Lab

Manual + scripted verification steps for the Keychain Lab module.
Use after `pnpm install` and before opening a PR.

## Prerequisites

- Node + pnpm installed; `pnpm install` already run.
- For the full extended path: a custom dev client built with the
  `with-keychain-services` plugin enabled (Expo Go cannot exercise
  the Swift bridge — the fallback path runs instead, with the
  documented capability reduction).
- Xcode 15+ available locally if you intend to run the iOS dev
  client.

## 1. Static checks

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

All four MUST be green. The new tests under
`test/unit/modules/keychain-lab/`,
`test/unit/native/keychain.test.ts`, and
`test/unit/plugins/with-keychain-services/` MUST be in the
`pnpm test` output and the total suite/test counts MUST grow
strictly compared to feature 022 (SC-003).

## 2. Verify the additive contract

```sh
# registry has exactly one new import + one new array entry
git diff main..HEAD -- src/modules/registry.ts | grep '^+' | wc -l
# expected: 4   (file header line + import line + array entry line +
# trailing newline)

# app.json plugins grew by exactly one entry
node -e "console.log(require('./app.json').expo.plugins.length)"
# expected: 12   (was 11 before this feature; SC-004)

# every prior plugin entry is unchanged
git diff main..HEAD -- app.json | grep -E '^[-+].*plugins/with-' | \
  grep -v 'with-keychain-services'
# expected: empty
```

## 3. Verify the manifest

```sh
node -e "
const r = require('./src/modules/registry').MODULES;
const m = r.filter(x => x.id === 'keychain-lab');
if (m.length !== 1) { console.error('manifest missing or duplicated'); process.exit(1); }
const x = m[0];
if (x.label !== 'Keychain Lab') process.exit(2);
if (JSON.stringify(x.platforms) !== JSON.stringify(['ios','android','web'])) process.exit(3);
if (x.minIOS !== '8.0') process.exit(4);
console.log('manifest OK');
"
```

## 4. iOS — basic path (Expo Go OK)

1. Launch the app in Expo Go (or any dev client).
2. Open the **Keychain Lab** card from the registry list.
3. The Items List shows the empty-state placeholder ("No keychain
   items yet — tap Add item to create one").
4. Tap **Add item**, fill `label = "demo"`, `value = "hello"`,
   leave the picker at `whenUnlockedThisDeviceOnly`, leave biometry
   off, tap **Save**.
5. The form collapses, the Items List re-renders one row labelled
   `"demo"` with the class label `"When Unlocked (this device only)"`
   and **no** biometry badge.
6. Tap **Show** → the value `"hello"` appears inline; the button
   becomes **Hide**.
7. Tap **Delete** → the row disappears, the empty-state placeholder
   reappears.

## 5. iOS — biometry-bound (custom dev client)

1. In a custom dev client built with the `with-keychain-services`
   plugin and biometry enrolled in the simulator/device:
2. Add another item with biometry **on**.
3. The new row shows the **🔒 biometry** badge.
4. Tap **Show** → the system biometric prompt appears; on
   success the value is revealed; on cancel the row collapses
   back to hidden state with an inline informational message
   (no error toast, no `console.error`).

## 6. iOS — accessibility-class lifecycle

1. Add an item with class `whenPasscodeSetThisDeviceOnly` on a
   simulator with **no** passcode set.
2. The Save action surfaces a friendly inline error
   (`"Passcode required: this accessibility class requires a
   device passcode to be set."`); the item is **not** written.
3. Repeat on a device with a passcode set — Save succeeds.

## 7. iOS — access-group probe

- **In Expo Go / unsigned simulator**: tap **Try shared keychain**
  → the card surfaces the "needs entitlement" copy and the resolved
  group string. No exception, no `console.error`.
- **In a signed dev-client build with the entitlement**: tap **Try
  shared keychain** → the card surfaces
  `"✅ Shared keychain OK (read 26 bytes from group <prefix>)"`.

## 8. Android

1. Open the **Keychain Lab** card.
2. The Items List + Add item form work identically to the iOS
   basic path.
3. The accessibility-class picker is rendered **disabled** with the
   note `"Android Keystore default"`.
4. The **Access Group** card is **hidden**.
5. Adding an item with biometry on triggers the system
   `BiometricPrompt`.

## 9. Web

1. Open the **Keychain Lab** card.
2. The screen renders only the **iOS-only** banner; every form
   field and button is disabled.
3. The bridge is not invoked (verified at unit-test time).

## 10. Negative paths (test-only)

The following are exercised by the JS test suite and do not need
manual reproduction:

- `errSecUserCanceled` (-128) on Show → row stays hidden, inline
  informational message, no `console.error` / `console.warn`.
- `errSecAuthFailed` (-25293) → inline informational message.
- `errSecItemNotFound` (-25300) on Show or Delete → row removed
  from the metadata index, no error.
- `errSecMissingEntitlement` (-34018) on the access-group probe →
  "needs entitlement" copy.
- `errSecDuplicateItem` (-25299) → upgraded to update; never
  surfaces to the UI.

## 11. Pass criteria

- All static checks (§1) green.
- Additive contract holds (§2).
- Manifest shape correct (§3).
- iOS basic path (§4) works in Expo Go.
- iOS extended paths (§5–§7) work in a custom dev client.
- Android (§8) and Web (§9) behave as documented.
- Zero `console.error` and zero `console.warn` produced by
  cancellation / not-found / missing-entitlement paths
  (SC-005); informational inline messages instead.
