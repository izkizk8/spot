# Feature Specification: Contacts Module

**Feature Branch**: `038-contacts`
**Feature Number**: 038
**Created**: 2026-04-30
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 9+ educational module showcasing Apple's Contacts framework (CNContactStore) — query, present, pick, create, update, and delete contacts — implemented cross-platform via the `expo-contacts` library. Adds a "Contacts Lab" card to the 006 iOS Showcase registry (`id: 'contacts-lab'`, `platforms: ['ios','android','web']`, `minIOS: '9.0'`). The screen presents interactive cards: Authorization (status + request + settings link), Picker (presents CNContactPickerViewController), Search (query by name), Compose (create new contacts), List & manage (paginated list with edit/delete), and Limited Access UI (iOS 18+ limited-contacts management). Config plugin `plugins/with-contacts/` adds the required Info.plist `NSContactsUsageDescription` key. Branch parent is `037-eventkit`. Additive only: registry +1 entry, `app.json` `plugins` +1.

---

## Contacts Permission Reality Check (READ FIRST)

The Contacts framework is gated by a **single runtime permission entity** managed by iOS:

1. **Contacts access** — `NSContactsUsageDescription` (read/write, iOS 9+).
2. **iOS 18+ Limited Access** — starting in iOS 18, users can grant "limited" access, providing a curated subset of contacts rather than full access. Apps receive an `accessPrivileges` enum: `'all'`, `'limited'`, or `'none'`.

When `accessPrivileges === 'limited'`, the app can:
- Read only the contacts the user selected via the limited-picker UI.
- Re-present the picker via `Contacts.presentLimitedContactsPickerAsync()` (iOS 18+) or fall back to `presentContactPickerAsync()` to let the user expand the subset.
- Cannot enumerate all device contacts via `getContactsAsync()` — the returned list includes only selected contacts.

When access is `denied`, all operations return errors. When `authorized` with `accessPrivileges === 'all'`, the app has full read/write access to all contacts.

Additionally, `expo-contacts` works on iOS, Android, and (with limitations) web. Android handles contacts access via separate runtime permissions; web has no native contacts API and renders an iOS/Android-only banner. The module is registered for `['ios','android','web']` so the educational artifact remains visible everywhere; the web variant degrades gracefully.

