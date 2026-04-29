# Implementation Plan: Contacts Module

**Branch**: `038-contacts` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/038-contacts/spec.md`
**Branch parent**: `037-eventkit`

## Summary

Add a "Contacts Lab" showcase module that demonstrates Apple's Contacts framework (CNContactStore) — query, present, pick, create, update, and delete contacts — consumed cross-platform via the maintained [`expo-contacts`](https://docs.expo.dev/versions/latest/sdk/contacts/) library. The feature ships a fully-functional iOS + Android educational module with authorization flow, contact picker, search, CRUD composer, paginated list, and iOS 18+ limited-access UI. Self-contained inside `src/modules/contacts-lab/` and registers as a single new card (`id: 'contacts-lab'`, `platforms: ['ios','android','web']`, `minIOS: '9.0'`) appended to `src/data/moduleRegistry.ts`. Config plugin `plugins/with-contacts/` adds the required Info.plist `NSContactsUsageDescription` key. Integration is purely additive: registry +1 module entry, `app.json` `plugins` +1 entry, `package.json` +1 runtime dependency (`expo-contacts`).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict). React 19.2 + React Native 0.83 + React Compiler enabled. **Zero new Swift / Kotlin / Java sources** authored by this feature — `expo-contacts` ships its own native bridge.

**Primary Dependencies**: Expo SDK 55, `expo-router` (typed routes), `@expo/config-plugins` (consumed by `plugins/with-contacts`). **NEW runtime JS dep**: `expo-contacts` (installed via `pnpm add expo-contacts` so the version is SDK-55-compatible).

**Storage**: None. Authorization status, contact list, search results, pagination state, `inFlight` flag, and `lastError` are in-memory and scoped to the screen's lifetime. Contacts themselves live in the system's CNContactStore; the module reads and writes them via `expo-contacts` and never persists copies to disk.

**Testing**: Jest Expo + React Native Testing Library — JS-pure tests only. All `expo-contacts` interactions are mocked **at the import boundary** (Jest module mock of `expo-contacts`); hooks and components are exercised through that single seam. Full suite is Windows-runnable (no native, no device).

**Target Platform**: iOS 9+ (the spec's stated `minIOS: '9.0'` is when CNContactStore was introduced). On iOS 18+ the Authorization card additionally honours the `limited` access privilege. Android is functional via `expo-contacts`'s Android implementation. Web is a stub: an `IOSOnlyBanner` over disabled UI. `screen.web.tsx` MUST NOT eagerly import `expo-contacts` at module-evaluation time.

**Constraints**: Purely additive at integration level — 1 import + 1 array entry in `src/data/moduleRegistry.ts`; +1 entry in `app.json` `plugins`; +1 runtime JS dependency (`expo-contacts`); **no `eslint-disable` directives anywhere**; `StyleSheet.create()` only; `.android.tsx` / `.web.tsx` splits for non-trivial platform branches; `expo-contacts` is mocked at the import boundary in tests; `pnpm format` is mandatory before the final commit.

## Constitution Check

*Constitution version checked*: **1.1.0** (`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS ships the full module. Android ships the same structure via `expo-contacts`'s Android implementation (except iOS 18+ limited-access, which is iOS-only). Web ships the same structure with all controls disabled and an `IOSOnlyBanner`. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Web's `screen.web.tsx` MUST NOT eagerly import `expo-contacts`. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects. |
| V. Test-First for New Features | **PASS** — JS-pure tests cover every component, hook, formatter, plugin, screen variant, and manifest contract. Tests written RED-first; implementation follows. |

**Initial Constitution Check: PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/038-contacts/
├── plan.md                        # this file
├── research.md                    # Phase 0 decisions
├── data-model.md                  # Phase 1 entities
├── quickstart.md                  # On-device verification
├── contracts/
│   ├── contacts-lab-manifest.md   # Registry entry contract
│   ├── hooks.md                   # useContacts hook contract
│   ├── components.md              # Component prop contracts
│   └── with-contacts-plugin.md    # Plugin contract
├── checklists/
│   └── (TBD by implementation)
└── tasks.md                       # Phase 2 dependency-ordered tasks
```

### Implementation Files (feature code)

```text
src/modules/contacts-lab/
├── index.tsx                      # Manifest export
├── screen.tsx                     # iOS main screen
├── screen.android.tsx             # Android variant
├── screen.web.tsx                 # Web stub (IOSOnlyBanner)
├── formatters.ts                  # Phone/email normalization
├── hooks/
│   └── useContacts.ts             # Auth, list, search, CRUD, refresh
└── components/
    ├── AuthorizationCard.tsx      # Permission status & request
    ├── PickerCard.tsx             # Present CNContactPickerViewController
    ├── SearchCard.tsx             # Search by name
    ├── ComposeCard.tsx            # Create new contact form
    ├── ContactsList.tsx           # Paginated list container
    ├── ContactRow.tsx             # Single contact row
    ├── ContactDetailModal.tsx     # View/edit/delete modal
    ├── LimitedAccessBanner.tsx    # iOS 18+ limited-access banner
    └── IOSOnlyBanner.tsx          # Web/unsupported banner

plugins/with-contacts/
├── index.ts                       # Plugin implementation
└── index.test.ts                  # Plugin tests
```

### Test Files

```text
test/unit/modules/contacts-lab/
├── formatters.test.ts
├── manifest.test.ts
├── screen.test.tsx
├── screen.android.test.tsx
├── screen.web.test.tsx
├── hooks/
│   └── useContacts.test.tsx
└── components/
    ├── AuthorizationCard.test.tsx
    ├── PickerCard.test.tsx
    ├── SearchCard.test.tsx
    ├── ComposeCard.test.tsx
    ├── ContactsList.test.tsx
    ├── ContactRow.test.tsx
    ├── ContactDetailModal.test.tsx
    ├── LimitedAccessBanner.test.tsx
    └── IOSOnlyBanner.test.tsx

plugins/with-contacts/
└── index.test.ts
```

## Phased Implementation

**Phase 0: Research & Decisions** → `research.md` (library choice, hook serialization, limited-access handling)

**Phase 1: Design Artifacts** → `data-model.md` (Contact, ContactInput, AuthorizationStatus types), `quickstart.md` (on-device verification), `contracts/` (manifest, hooks, components, plugin)

**Phase 2: Task Breakdown** → `tasks.md` (dependency-ordered T001-T050)

**Phase 3: TDD Implementation** → Write tests RED, implement code GREEN, refactor, repeat

**Phase 4: Integration** → Update registry, update app.json plugins, verify `pnpm check`, format, commit

**Phase 5: Verification** → Run full test suite, verify no `eslint-disable`, typecheck, lint, final report

## Test Baseline Tracking

**Expected delta**: ≥ +18 suites (formatters, manifest, 3 screen variants, 1 hook, 9 components, 1 plugin, all with comprehensive test cases).

Baseline will be recorded from prior feature; new total will be verified in final report.

## Rollout Strategy

1. **Scaffolding** (T001-T010): Create directory structure, stubs, formatters, manifest
2. **Plugin** (T011-T015): Implement and test `plugins/with-contacts/`
3. **Hook** (T016-T025): Implement and test `hooks/useContacts.ts` (auth, list, search, CRUD, pagination, limited-access)
4. **Components** (T026-T040): Implement and test all 9 components
5. **Screens** (T041-T045): Implement and test all 3 screen variants
6. **Integration** (T046-T050): Update registry, app.json, verify quality gate, commit

**End of Plan**
