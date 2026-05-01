# Phase 1 Data Model — Contacts Module (038)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md

This document captures the typed shape and invariants for every entity transmitted, rendered, or held in memory by feature 038. JS-side type definitions live in `src/modules/contacts-lab/types.ts`.

There is **no JS-side persistent store** and **no on-disk persistence**. All state is in-memory, scoped to the screen's lifetime. The system's CNContactStore owns the persisted contacts; the module reads and writes them via `expo-contacts` and never persists copies to disk.

---

## Entity 1 — `AuthorizationStatus`

Surface representation of the contacts permission state, normalized from `expo-contacts`'s permission response.

### Type

```ts
export type AuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'authorized'
  | 'limited';  // iOS 18+ only, when accessPrivileges === 'limited'
```

### Invariants

- `'limited'` is iOS-18-only; on older iOS or non-iOS platforms the hook MUST NOT produce this value unless `accessPrivileges === 'limited'`.
- The Authorization card maps each value to a distinct UI branch:
  - `notDetermined` → "Request Access" button visible
  - `denied` → "Open Settings" link visible
  - `authorized` → neither button; "Full access granted" description
  - `limited` → neither button; "Limited access granted" description + LimitedAccessBanner shown
- Transitions are produced ONLY by the hook in response to:
  (a) initial mount (`getPermissionsAsync`),
  (b) `requestPermissions()` resolving,
  (c) the screen returning from background (deferred; v1 does not re-poll on focus).

---

## Entity 2 — `Contact` (read shape)

Surface representation of an `expo-contacts` contact returned by `getContactsAsync`, `getContactByIdAsync`, or `presentContactPickerAsync`.

### Type

```ts
export interface Contact {
  id: string;
  name: string;              // formatted full name (expo-contacts provides this)
  givenName?: string;
  familyName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
  company?: string;
}
```

### Invariants

- `id` is required and unique (assigned by CNContactStore).
- `name` is required; if the contact has no name, `expo-contacts` returns an empty string or the phone number.
- `phoneNumbers`, `emails`, `company` are optional arrays. Empty arrays or `undefined` mean no data.
- The UI must handle `undefined` gracefully by rendering "N/A" or empty strings.

---

## Entity 3 — `ContactInput` (write shape)

Surface representation of the form data used to create or update a contact.

### Type

```ts
export interface ContactInput {
  id?: string;               // present for update, absent for create
  givenName?: string;
  familyName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
  company?: string;
}
```

### Invariants

- For create: `id` is absent; `expo-contacts.addContactAsync()` returns the new `id`.
- For update: `id` is required; `expo-contacts.updateContactAsync()` requires it.
- All fields are optional; a contact can be created with only `givenName`, for example.
- The hook validates that at least one field is non-empty before calling `addContactAsync` or `updateContactAsync`.

---

## Entity 4 — `ContactsState` (hook return shape)

The `useContacts` hook returns a state object encapsulating all contacts module state.

### Type

```ts
export interface ContactsState {
  // Authorization
  status: AuthorizationStatus;
  canAskAgain: boolean;
  accessPrivileges?: 'all' | 'limited' | 'none';  // iOS 18+ only

  // Contact list
  contacts: Contact[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageOffset: number;

  // UI state
  inFlight: boolean;
  lastError: string | null;

  // Actions
  requestPermissions: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (name: string) => Promise<void>;
  addContact: (input: ContactInput) => Promise<string>;  // returns new id
  updateContact: (input: ContactInput) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Promise<Contact | null>;
  presentContactPicker: () => Promise<Contact | null>;
  presentLimitedContactsPicker: () => Promise<void>;  // iOS 18+ only
}
```

### Invariants

- `status` reflects the current authorization state (see Entity 1).
- `canAskAgain` is `false` after the user denies permission (iOS only).
- `accessPrivileges` is `undefined` on iOS 17- or non-iOS platforms.
- `contacts` is the current paginated list of contacts (initially empty until `refresh()` is called).
- `hasNextPage` / `hasPreviousPage` / `pageOffset` control pagination.
- `inFlight` is `true` while any async operation is in progress.
- `lastError` is `null` on success, or an error message string on failure.
- All actions are serialized via the internal promise chain (see research.md §2).

---

## Entity 5 — `PickerResult`

Result of `presentContactPickerAsync()` or `presentLimitedContactsPickerAsync()`.

### Type

```ts
export type PickerResult = Contact | null;  // null if user cancels
```

### Invariants

- If the user selects a contact, the promise resolves with a `Contact` object (Entity 2).
- If the user cancels without selecting, the promise resolves with `null`.
- The PickerCard component must handle both cases.

---

## Entity 6 — `SearchQuery`

Surface representation of the search input for `getContactsAsync({ name })`.

### Type

```ts
export interface SearchQuery {
  name: string;  // partial or full name to match
}
```

### Invariants

- If `name` is empty, the search should either no-op or show a validation message.
- The hook calls `expo-contacts.getContactsAsync({ name, fields: [...], pageSize: 20, pageOffset: 0 })`.

---

## Entity 7 — `PaginationParams`

Surface representation of the pagination parameters for `getContactsAsync`.

### Type

```ts
export interface PaginationParams {
  pageSize: number;    // default: 20
  pageOffset: number;  // increments by pageSize on "Load More"
}
```

### Invariants

- `pageSize` is fixed at 20 for this module.
- `pageOffset` starts at 0 on mount, increments by 20 on each "Load More" tap.
- When `hasNextPage === false`, "Load More" is hidden.

---

**End of Data Model**
