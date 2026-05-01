---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; CNContactStore works in custom dev client)
  - iPhone running iOS 9+
  - Apple Developer account (free tier sufficient)
---

# How to verify Contacts on iPhone

## Goal
Confirm CNContactStore requests contacts permission, lists contacts with fetch
predicates, creates and saves a new contact, and correctly handles partial data
from the descriptor key set.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `with-contacts` plugin registered in `app.json` (adds `NSContactsUsageDescription`)
- At least a few contacts on the device or synced via iCloud

## Steps
1. Build the JS layer:
   ```bash
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Contacts"** in the Modules tab.
5. Tap **Request Contacts Access** — grant access.
6. Confirm a list of contacts renders (name, email, phone where available).
7. Tap **Search** → type a partial name → confirm filtered results update in real time.
8. Tap **Add Contact** → enter first name "Test", last name "Spot", phone "+10000000000"
   → **Save** → confirm the row appears in the list.
9. Tap the new row → confirm the detail sheet shows all three fields.
10. Tap **Delete** on the test contact → confirm row removed; open native Contacts
    app to confirm deletion.

## Verify
- Contacts permission prompt appears with app-specific description
- Contact list renders with name and at least one field (email/phone)
- Search filters contacts in real time
- New contact created, appears in-app and native Contacts app
- Deleted contact removed from both views
- On Android: Android ContactsContract equivalent tested

## Troubleshooting
- **Empty contacts list after permission** → ensure contacts exist on the device;
  simulator has sample contacts; also check that `CNContactDescriptor` keys include
  `CNContactPhoneNumbersKey`, `CNContactEmailAddressesKey`
- **Permission denied on first request** → if previously denied, direct the user to
  Settings → Privacy → Contacts → Spot to re-enable
- **Save fails with "identifier already exists"** → generating a new `CNMutableContact`
  without an identifier before `save()` should avoid this; check bridge implementation

## Implementation references
- Spec: `specs/038-contacts/spec.md`
- Plan: `specs/038-contacts/plan.md`
- Module: `src/modules/contacts-lab/`
- Native bridge: `src/native/contacts.ts`
- Plugin: `plugins/with-contacts/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows