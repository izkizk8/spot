# Phase 0 Research — Contacts Module (038)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

## §1 — Library choice: consume `expo-contacts` directly

### Decision

The module consumes the maintained [`expo-contacts`](https://docs.expo.dev/versions/latest/sdk/contacts/) library directly via standard ES imports. No project-owned bridge file family is authored. Dependency is added via `pnpm add expo-contacts`. The mock seam in tests is the upstream module name (`jest.mock('expo-contacts', ...)`).

### Rationale

- `expo-contacts` is maintained by the Expo team, ships iOS + Android implementations, and exposes the precise surface this feature needs:
  - Authorization: `getPermissionsAsync`, `requestPermissionsAsync`
  - Read: `getContactsAsync`, `getContactByIdAsync`
  - Write: `addContactAsync`, `updateContactAsync`, `removeContactAsync`
  - Picker: `presentContactPickerAsync`, `presentLimitedContactsPickerAsync` (iOS 18+)
- Authoring a custom Swift bridge over CNContactStore would duplicate the library's iOS implementation with no fidelity gain.
- Matches the showcase's "use the maintained Expo library where one exists" philosophy.

### Alternatives considered

- **Hand-written Swift bridge** — rejected; duplicates `expo-contacts` with no benefit.
- **Wrapper module `src/native/contacts.ts`** — rejected; adds indirection for no gain; the hook can import `expo-contacts` directly.

---

## §2 — Hook serialization of concurrent mutations

### Decision

The `useContacts` hook owns a hook-scoped promise chain:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work);
  chain = next.catch(() => undefined);
  return next;
}
```

Every **mutating** action (`addContact`, `updateContact`, `removeContact`, `requestPermissions`) wraps its `expo-contacts` call through `enqueue(...)`. **Read-only** actions (`refresh`, `search`, `getContactById`) are NOT serialized.

### Rationale

- Two rapid Save taps on the Compose form could otherwise stack two `addContactAsync` calls and produce duplicate contacts. Serializing ensures deterministic order.
- Inherits the same helper from features 030-037, reducing reviewer cognitive load.
- Errors are preserved for the caller but the chain is detoxified so a rejected call does not block subsequent ones.

### Alternatives considered

- **No serialization** — rejected; double-create is observably broken.
- **Serialize reads too** — rejected; reads must remain responsive even during long-running mutations.

---

## §3 — iOS 18+ limited-access handling

### Decision

- `expo-contacts.getPermissionsAsync()` returns `{ status, canAskAgain, accessPrivileges }` on iOS 18+.
- `accessPrivileges` is `'all' | 'limited' | 'none'` on iOS 18+, `undefined` on iOS 17-.
- When `accessPrivileges === 'limited'`, render the `LimitedAccessBanner` with a "Manage selected contacts" button.
- Tapping the button attempts `Contacts.presentLimitedContactsPickerAsync()` first; if unavailable (iOS 17- or API not exposed), falls back to `presentContactPickerAsync()`.
- The `ContactsList` component does NOT filter by `accessPrivileges`; `expo-contacts.getContactsAsync()` already returns only the accessible subset when limited.

### Rationale

- Limited access is an iOS 18+ feature. The module must surface it honestly but degrade gracefully on older OS versions.
- Falling back to `presentContactPickerAsync()` when the limited-picker API is unavailable ensures the UI remains functional on iOS 17-.
- `getContactsAsync()` already returns the filtered subset; no additional client-side filtering is needed.

### Alternatives considered

- **Render error when limited on iOS 17-** — rejected; the banner should hide gracefully on unsupported OS versions.
- **Client-side filtering of contacts by `accessPrivileges`** — rejected; the native API already handles this.

---

## §4 — Pagination strategy

### Decision

- `expo-contacts.getContactsAsync()` returns `{ data, hasNextPage, hasPreviousPage }`.
- The `ContactsList` component renders the first 20 contacts (pageSize: 20, pageOffset: 0) on mount.
- A "Load More" button at the bottom increments `pageOffset` by 20 and appends the next page to the existing list.
- When `hasNextPage === false`, the "Load More" button is hidden.

### Rationale

- A typical device has 50-500 contacts. Rendering all at once would freeze the UI on large contact databases.
- Load-on-demand with a manual "Load More" button is the simplest pagination pattern for an educational showcase.
- `expo-contacts` exposes `pageSize` and `pageOffset` directly; no custom pagination logic is needed.

### Alternatives considered

- **Infinite scroll** — rejected; adds complexity (scroll position tracking, FlatList `onEndReached`) for no educational gain.
- **Load all at once** — rejected; would freeze on large databases.

---

## §5 — Picker fallback for limited-access

### Decision

When `accessPrivileges === 'limited'`, the "Manage selected contacts" button attempts:
1. `Contacts.presentLimitedContactsPickerAsync()` (iOS 18+)
2. If unavailable (API not exposed or iOS 17-), fall back to `Contacts.presentContactPickerAsync()`

### Rationale

- `presentLimitedContactsPickerAsync()` is the proper iOS 18+ API for re-presenting the limited-contacts picker.
- However, if `expo-contacts` does not expose this API (it's a newer API and may not be in all SDK 55 versions), the fallback to `presentContactPickerAsync()` ensures the UI remains functional.
- The fallback is documented in the spec's Edge Cases and Assumptions sections.

### Alternatives considered

- **Throw error if limited-picker unavailable** — rejected; breaks the UI on older `expo-contacts` versions.
- **Hide the banner on iOS 17-** — already implemented; the banner only renders when `accessPrivileges === 'limited'`.

---

**End of Research**
