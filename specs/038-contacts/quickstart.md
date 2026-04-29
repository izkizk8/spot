# Quickstart — Contacts Module (038)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the on-device verification checklist for feature 038. JS-pure tests (run via `pnpm check`) cover every assertion that does not require real Contacts hardware; this checklist covers the remainder.

---

## §1 — JS-pure verification (Windows / macOS / Linux)

Run from the repository root:

```sh
pnpm install
pnpm check
```

Expected:

- Lint: 0 errors, 0 warnings, **0 `eslint-disable` directives** in any file under `src/modules/contacts-lab/`, `plugins/with-contacts/`, or the new test directories.
- Typecheck: green under TypeScript strict mode.
- Tests: all 18+ new suites enumerated in `spec.md` pass; the baseline grows by ≥ 18 suites versus 037's closing total.
- Format: `pnpm format` is a no-op.

---

## §2 — Smoke verification of the config plugin

Run a fresh `expo prebuild` against a clean checkout:

```sh
git clean -xfd ios android
npx expo prebuild --platform ios --clean
```

Verify the generated `ios/<app>/Info.plist`:

```sh
plutil -p ios/*/Info.plist | grep NSContactsUsageDescription
```

Expected output:

```
"NSContactsUsageDescription" => "This module demonstrates Contacts access for educational purposes."
```

Re-run `npx expo prebuild --platform ios` (without `--clean`). Expected: Info.plist diff is empty (idempotency).

---

## §3 — On-device iOS verification (iOS 9+, ideally also iOS 18+)

Run on an iOS device or simulator:

```sh
npx expo run:ios
```

### §3.1 — Authorization, fresh permission

1. Open the Contacts Lab module from the registry.
2. Verify the Authorization card shows "notDetermined" with a "Request Access" button.
3. Tap "Request Access", approve the system prompt.
4. Verify the card transitions to "authorized" (or "limited" on iOS 18+ if you picked limited access).
5. Verify all other cards (Picker, Search, Compose, List) become enabled.

### §3.2 — Contact picker

1. Tap "Open contact picker" in the Picker card.
2. Select a contact from the native picker.
3. Verify the picker dismisses and the contact's name, phone numbers, and emails appear below the button.
4. Tap "Open contact picker" again, cancel without selecting.
5. Verify "No contact selected" or similar message appears.

### §3.3 — Search

1. In the Search card, type a partial name (e.g., "Smith").
2. Tap "Search".
3. Verify matching contacts appear in the results list below (name, phone, email).
4. Clear the input, tap "Search" again.
5. Verify the search either no-ops or shows "No contacts found".

### §3.4 — Compose / create

1. In the Compose card, fill in: given name = "John", family name = "Doe", phone = "555-1234", email = "john@example.com", organization = "Acme Corp".
2. Tap "Save".
3. Verify the form clears and a success message appears.
4. In the List & manage card, tap "Refresh".
5. Verify "John Doe" appears in the paginated list.

### §3.5 — List / view / edit / delete

1. In the List & manage card, tap the "John Doe" row.
2. Verify a modal opens showing full contact details.
3. Tap "Edit", change the given name to "Jane", tap "Save".
4. Verify the row updates to "Jane Doe" after refresh.
5. Tap the row again, tap "Delete", confirm the prompt.
6. Verify the row disappears.

### §3.6 — Limited access (iOS 18+ only)

1. On iOS 18+, delete the app, reinstall, and grant "limited" access (select only 2 contacts).
2. Verify the Authorization card shows "authorized (limited)".
3. Verify the Limited Access Banner appears at the top with "Manage selected contacts" button.
4. Tap the button.
5. Verify the limited-contacts picker appears (or the standard picker as fallback on older `expo-contacts`).
6. Add 1 more contact to the selection, dismiss.
7. Verify the List card refreshes and now shows 3 contacts.

---

## §4 — On-device Android verification

Run on an Android device or emulator:

```sh
npx expo run:android
```

### §4.1 — Authorization & list

1. Open the Contacts Lab module.
2. Tap "Request Access", approve the Android permission prompt.
3. Verify the Authorization card shows "authorized".
4. Verify the Picker, Search, Compose, and List cards all function.
5. Verify the Limited Access Banner does NOT appear (iOS 18+ only).

---

## §5 — Web verification

Run on web:

```sh
npx expo start --web
```

1. Open the Contacts Lab module.
2. Verify the IOSOnlyBanner is shown.
3. Verify all cards render with disabled controls.
4. Verify no native bridge calls are made (no console errors about `expo-contacts` being unavailable).

---

**End of Quickstart**