This reality check is repeated in the on-screen UI (the `AuthorizationCard` component surfaces the precise status string including "limited" on iOS 18+), in `quickstart.md`, and in the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Request authorization and check status on iOS (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 9+ device, taps the "Contacts Lab" card from the Modules grid, lands on the main screen, and sees the **Authorization** card displaying the current permission status (`notDetermined`, `denied`, `authorized`, or `authorized (limited)` on iOS 18+). They tap "Request Access", approve the system prompt, and see the status update to `authorized`. The Picker, Search, Compose, and List cards become enabled.

**Why this priority**: Authorization is the mandatory first step for any Contacts operation. Without it, the module cannot demonstrate any functionality. P1 because it is the gate to all other scenarios.

**Independent Test**: Build and run the app on an iOS 9+ device with `notDetermined` contacts access. Open the Contacts Lab module, verify the Authorization card shows "notDetermined" with a "Request Access" button. Tap the button, approve the prompt, and verify the card transitions to "authorized" with all other cards enabled.

**Acceptance Scenarios**:

1. **Given** a fresh install on iOS 9+ with `notDetermined` contacts access, **When** the user opens the module, **Then** the Authorization card displays "notDetermined" with a "Request Access" button enabled and an "Open Settings" link hidden.
2. **Given** the user taps "Request Access", **When** the system prompt resolves with approval, **Then** the Authorization card transitions to "authorized" (or "authorized (limited)" on iOS 18+ if the user picked limited access), and all other cards (Picker, Search, Compose, List) become enabled.
3. **Given** the user previously denied access and the status reads "denied", **When** the Authorization card renders, **Then** the "Request Access" button is hidden and an "Open Settings" link is shown that opens the system Settings app via `Linking.openSettings()`.
4. **Given** authorized access, **When** the user taps Refresh in the Authorization card, **Then** `expo-contacts.getPermissionsAsync()` is re-invoked and the card displays the current status string including `accessPrivileges` on iOS 18+.

---

### User Story 2 — Pick a contact using the native picker (Priority: P1)

With `authorized` contacts access, the developer taps the **Picker** card's "Open contact picker" button. The native CNContactPickerViewController appears, they select a contact, and the picker dismisses. The selected contact's name, phone numbers, and email addresses appear below the button.

**Why this priority**: The contact picker is a core iOS Contacts pattern and a key educational demonstration. P1 because it showcases the native UI integration.

**Independent Test**: With authorized access, tap "Open contact picker", select a contact, and verify the picker dismisses and the contact details render below the button (name, phones, emails).

**Acceptance Scenarios**:

1. **Given** authorized contacts access, **When** the user taps "Open contact picker" in the Picker card, **Then** `expo-contacts.presentContactPickerAsync()` is invoked and the native picker appears.
2. **Given** the picker is open, **When** the user selects a contact and dismisses, **Then** the promise resolves with the contact object, and the card renders the contact's `name`, `phoneNumbers`, and `emails` below the button.
3. **Given** the picker is open, **When** the user cancels without selecting, **Then** the promise resolves with `null` and the card shows "No contact selected" or similar.

---

### User Story 3 — Search contacts by name (Priority: P1)

With authorized access, the developer uses the **Search** card: types "Smith" into the text input, taps "Search", and sees a list of matching contacts (name, phone, email) rendered below.

**Why this priority**: Search is a fundamental Contacts operation. P1 because it demonstrates query predicates.

**Independent Test**: With authorized access, type a partial name (e.g., "Smith") into the Search card input, tap Search, and verify matching contacts appear in the results list below.

**Acceptance Scenarios**:

1. **Given** authorized contacts access, **When** the user enters "Smith" and taps Search, **Then** `expo-contacts.getContactsAsync({ name: 'Smith', fields: [...] })` is invoked and matching contacts render with name, phone, email.
2. **Given** no matches are found, **When** the search returns empty, **Then** an empty state message "No contacts found" is shown.
3. **Given** the user clears the input and taps Search again, **When** the query is empty, **Then** no search is executed and the results list remains unchanged or clears.

---

### User Story 4 — Compose and save a new contact (Priority: P1)

With authorized access, the developer fills in the **Compose** card form: given name ("John"), family name ("Doe"), phone ("555-1234"), email ("john@example.com"), organization ("Acme Corp"), and taps Save. The new contact is created in the default contacts group and appears in the **List & manage** card after a refresh.

**Why this priority**: Contact creation is a core CRUD operation. P1 because it demonstrates write access.

**Independent Test**: With authorized access, fill in all fields in the Compose card, tap Save, then refresh the List & manage card and verify the new contact appears.

**Acceptance Scenarios**:

1. **Given** authorized contacts access, **When** the user fills in given name, family name, phone, email, organization and taps Save, **Then** `expo-contacts.addContactAsync({ givenName, familyName, phoneNumbers: [{ number }], emails: [{ email }], company })` is invoked and on success the contact is created.
2. **Given** the Save succeeds, **When** the user taps Refresh in the List card, **Then** the newly created contact appears in the paginated list.
3. **Given** the user submits the form with only givenName filled, **When** Save is tapped, **Then** the contact is created with only givenName set; other fields remain undefined.

---

### User Story 5 — List, view, edit, and delete contacts (Priority: P2)

With authorized access, the developer sees a paginated list of all contacts in the **List & manage** card (name, phone, email). They tap a row, a modal opens showing full contact details. They tap Edit in the modal, modify the name, tap Save, and the row updates. They tap Delete in the modal, confirm the destructive prompt, and the row disappears.

**Why this priority**: List/edit/delete complete the CRUD demonstration. P2 because the create/search/pick flows (Stories 1-4) ship independently; this extends the showcase.

**Independent Test**: With authorized access, tap a contact row, verify the detail modal opens. Tap Edit, modify the name, tap Save, and verify the row updates. Tap Delete, confirm, and verify the row is removed.

**Acceptance Scenarios**:

1. **Given** authorized contacts access, **When** the user taps Refresh in the List card, **Then** `expo-contacts.getContactsAsync({ pageSize: 20, pageOffset: 0, fields: [...] })` is invoked and the first 20 contacts render.
2. **Given** a contact row, **When** the user taps the row, **Then** a modal opens showing full contact details (name, phones, emails, organization).
3. **Given** the detail modal is open, **When** the user taps Edit, **Then** an edit form appears prefilled with the contact's current fields.
4. **Given** the edit form, **When** the user changes the given name and taps Save, **Then** `expo-contacts.updateContactAsync({ id, ...updatedFields })` is invoked and the row reflects the change after refresh.
5. **Given** the detail modal is open, **When** the user taps Delete and confirms the prompt, **Then** `expo-contacts.removeContactAsync(id)` is invoked and the row is removed; cancelling the prompt MUST NOT call delete.

---

### User Story 6 — Limited Access UI (iOS 18+) (Priority: P3)

On an iOS 18+ device, if the user granted `limited` access, the **Limited Access Banner** appears at the top of the screen with a "Manage selected contacts" button. Tapping it re-presents the limited-contacts picker via `Contacts.presentLimitedContactsPickerAsync()` (or falls back to `presentContactPickerAsync()` if unavailable), allowing the user to add or remove contacts from the accessible subset.

**Why this priority**: Limited access is an iOS 18+ feature. P3 because it's a newer API and only applies to a subset of users; the module functions fully without it.

**Independent Test**: On iOS 18+, grant limited access (select only 2 contacts). Verify the Limited Access Banner appears with "Manage selected contacts" button. Tap it, verify the picker opens allowing the user to modify the selection.

**Acceptance Scenarios**:

1. **Given** authorized contacts access with `accessPrivileges === 'limited'` on iOS 18+, **When** the module renders, **Then** a Limited Access Banner is shown at the top with "Manage selected contacts" button.
2. **Given** the user taps "Manage selected contacts", **When** `expo-contacts.presentLimitedContactsPickerAsync()` is available, **Then** it is invoked; otherwise `presentContactPickerAsync()` is used as fallback.
3. **Given** the limited picker resolves, **When** the user modifies the selection and dismisses, **Then** the List & manage card re-fetches contacts and reflects the updated subset.

---

### User Story 7 — Cross-platform graceful degradation (Priority: P3)

A developer running the showcase on Android opens the Contacts Lab module and sees the same card structure with Authorization working against Android's runtime contacts permissions. All operations (picker, search, compose, list, edit, delete) function via `expo-contacts`'s Android implementation. A developer running on web opens the module and sees an `IOSOnlyBanner` with all interactive controls disabled.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact. Android can exercise the full contacts API via `expo-contacts`; web has no contacts API.

**Independent Test**: Run the app on Android — verify all cards work end-to-end via `expo-contacts`'s Android implementation (except limited-access, which is iOS 18+ only). Run on web — verify the IOSOnlyBanner is shown and all controls are disabled.

**Acceptance Scenarios**:

1. **Given** the app is running on Android, **When** the user opens the module, **Then** Authorization, Picker, Search, Compose, and List cards all function via `expo-contacts`'s Android implementation.
2. **Given** the app is running on Android, **When** the Limited Access Banner logic checks `accessPrivileges`, **Then** the banner is hidden (limited access is iOS 18+ only).
3. **Given** the app is running on web, **When** the user opens the module, **Then** an `IOSOnlyBanner` is shown, all cards render with disabled controls, and no native bridge calls are made.

---

### Edge Cases

1. **iOS 9-17 without `accessPrivileges`**: `getPermissionsAsync()` returns `{ status, canAskAgain }` without `accessPrivileges`. The module must treat `accessPrivileges === undefined` as "not limited" (i.e., full access if `status === 'granted'`).
2. **Denied after initial grant**: If the user revokes permission in Settings, the module must re-fetch status on resume/focus and update the Authorization card to show "denied" with the "Open Settings" link.
3. **Empty contacts database**: If the device has zero contacts, `getContactsAsync()` returns `{ data: [], hasNextPage: false }`. The List card must show an empty state "No contacts found" instead of an error.
4. **Partial contact fields**: Not all contacts have all fields (some lack phone, email, organization). The UI must handle `undefined` gracefully by rendering empty strings or "N/A".
5. **Picker cancellation**: If the user cancels the picker without selecting, `presentContactPickerAsync()` resolves with `null`. The Picker card must handle this and show "No contact selected".
6. **Limited access on iOS 17 and below**: On iOS 17-, `accessPrivileges` is undefined. The Limited Access Banner must never render on these versions.
7. **Search with no query**: If the user taps Search with an empty input, the module should either no-op or show a validation message.
8. **Pagination exhaustion**: If the user scrolls to the end of the contact list and `hasNextPage === false`, the "Load More" button must be disabled or hidden.

---

## Success Criteria

1. **Authorization Flow**: The Authorization card accurately reflects the current permission status (`notDetermined`, `denied`, `authorized`, `authorized (limited)` on iOS 18+), allows requesting access, and provides a Settings link when denied.
2. **Picker Integration**: The Picker card successfully invokes the native contact picker via `expo-contacts.presentContactPickerAsync()`, handles selection and cancellation, and displays the picked contact's details.
3. **Search Functionality**: The Search card queries contacts by name using `expo-contacts.getContactsAsync({ name })` and renders matching results.
4. **Compose/Create**: The Compose card creates new contacts via `expo-contacts.addContactAsync()` and they appear in the List card after refresh.
5. **List/Edit/Delete**: The List card paginates contacts via `getContactsAsync({ pageSize, pageOffset })`, tapping a row opens a detail modal, Edit modifies a contact via `updateContactAsync()`, and Delete removes a contact via `removeContactAsync()`.
6. **Limited Access (iOS 18+)**: When `accessPrivileges === 'limited'`, the Limited Access Banner appears with a "Manage selected contacts" button that re-presents the limited picker.
7. **Cross-platform**: On iOS, all features work. On Android, all features work via `expo-contacts`'s Android implementation (except iOS 18+ limited-access). On web, an IOSOnlyBanner is shown with all controls disabled.
8. **Test Coverage**: All components, hooks, and formatters have Jest + RNTL tests with full mocking of `expo-contacts`. The test suite passes green with zero `eslint-disable` directives.
9. **Quality Gate**: `pnpm check` passes green (lint, format, typecheck, tests) before commit.

---

## Out of Scope

1. **Recents / Favorites**: The module does not implement "Recents" or "Favorites" contact lists (iOS-specific APIs not exposed by `expo-contacts`).
2. **Contact Photos**: The module does not handle contact photos or image uploads.
3. **Custom Contact Fields**: The module only demonstrates the basic fields exposed by `expo-contacts` (name, phone, email, organization). Custom fields (e.g., instant messaging handles, social profiles) are not included.
4. **Unified Contacts**: The module does not demonstrate unified contacts (merging multiple CNContact records). Each contact is treated as a discrete entity.
5. **Group Management**: The module does not expose contact groups or smart groups (iOS-specific and not fully exposed by `expo-contacts`).
6. **Vcard Import/Export**: No vCard (.vcf) import or export functionality.
7. **Address Book (Deprecated)**: No use of the deprecated AddressBook.framework (pre-iOS 9). The module targets iOS 9+ and uses CNContactStore exclusively.

---

## Assumptions

1. **`expo-contacts` Availability**: The `expo-contacts` library is installed and configured in the project. On iOS, it wraps `CNContactStore`. On Android, it uses Android's `ContactsContract`. On web, it throws or no-ops gracefully.
2. **Config Plugin**: The `plugins/with-contacts/` plugin is registered in `app.json` and adds `NSContactsUsageDescription` to the Info.plist. This is required for iOS to prompt for permission.
3. **iOS 9+ Runtime**: The module targets iOS 9+ where `CNContactStore` is available. On older iOS versions, the module would crash or be unavailable.
4. **iOS 18+ Limited Access**: The `accessPrivileges` field is only present on iOS 18+. On iOS 17-, `accessPrivileges` is `undefined`, and the module treats this as "not limited".
5. **Picker Availability**: `expo-contacts.presentContactPickerAsync()` is available on iOS and Android. On web, it throws or no-ops, and the Picker card is disabled via the IOSOnlyBanner.
6. **Limited Picker Fallback**: `expo-contacts.presentLimitedContactsPickerAsync()` is an iOS 18+ API. If unavailable, the module falls back to `presentContactPickerAsync()`.
7. **Default Contacts Group**: When creating a contact via `addContactAsync()`, `expo-contacts` adds it to the default contacts container. The module does not expose group selection.
8. **Permission Re-fetch on Focus**: The module re-fetches permission status when the screen focuses (via `useFocusEffect` or similar) to catch changes made in Settings.
9. **No Native Code Changes**: The module is fully JS-land except for the config plugin. No Swift or Kotlin code is written by hand.
10. **Test Environment**: All tests run in Jest with `expo-contacts` fully mocked. No native runtime is required for testing.

---

## Dependencies

1. **expo-contacts**: Primary dependency for all contacts operations. Provides `getPermissionsAsync`, `requestPermissionsAsync`, `getContactsAsync`, `getContactByIdAsync`, `addContactAsync`, `updateContactAsync`, `removeContactAsync`, `presentContactPickerAsync`, `presentLimitedContactsPickerAsync`, `Fields`, `PermissionStatus`, `ContactType`, `SortTypes`.
2. **expo-linking**: Used for `Linking.openSettings()` when permission is denied.
3. **react-navigation (expo-router)**: For screen navigation and focus effects.
4. **@expo/config-plugins**: For the `plugins/with-contacts/` config plugin.
5. **Jest + @testing-library/react-native**: For unit tests.

---

## Rollout Plan

**Phase 1: Scaffolding (T001-T010)**
- Create directory structure `src/modules/contacts-lab/`
- Create `index.tsx` (manifest), `formatters.ts`, `hooks/useContacts.ts`
- Create `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`
- Create all component stubs: `AuthorizationCard`, `PickerCard`, `SearchCard`, `ComposeCard`, `ContactsList`, `ContactRow`, `ContactDetailModal`, `LimitedAccessBanner`, `IOSOnlyBanner`
- Create config plugin `plugins/with-contacts/` with test
- Add `expo-contacts` dependency to `package.json` (do not run `pnpm install` until after commit)

**Phase 2: TDD Implementation (T011-T040)**
- Write tests for `formatters.test.ts` → implement formatters
- Write tests for `useContacts.test.tsx` → implement hook (auth, list, search, CRUD, refresh, limited-access handling)
- Write tests for all components → implement components
- Write tests for all screen variants → implement screens
- Write test for plugin → verify plugin logic

**Phase 3: Integration (T041-T045)**
- Update `src/data/moduleRegistry.ts` to add `contactsLab` entry (append last)
- Update `app.json` plugins array to add `./plugins/with-contacts` (append last)
- Verify `pnpm check` passes green
- Run `pnpm format` to apply formatting
- Commit with proper message and trailer

**Phase 4: Verification (T046-T050)**
- Run full test suite and verify new tests pass
- Verify no `eslint-disable` directives exist in any new files
- Verify `pnpm typecheck` passes
- Verify `pnpm lint` passes
- Generate final summary report

---

## Open Questions *(none — approved autonomously)*

All design decisions have been made based on the prior EventKit module (037) structure and patterns. No clarifications are needed.

---

**End of Specification**
