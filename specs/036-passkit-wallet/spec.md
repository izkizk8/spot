# Feature Specification: PassKit / Wallet (Add Pass) Module

**Feature Branch**: `036-passkit-wallet`
**Feature Number**: 036
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 6+ educational module showcasing Apple Wallet PassKit integration via `PKAddPassesViewController` (presenting a `.pkpass` to add to Wallet) and `PKPassLibrary` (querying existing passes, opening a pass on iOS 13.4+). Adds a "Wallet (PassKit)" card to the 006 iOS Showcase registry (`id: 'passkit-lab'`, `platforms: ['ios','android','web']`, `minIOS: '6.0'`). Native side is a thin Swift bridge `native/ios/passkit/PassKitBridge.swift` wrapping `PKAddPassesViewController` and `PKPassLibrary`. JS bridge `src/native/passkit.ts` exposes `canAddPasses`, `isPassLibraryAvailable`, `passes`, `addPassFromBytes`, `addPassFromURL`, and `openPass`; non-iOS platforms throw `PassKitNotSupported`. Config plugin `plugins/with-passkit/` adds the `com.apple.developer.pass-type-identifiers` entitlement (placeholder) and links Wallet.framework via the podspec. Branch parent is `035-core-bluetooth`. Additive only: registry +1 (30 → 31 modules), `app.json` `plugins` +1 (22 → 23 plugins).

---

## ⚠️ Pass Signing Reality Check (READ FIRST)

Apple Wallet only accepts `.pkpass` packages that are **signed** with a developer-issued certificate tied to a registered **Pass Type ID** (`pass.<reverse-dns>`). Producing a valid `.pkpass` requires:

1. Registering a Pass Type ID at developer.apple.com → Identifiers.
2. Generating a Pass Type ID certificate (`.p12`) from that identifier.
3. Building a `pass.json` + assets bundle, computing a manifest, and signing the manifest with the certificate (typically via `signpass` or an equivalent toolchain).

**These artifacts cannot be checked into a public repository**: the certificate is private to the issuing Apple Developer account, and a signed `.pkpass` is bound to that team's identifier. Any attempt to ship a "real" sample pass in this module would either require leaking a private certificate or producing an unsigned bundle that Wallet will reject at presentation time.

**This module ships as a code-complete educational scaffold**, mirroring the precedent set by feature 015 (ScreenTime). All Swift sources, the JS bridge, the config plugin, and the React UI exist and have unit-test coverage. The "Try with bundled sample" affordance in the UI surfaces an inline **"Pass signing required"** notice instead of presenting an unsigned bundle that would fail. Users who own a Pass Type ID can drop their own signed `.pkpass` into the project (or fetch it via the Add From URL section) and exercise the real flow.

This reality check is repeated in three additional locations: the on-screen UI (an `EntitlementBanner` component reused for the "pass signing required" message), the module's `quickstart.md`, and the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the showcase without a Pass Type ID (Priority: P1)

