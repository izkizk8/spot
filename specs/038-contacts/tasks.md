# Tasks — Contacts Module (038)

**Branch**: `038-contacts` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Scaffolding (T001-T010)

### T001 — Add expo-contacts dependency
- Run `pnpm add expo-contacts`
- Verify package.json includes `expo-contacts`
- **Dependencies**: None
- **Status**: [x]

### T002 — Create module directory structure
- Create `src/modules/contacts-lab/`
- Create `src/modules/contacts-lab/hooks/`
- Create `src/modules/contacts-lab/components/`
- **Dependencies**: None
- **Status**: [x]

### T003 — Create formatters.ts stub
- Create `src/modules/contacts-lab/formatters.ts`
- Add phone/email normalization helper stubs
- **Dependencies**: T002
- **Status**: [x]

### T004 — Create types.ts
- Create `src/modules/contacts-lab/types.ts`
- Define `AuthorizationStatus`, `Contact`, `ContactInput`, `ContactsState` types
- **Dependencies**: T002
- **Status**: [x]

### T005 — Create useContacts hook stub
- Create `src/modules/contacts-lab/hooks/useContacts.ts`
- Add stub hook returning minimal state
- **Dependencies**: T002, T004
- **Status**: [x]

### T006 — Create component stubs
- Create all 9 component files under `src/modules/contacts-lab/components/`
- Each returns a minimal `<ThemedView>` stub
- **Dependencies**: T002
- **Status**: [x]

### T007 — Create screen variants stubs
- Create `src/modules/contacts-lab/screen.tsx`
- Create `src/modules/contacts-lab/screen.android.tsx`
- Create `src/modules/contacts-lab/screen.web.tsx`
- **Dependencies**: T002, T006
- **Status**: [x]

### T008 — Create manifest index.tsx
- Create `src/modules/contacts-lab/index.tsx`
- Export manifest with `id: 'contacts-lab'`, `label`, `platforms: ['ios','android','web']`, `minIOS: '9.0'`
- **Dependencies**: T002, T007
- **Status**: [x]

### T009 — Create plugin directory
- Create `plugins/with-contacts/`
- Create `plugins/with-contacts/index.ts` stub
- **Dependencies**: None
- **Status**: [x]

### T010 — Create test directory structure
- Create `test/unit/modules/contacts-lab/`
- Create `test/unit/modules/contacts-lab/hooks/`
- Create `test/unit/modules/contacts-lab/components/`
- **Dependencies**: None
- **Status**: [x]

---

## Phase 2: TDD — Formatters & Plugin (T011-T015)

### T011 — Write formatters tests (RED)
- Create `test/unit/modules/contacts-lab/formatters.test.ts`
- Test phone normalization, email normalization, edge cases
- **Dependencies**: T010, T003
- **Status**: [x]

### T012 — Implement formatters (GREEN)
- Implement `formatPhoneNumber`, `formatEmail` in `formatters.ts`
- All tests pass
- **Dependencies**: T011
- **Status**: [x]

### T013 — Write plugin tests (RED)
- Create `plugins/with-contacts/index.test.ts`
- Test `NSContactsUsageDescription` addition, idempotency, coexistence with prior plugins
- **Dependencies**: T009
- **Status**: [x]

### T014 — Implement plugin (GREEN)
- Implement `plugins/with-contacts/index.ts` using `withInfoPlist` mod
- All tests pass
- **Dependencies**: T013
- **Status**: [x]

### T015 — Write manifest test (RED)
- Create `test/unit/modules/contacts-lab/manifest.test.ts`
- Test manifest contract (id, label, platforms, minIOS)
- **Dependencies**: T010, T008
- **Status**: [x]

---

## Phase 3: TDD — Hook (T016-T025)

### T016 — Write useContacts auth tests (RED)
- Create `test/unit/modules/contacts-lab/hooks/useContacts.test.tsx`
- Test authorization flow: initial mount, requestPermissions, denied/authorized/limited paths
- Mock `expo-contacts.getPermissionsAsync`, `requestPermissionsAsync`
- **Dependencies**: T010, T005
- **Status**: [x]

### T017 — Implement useContacts auth (GREEN)
- Implement authorization logic in `useContacts.ts`
- Auth tests pass
- **Dependencies**: T016
- **Status**: [x]

### T018 — Write useContacts list tests (RED)
- Test `refresh`, `loadMore`, pagination (`hasNextPage`, `pageOffset`)
- Mock `expo-contacts.getContactsAsync`
- **Dependencies**: T016
- **Status**: [x]

### T019 — Implement useContacts list (GREEN)
- Implement `refresh`, `loadMore`, pagination logic
- List tests pass
- **Dependencies**: T018
- **Status**: [x]

### T020 — Write useContacts search tests (RED)
- Test `search(name)`, empty query, no results
- Mock `expo-contacts.getContactsAsync({ name })`
- **Dependencies**: T016
- **Status**: [x]

### T021 — Implement useContacts search (GREEN)
- Implement `search` function
- Search tests pass
- **Dependencies**: T020
- **Status**: [x]

### T022 — Write useContacts CRUD tests (RED)
- Test `addContact`, `updateContact`, `removeContact`, `getContactById`
- Test serialization (double-create prevented)
- Mock `expo-contacts.addContactAsync`, `updateContactAsync`, `removeContactAsync`, `getContactByIdAsync`
- **Dependencies**: T016
- **Status**: [x]

### T023 — Implement useContacts CRUD (GREEN)
- Implement CRUD functions with promise chain serialization
- CRUD tests pass
- **Dependencies**: T022
- **Status**: [x]

### T024 — Write useContacts picker tests (RED)
- Test `presentContactPicker`, `presentLimitedContactsPicker`
- Test picker cancellation (null result)
- Mock `expo-contacts.presentContactPickerAsync`, `presentLimitedContactsPickerAsync`
- **Dependencies**: T016
- **Status**: [x]