A developer studying the spot iOS showcase opens the app on any iOS 6+ device that does **not** have a Pass Type ID configured (the most common case, including the showcase's own CI builds). They tap the "Wallet (PassKit)" card from the Modules grid, see the full UI with five sections (Capabilities, Add a sample pass, My Passes, Add From URL, Setup guide), and understand from a prominent banner and inline status messages that real pass presentation requires a signed `.pkpass`. No action crashes the app.

**Why this priority**: This is the experience for ~99% of users (and for the showcase's own CI builds). If the app crashes here — e.g., by attempting to present an unsigned bundle — the entire module is worthless. This is the MVP: the educational value of the scaffold is delivered even without a developer-issued certificate.

**Independent Test**: Build and run the app on any iOS 6+ device or simulator using the showcase's normal provisioning profile (no special Pass Type ID). Open the Wallet (PassKit) module. Verify that (a) the entitlement banner appears at the top of the screen explaining that the placeholder entitlement must be replaced with a real Pass Type ID, (b) all five cards render with their controls, (c) tapping "Try with bundled sample" produces a non-crashing "Pass signing required" status, (d) the "My Passes" section calls `PKPassLibrary.passes()` and either lists existing user passes or shows an empty state, and (e) navigating away and back leaves the app responsive.

**Acceptance Scenarios**:

1. **Given** an iOS 6+ device with the placeholder entitlement, **When** the user opens the Wallet (PassKit) module, **Then** an `EntitlementBanner` is displayed at the top of the screen with the text "Pass Type ID required" and a link to `quickstart.md`.
2. **Given** the same context, **When** the user taps "Try with bundled (unsigned) sample", **Then** no `PKAddPassesViewController` is presented and the card status reads "Pass signing required — see quickstart.md".
3. **Given** the same context, **When** the user taps Refresh in the My Passes card, **Then** `PKPassLibrary.passes()` is invoked and the list updates (commonly empty in CI/simulator) without throwing.
4. **Given** the same context, **When** the user pastes a URL into Add From URL and taps "Fetch and add", **Then** the module attempts to download the bytes and present `PKAddPassesViewController`; if the bytes are not a valid signed pass, the system view controller surfaces its own error and the card status reflects "Pass invalid or unsigned".
5. **Given** the user navigates away from and back to the module, **When** the screen re-mounts, **Then** the capabilities pills, the My Passes list, and the input fields re-hydrate correctly and no leaked native handles remain.

---

### User Story 2 — Add a real signed pass (with Pass Type ID) (Priority: P2)

A developer who owns a Pass Type ID and a corresponding signing certificate has produced a signed `.pkpass`. They paste a URL pointing to that file (or replace the placeholder bundled sample with their own), tap "Fetch and add", see Apple's `PKAddPassesViewController` slide up, and approve. The pass is added to Apple Wallet. They return to the module, tap Refresh in My Passes, and see the new pass listed with its serial number, organization, description, and pass type. They tap **Open in Wallet** on that row; on iOS 13.4+ the Wallet app opens directly to that pass.

**Why this priority**: This is the core "happy path" the module is designed to demonstrate. It validates that the Swift bridge, the URL fetch, the `PKAddPassesViewController` presentation, and the `PKPassLibrary.passes()` enumeration all work end-to-end. It is P2 because it is only reachable for developers with a Pass Type ID.

**Independent Test**: With a Pass Type ID and a signed `.pkpass` hosted at a reachable URL, build the app with the real entitlement value substituted into `app.json`, install on an iOS device, paste the URL into Add From URL, tap Fetch and add, approve the system sheet, then tap Refresh and confirm the pass appears in the list. On iOS 13.4+, tap Open in Wallet and confirm Wallet launches focused on that pass.

**Acceptance Scenarios**:

1. **Given** a real entitlement and a reachable signed `.pkpass` URL, **When** the user taps Fetch and add, **Then** the bytes are downloaded, `PKAddPassesViewController` is presented, and on user approval the pass is added to Wallet.
2. **Given** the user has just added a pass, **When** the user taps Refresh in My Passes, **Then** `PKPassLibrary.passes()` returns the pass and the row renders with `serialNumber`, `organizationName`, `localizedDescription`, and `passType`.
3. **Given** a row is shown for a pass and the device runs iOS 13.4 or later, **When** the user taps Open in Wallet, **Then** `PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` is called and Wallet opens to that pass.
4. **Given** the device runs iOS 13.0–13.3, **When** the row renders, **Then** the Open in Wallet button is hidden or disabled with a tooltip indicating the iOS-version requirement.
5. **Given** the user supplies bytes via `addPassFromBytes(base64)` (used by tests and by the bundled-sample affordance once a real bundle is dropped in), **When** the bridge is invoked, **Then** `PKAddPassesViewController` is presented identically to the URL flow.

---

### User Story 3 — Cross-platform graceful degradation (Priority: P2)

A developer running the showcase on Android or in a web browser opens the Modules grid, sees the "Wallet (PassKit)" card (registered for all platforms for educational visibility), taps it, and sees a screen with a prominent "Wallet (PassKit) is iOS-only" banner. All interactive controls are disabled. No bridge calls are made.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact; without this story the registry would either hide the module on non-iOS or crash on it.

**Independent Test**: Run the app on Android (emulator or device) and on web; open the module; verify the iOS-only banner is shown, controls are disabled, and `bridge.canAddPasses()` rejects with `PassKitNotSupported` (visible only via the disabled state).

**Acceptance Scenarios**:

1. **Given** the app is running on Android or web, **When** the user opens the module, **Then** `IOSOnlyBanner` is displayed and all action buttons are disabled.
2. **Given** the same context, **When** any internal code path invokes a bridge method, **Then** it rejects with a typed `PassKitNotSupported` error rather than crashing.
3. **Given** the same context, **When** the screen renders, **Then** the five-card layout is still drawn (with disabled controls) so the educational structure is preserved.

---

### Edge Cases

- **Pass library unavailable**: On extremely old or restricted devices `PKPassLibrary.isPassLibraryAvailable()` returns false. Status pills MUST reflect this and disable the Add/Open affordances.
- **`canAddPasses()` returns false**: e.g., on iPad models that historically did not support Wallet. Add affordances MUST disable; My Passes MAY still render (read-only).
- **Empty pass library**: `PKPassLibrary.passes()` returns an empty array; the My Passes section MUST render an empty-state row ("No passes yet") rather than throwing.
- **Unsigned or malformed `.pkpass`**: When the user provides bytes that fail validation, the system `PKAddPassesViewController` surfaces its own error UI; the module MUST capture that error in the card status without crashing.
- **URL fetch fails (offline / 404 / non-200)**: The Add From URL flow MUST display a status message ("Download failed") with the underlying error code and MUST NOT attempt to present an empty pass.
- **iOS 13.0–13.3 (no `openPass`)**: `PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` is iOS 13.4+. The Open in Wallet row action MUST be hidden or disabled on 13.0–13.3 with an explanatory tooltip.
- **Re-adding a pass that already exists**: Wallet's own UI replaces the existing pass; the module MUST refresh the My Passes list afterward.
- **Plugin coexistence**: The 036 plugin MUST cooperate with all 22 prior plugins (002–035) without disturbing their entitlements, target lists, or App Group configurations.
- **Background/unmount during fetch**: If the screen unmounts while an Add From URL request is in flight, the in-flight promise MUST be cancelled or its result discarded; no state updates may be applied to an unmounted component.
- **No bundled binary**: No `.pkpass` is shipped in the repository. The "Try with bundled sample" button MUST detect the absence and show "Pass signing required" instead of attempting a nonexistent file.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register a "Wallet (PassKit)" module entry in `src/modules/registry.ts` with `id: 'passkit-lab'`, `platforms: ['ios','android','web']`, and `minIOS: '6.0'`. This MUST be the only registry edit (a single import + array entry line). After this change the registry MUST contain 31 modules (30 prior + 1).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`.

#### On-Screen UI Sections (iOS)

- **FR-004**: The iOS screen MUST render five cards in this order: **Capabilities**, **Add a sample pass**, **My Passes**, **Add From URL**, **Setup guide**.
- **FR-005**: The **Capabilities** card MUST show two status pills bound to `PKPassLibrary.isPassLibraryAvailable()` and `PKPassLibrary.canAddPasses()`, plus a Refresh button that re-evaluates both.
- **FR-006**: The **Add a sample pass** card MUST explain Pass Type ID + signing requirements and present a "Try with bundled (unsigned) sample" button. Because no signed `.pkpass` is shipped, the button MUST surface an inline "Pass signing required" status when invoked. If a signed `.pkpass` is later added at the documented bundle path, the same button MUST present `PKAddPassesViewController` with its bytes.
- **FR-007**: The **My Passes** card MUST list the user's existing passes via `PKPassLibrary.passes()`. Each row MUST show `serialNumber`, `organizationName`, `localizedDescription`, and `passType`, with a Refresh control at the card level and a per-row "Open in Wallet" affordance that calls `PKPassLibrary.openPass(passTypeIdentifier:serialNumber:)` on iOS 13.4+.
- **FR-008**: The **Add From URL** card MUST provide a URL text input and a "Fetch and add" button. On submit, the module MUST download the bytes, then present `PKAddPassesViewController` with those bytes. Failures (network, validation, presentation) MUST surface as inline status text without crashing.
- **FR-009**: The **Setup guide** card MUST enumerate the steps required at developer.apple.com to register a Pass Type ID, generate the signing certificate, and produce a `.pkpass` (links allowed; no copyrighted Apple text reproduced verbatim).
- **FR-010**: The screen MUST render an `EntitlementBanner` at the top whenever the placeholder Pass Type ID entitlement is detected (default in this repo); it MUST hide once a real Pass Type ID has been substituted into `app.json`.
- **FR-011**: On Android and web, the screen MUST render an `IOSOnlyBanner` and disable all action controls; the five-card structure MUST still be rendered for educational purposes.

#### Native Bridge Contract

- **FR-012**: The JS bridge `src/native/passkit.ts` MUST expose these methods with the listed signatures:
  - `canAddPasses(): Promise<boolean>` — reflects `PKPassLibrary.isPassLibraryAvailable() && +[PKPassLibrary canAddPasses]`.
  - `isPassLibraryAvailable(): Promise<boolean>` — reflects `PKPassLibrary.isPassLibraryAvailable()`.
  - `passes(): Promise<PassMetadata[]>` — returns metadata for every pass in the user's library.
  - `addPassFromBytes(base64: string): Promise<{ added: boolean }>` — decodes the base64 payload to a `PKPass` and presents `PKAddPassesViewController`; resolves `added: true` if the user approved, `false` if they cancelled.
  - `addPassFromURL(url: string): Promise<{ added: boolean }>` — convenience wrapper that downloads the bytes (via `URLSession`) and delegates to the byte-array path.
  - `openPass(passTypeIdentifier: string, serialNumber: string): Promise<void>` — iOS 13.4+ only; rejects with a typed `PassKitOpenUnsupported` error on iOS < 13.4.
- **FR-013**: On non-iOS platforms (`passkit.android.ts`, `passkit.web.ts`), every method MUST reject with a typed `PassKitNotSupported` error rather than no-op. `passkit.types.ts` MUST export the `PassMetadata` interface and the `PassKitNotSupported` / `PassKitOpenUnsupported` error classes shared across all variants.
- **FR-014**: The `PassMetadata` shape MUST be: `{ passTypeIdentifier: string; serialNumber: string; organizationName: string; localizedDescription: string; passType: 'boardingPass' | 'coupon' | 'eventTicket' | 'generic' | 'storeCard' }`.

#### Native Implementation

- **FR-015**: A single Swift file `native/ios/passkit/PassKitBridge.swift` MUST wrap `PKAddPassesViewController` and `PKPassLibrary`. All entry points MUST be in `do/catch` blocks and surface typed errors via `expo-modules-core`.
- **FR-016**: The bridge MUST present `PKAddPassesViewController` from the current key window's root view controller (or its top-most presented controller) and forward `didAddPasses` / `didFinish` callbacks back to the JS layer as a `{ added: boolean }` result.
- **FR-017**: `openPass` MUST be `@available(iOS 13.4, *)`-guarded; on earlier iOS versions the bridge MUST reject with `PassKitOpenUnsupported`.
- **FR-018**: The bridge MUST link `PassKit.framework`. Wallet.framework linkage (used by the `openPass` bridge on iOS 13.4+) MUST be declared via the podspec.

#### Config Plugin

- **FR-019**: A config plugin at `plugins/with-passkit/` MUST add the `com.apple.developer.pass-type-identifiers` iOS entitlement. The default value MUST be a placeholder array (e.g., `['$(TeamIdentifierPrefix)pass.example.placeholder']`) accompanied by an explanatory comment instructing the user to replace it with their real Pass Type IDs.
- **FR-020**: The plugin MUST link `PassKit.framework` (via the iOS podspec / `Podfile.properties`) so the bridge compiles cleanly.
- **FR-021**: The plugin MUST be idempotent: running it multiple times MUST produce identical project state. Re-running MUST NOT duplicate entitlement entries or framework links.
- **FR-022**: The plugin MUST coexist with all 22 prior plugins (002 … 035) without disturbing their entitlements, App Groups, extension targets, or Info.plist additions. Fixture tests MUST verify that enabling 036 alongside the prior 22 produces a project whose other plugin outputs are unchanged.

#### Hooks, State & Error Reporting

- **FR-023**: A custom hook `src/modules/passkit-lab/hooks/usePassKit.ts` MUST wrap the bridge and expose: capability flags, a `passes` array, `refresh()`, `addFromBytes()`, `addFromURL()`, `openPass()`, a `lastError` value, and an `inFlight` flag. The hook MUST cancel or discard in-flight operations on unmount and MUST not call `setState` after unmount.
- **FR-024**: Each card MUST surface the most recent native error or success message in a status text region; errors MUST never propagate as uncaught promise rejections.
- **FR-025**: A `pass-types.ts` module MUST export the `PassMetadata` type and a catalog of the five common pass categories (`boardingPass`, `coupon`, `eventTicket`, `generic`, `storeCard`) with a short user-facing label for each. The catalog MUST be exhaustively covered by `pass-types.test.ts`.

#### Test Suite (JS-pure, Windows-runnable)

- **FR-026**: The following test files MUST exist and pass under `pnpm check`:
  - `pass-types.test.ts` — every catalog entry has a unique key and a non-empty label.
  - `hooks/usePassKit.test.tsx` — capabilities flow, refresh flow, add-from-URL flow (mocked download + bridge), add-from-bytes flow, error path, unmount cleanup (no setState after unmount).
  - `components/CapabilitiesCard.test.tsx` — both pills bind to bridge values; Refresh re-invokes both bridge methods.
  - `components/AddSamplePassCard.test.tsx` — when no bundled sample exists, the button surfaces "Pass signing required"; when a sample is provided (mocked), it calls `addPassFromBytes`.
  - `components/MyPassesList.test.tsx` — empty state renders; populated list renders one `PassRow` per pass; Refresh calls `passes()` exactly once.
  - `components/PassRow.test.tsx` — renders metadata; Open in Wallet calls `openPass` on iOS 13.4+ and is disabled below.
  - `components/AddFromUrlCard.test.tsx` — Fetch and add invokes the URL flow; failures surface in status.
  - `components/SetupGuideCard.test.tsx` — renders the documented step list.
  - `components/EntitlementBanner.test.tsx` — visible when placeholder entitlement detected; hidden when real Pass Type ID present.
  - `components/IOSOnlyBanner.test.tsx` — renders the iOS-only message on Android/web.
  - `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx` — integration; banner behavior; disabled controls on non-iOS.
  - `native/passkit.test.ts` — bridge contract on iOS (mocked native module) and `PassKitNotSupported` rejection on Android/web stubs.
  - `plugins/with-passkit/index.test.ts` — entitlement is added; idempotent; coexists with all 22 prior plugins (using the existing 002–035 fixture composition pattern).
  - `manifest.test.ts` — manifest valid; `id === 'passkit-lab'`; `platforms === ['ios','android','web']`; `minIOS === '6.0'`.
- **FR-027**: All native bridges MUST be mocked at the import boundary (`src/native/passkit.ts`) — no direct mocking of the underlying `expo-modules-core` `requireNativeModule`. This mirrors the precedent established by feature 015 and refined through 035.

#### Quality Gates

- **FR-028**: `pnpm check` MUST be green (format, lint, typecheck, tests).
- **FR-029**: Constitution v1.1.0 MUST pass (no eslint-disable directives anywhere in this feature; ThemedText/ThemedView used; `Spacing` scale used; styles via `StyleSheet.create`; path aliases honored; TypeScript strict).
- **FR-030**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing`, `StyleSheet.create()`, path aliases, TypeScript strict, no inline magic numbers.
- **FR-031**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit, 30 → 31) and `app.json` (1 plugin entry, 22 → 23) may touch existing files. No edits to features 002–035.

### Key Entities

- **PassMetadata**: `{ passTypeIdentifier, serialNumber, organizationName, localizedDescription, passType }`. Surface representation of a `PKPass` enumerated via `PKPassLibrary.passes()`. Identity is the `(passTypeIdentifier, serialNumber)` pair, which is also the input shape for `openPass`.
- **PassCategory**: enum of `'boardingPass' | 'coupon' | 'eventTicket' | 'generic' | 'storeCard'`. Mirrors the `PKPassType` taxonomy and drives the per-row label and category icon.
- **Capabilities**: `{ isPassLibraryAvailable: boolean; canAddPasses: boolean }`. Captures the two boolean probes used by the Capabilities card; recomputed on screen mount and on Refresh.
- **PassKitState**: in-memory state held by `usePassKit` consisting of `capabilities`, `passes`, `inFlight`, `lastError`. All transitions MUST be deterministic and covered by the hook test.
- **EntitlementStatus**: a derived boolean indicating whether `app.json` still carries the placeholder Pass Type ID array (true → banner visible) or has been substituted (false → banner hidden).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer without a Pass Type ID can open the Wallet (PassKit) module on an iOS 6+ device and exercise every visible button without crashing the app, in under 2 minutes from a cold app launch.
- **SC-002**: 100% of the JS-pure test suite (catalog, hook, components, screen integration, bridge, plugin, manifest) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against the parent branch for files outside `specs/036-passkit-wallet/`, `plugins/with-passkit/`, `native/ios/passkit/`, `src/modules/passkit-lab/`, and `src/native/passkit.{ts,android.ts,web.ts,types.ts}` shows changes only in `src/modules/registry.ts` (≤ 2 lines) and `app.json` (≤ 1 plugin entry).
- **SC-004**: A developer with a Pass Type ID and a signed `.pkpass` URL can complete the fetch → add → list → open-in-Wallet flow in under 3 minutes on an iOS 13.4+ device.
- **SC-005**: Running the app on Android and on web shows the iOS-only banner with disabled controls and zero JavaScript exceptions thrown over a 60-second exploration.
- **SC-006**: The 036 config plugin runs idempotently: a second `expo prebuild` produces no additional changes to the iOS project file.
- **SC-007**: Enabling the 036 plugin alongside all 22 prior plugins (002–035) in fixture tests produces a project with the new entitlement and Wallet.framework linkage, and zero changes to any prior plugin's outputs.
- **SC-008**: The on-screen "Pass signing required" notice is reachable in ≤ 2 taps from the module list, demonstrating the educational message even when no signed pass is available.

---

## Assumptions

- **Pass signing is gated by Apple** *(repeated for prominence)*: A valid `.pkpass` requires a Pass Type ID and signing certificate from developer.apple.com. The module is designed first for the unsigned/no-cert experience and second for the signed experience. No `.pkpass` binary is checked in. The `EntitlementBanner`, `quickstart.md`, and this spec all surface this reality.
- **Conditional on-device verification**: Functional verification of actually adding a pass to Wallet is conditional on having a Pass Type ID, a signing certificate, and a physical iOS device (the simulator cannot persist passes to Wallet). CI and Windows-based development verify only the JS-pure layer.
- **EAS Build behavior**: A standard EAS Build will still succeed with the placeholder `com.apple.developer.pass-type-identifiers` array; the entitlement is informational and Apple does not block provisioning unless the values are claimed. The resulting build cannot present real passes until the user replaces the placeholder.
- **Swift code is not unit-testable on Windows**: `PassKitBridge.swift` is written, reviewed, and compiled on macOS or via EAS Build. JS-side mocks substitute for the native module in all Windows-runnable tests.
- **iOS minimum version**: iOS 6.0 is declared as the module minimum (PassKit shipped in iOS 6). The `openPass` call is gated to iOS 13.4+ at the bridge layer.
- **No pass authoring**: The module presents and queries passes; it does not author or sign them. Any `.pkpass` consumed by the module must already be signed.
- **No web fallback**: Web Wallet integration (Apple Wallet on Safari/macOS) is out of scope; the web variant only renders the iOS-only banner.
- **Single-line registry edit**: Adding the module to `src/modules/registry.ts` requires one import statement and one entry in the modules array; this is the only edit to existing files outside `app.json`.
- **No `expo-file-system` dependency growth**: URL fetching uses the existing `expo-file-system` legacy API already present in the project (or `URLSession` directly inside the Swift bridge); no new top-level dependency is introduced.
- **Plugin count growth**: After this feature, `app.json` will contain 23 plugin entries (22 prior + `with-passkit`), and the registry will contain 31 modules (30 prior + `passkit-lab`).

---

## Out of Scope

- Authoring or signing `.pkpass` bundles (no `pass.json` builder, no manifest signer).
- Server-side pass distribution (push-update web service tokens, `webServiceURL`, `authenticationToken` flows).
- Apple Wallet for Web (`https://walletpasses.io`-style behaviors on web).
- Custom UI for `PKAddPaymentPassViewController` (Wallet payment cards) — only `PKAddPassesViewController` is in scope.
- Automatic refresh of passes via push notifications.
- Pass updates (`PKPass.relevantDate`, `userInfo` mutation) beyond what the system view controller surfaces by default.
- Modifications to features 002–035 (other than the single-line registry edit and the single new plugin entry).

---

## Reporting

- **`SPECIFY_FEATURE_DIRECTORY`**: `specs/036-passkit-wallet`
- **`SPEC_FILE`**: `specs/036-passkit-wallet/spec.md`
- **Next phase**: `/speckit.plan` (no clarifications outstanding; informed defaults documented in Assumptions).