### T025 — Implement useContacts picker (GREEN)
- Implement picker functions with fallback for limited-picker
- Picker tests pass
- **Dependencies**: T024
- **Status**: [x]

---

## Phase 4: TDD — Components (T026-T040)

### T026 — Write AuthorizationCard test (RED)
- Test rendering for each status (notDetermined, denied, authorized, limited)
- Test "Request Access" button, "Open Settings" link
- **Dependencies**: T010, T006
- **Status**: [x]

### T027 — Implement AuthorizationCard (GREEN)
- Implement component with status-based rendering
- Test passes
- **Dependencies**: T026
- **Status**: [x]

### T028 — Write PickerCard test (RED)
- Test "Open contact picker" button, contact display after selection
- **Dependencies**: T010, T006
- **Status**: [x]

### T029 — Implement PickerCard (GREEN)
- Implement component with picker integration
- Test passes
- **Dependencies**: T028
- **Status**: [x]

### T030 — Write SearchCard test (RED)
- Test search input, "Search" button, results display
- **Dependencies**: T010, T006
- **Status**: [x]

### T031 — Implement SearchCard (GREEN)
- Implement component with search form and results
- Test passes
- **Dependencies**: T030
- **Status**: [x]

### T032 — Write ComposeCard test (RED)
- Test form fields (givenName, familyName, phone, email, organization), Save button
- **Dependencies**: T010, T006
- **Status**: [x]

### T033 — Implement ComposeCard (GREEN)
- Implement component with form and validation
- Test passes
- **Dependencies**: T032
- **Status**: [x]

### T034 — Write ContactsList test (RED)
- Test contact rows rendering, "Load More" button, pagination
- **Dependencies**: T010, T006
- **Status**: [x]

### T035 — Implement ContactsList (GREEN)
- Implement component with pagination
- Test passes
- **Dependencies**: T034
- **Status**: [x]

### T036 — Write ContactRow test (RED)
- Test row display (name, phone, email), tap handler
- **Dependencies**: T010, T006
- **Status**: [x]

### T037 — Implement ContactRow (GREEN)
- Implement component
- Test passes
- **Dependencies**: T036
- **Status**: [x]

### T038 — Write ContactDetailModal test (RED)
- Test modal display, Edit button, Delete button, Save/Cancel
- **Dependencies**: T010, T006
- **Status**: [x]

### T039 — Implement ContactDetailModal (GREEN)
- Implement component with edit/delete actions
- Test passes
- **Dependencies**: T038
- **Status**: [x]

### T040 — Write LimitedAccessBanner and IOSOnlyBanner tests (RED)
- Test LimitedAccessBanner rendering when `accessPrivileges === 'limited'`
- Test IOSOnlyBanner on web
- **Dependencies**: T010, T006
- **Status**: [x]

### T041 — Implement LimitedAccessBanner and IOSOnlyBanner (GREEN)
- Implement both components
- Tests pass
- **Dependencies**: T040
- **Status**: [x]

---

## Phase 5: TDD — Screens (T042-T046)

### T042 — Write screen.tsx test (RED)
- Test iOS main screen structure, all cards render
- **Dependencies**: T010, T007
- **Status**: [x]

### T043 — Implement screen.tsx (GREEN)
- Implement iOS screen with all cards
- Test passes
- **Dependencies**: T042
- **Status**: [x]

### T044 — Write screen.android.tsx test (RED)
- Test Android variant (same structure as iOS)
- **Dependencies**: T010, T007
- **Status**: [x]

### T045 — Implement screen.android.tsx (GREEN)
- Implement Android screen
- Test passes
- **Dependencies**: T044
- **Status**: [x]

### T046 — Write screen.web.tsx test (RED)
- Test web variant with IOSOnlyBanner, no eager import of expo-contacts
- **Dependencies**: T010, T007
- **Status**: [x]

### T047 — Implement screen.web.tsx (GREEN)
- Implement web screen with lazy loading guard
- Test passes
- **Dependencies**: T046
- **Status**: [x]

---

## Phase 6: Integration (T048-T053)

### T048 — Update moduleRegistry.ts
- Add `contactsLab` entry (append last)
- **Dependencies**: T008, T043, T045, T047
- **Status**: [x]

### T049 — Update app.json plugins
- Add `./plugins/with-contacts` entry (append last)
- **Dependencies**: T014
- **Status**: [x]

### T050 — Run pnpm check
- Verify lint, format, typecheck, tests all pass green
- **Dependencies**: T048, T049
- **Status**: [x]

### T051 — Run pnpm format
- Apply formatting to all new files
- **Dependencies**: T050
- **Status**: [x]

### T052 — Verify no eslint-disable
- Grep for `eslint-disable` in all new files, must be zero
- **Dependencies**: T051
- **Status**: [x]

### T053 — Final verification
- Run full test suite, capture new totals
- Verify all new tests pass
- **Dependencies**: T052
- **Status**: [x]

---

## Phase 7: Commit (T054-T056)

### T054 — Commit scaffolding
- Commit message: `feat(038): Contacts Lab module — scaffolding, formatters, hooks, components, screens, plugin, manifest, registry`
- Include trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
- **Dependencies**: T053
- **Status**: [x]

### T055 — Commit TDD complete (if separate)
- Commit message: `feat(038): Contacts showcase module — full TDD implementation`
- Include trailer
- **Dependencies**: T054
- **Status**: [x]

### T056 — Mark tasks complete
- Update this file with all tasks marked `done`
- Commit message: `docs(038): mark all tasks complete in tasks.md`
- Include trailer
- **Dependencies**: T055
- **Status**: [x]

---

**End of Tasks**

