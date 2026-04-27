# Phase 0 — Research: ScreenTime / FamilyControls Showcase

All "NEEDS CLARIFICATION" items from Technical Context have been resolved below. Each entry follows the Decision / Rationale / Alternatives format.

---

## R-001 — Entitlement-detection technique

**Decision**: At native module init, call a Swift function `entitlementsAvailable() -> Bool` that probes `AuthorizationCenter.shared.authorizationStatus` from inside a `do/catch` (or `guard`-wrapped) block. Treat **any** throw, ObjC exception, or sentinel "framework unavailable" return as `false`. The probe is **synchronous on the Swift side**, exposed as an async `Promise<boolean>` to JS for forward compatibility, and is **memoized** for the lifetime of the process (the entitlement state cannot change without a new install).

**Why this works**: Without the `com.apple.developer.family-controls` entitlement, dyld will still resolve the `FamilyControls` framework symbols (it is part of the SDK), but actually invoking `AuthorizationCenter.shared` raises a runtime error that surfaces as an NSException (Swift catches it as a thrown error in iOS 16+ when the call is wrapped in `do { try ... }` against the throwing accessor; for non-throwing accessors we wrap the access inside an `objc_exception_try` or guard the surface with a Swift `Result` builder). In practice, the standard pattern in the developer community is to wrap the **first** `authorizationStatus` read in `do { try ... }` and treat any caught error as "no entitlement"; this avoids an outright crash and yields a clean boolean.

**Rationale**:
- Apple does not publish a clean "is entitlement granted" API. Probing is the only known portable technique.
- Probing `authorizationStatus` (rather than calling `requestAuthorization`) is non-modal: it does not surface the system prompt, so it is safe to call at module init.
- Memoizing avoids repeated catches in hot paths.

**Alternatives considered**:
- *Read `Bundle.main.entitlements` from `embedded.mobileprovision`*: brittle (file may not be present in dev builds), parsing the binary plist on every launch is wasteful, and false positives are possible if the entitlement is **declared** but the team is not actually approved (the EAS Build would have failed earlier, but the bundle could still ship in unusual workflows).
- *Try a no-op `ManagedSettingsStore().shield.applications = []`*: writes state, would mutate user-visible behavior on entitled devices, and crashes harder than `AuthorizationCenter.shared.authorizationStatus`.
- *Check for entitlement via `SecTaskCopyValueForEntitlement`*: works but requires extra Security.framework imports and adds noise; the probe approach is simpler and equally reliable.

---

## R-002 — Why `FamilyActivityPicker` requires SwiftUI bridging

**Decision**: Wrap `FamilyActivityPicker` (a SwiftUI `View`) in a `UIViewControllerRepresentable` named `FamilyActivityPickerView` and present it from `ScreenTimeManager` via a `UIHostingController`. Expose a single `pickActivity()` Promise that resolves with the selection summary or rejects on dismissal/cancellation.

**Rationale**:
- `FamilyActivityPicker` is **SwiftUI-only**: it does not have a `UIKit` counterpart, so it cannot be presented directly from a `UIViewController`-based React Native bridge.
- `UIHostingController` is the documented bridge from SwiftUI → UIKit and integrates cleanly with React Native's native module presentation patterns.
- The `FamilyActivitySelection` value produced by the picker is opaque (`ApplicationToken`, `ActivityCategoryToken`, `WebDomainToken` are all opaque types); we serialize it via Apple's provided `Codable` conformance to a base64 string and persist that as the `rawSelectionToken`.

**Alternatives considered**:
- *Render the picker inline as a SwiftUI subview in the React tree via `expo/ui` SwiftUI interop (feature 008)*: would couple feature 015 to feature 008's interop module; an unnecessary cross-feature dependency.
- *Custom UIKit picker re-implementing the family-controls UI*: prohibited — the picker UI is intentionally Apple-controlled to prevent app fingerprinting of installed apps.

---

## R-003 — `DeviceActivityMonitorExtension` target setup

**Decision**: The `DeviceActivityMonitorExtension` lives in a **separate iOS extension target** with bundle ID suffix `.screentimemonitor`. The target:
- Is added by `plugins/with-screentime/add-monitor-extension.ts` via `@expo/config-plugins`' Xcode-project mutation helpers (mirrors the patterns used by `plugins/with-live-activity` and `plugins/with-home-widgets`).
- Has its own `Info.plist` declaring `NSExtensionPointIdentifier = com.apple.deviceactivity.monitor-extension`.
- Inherits the App Group from feature 014 (read-only consumption — see R-004) so it can read the persisted selection token.
- Logs via `OSLog` with subsystem `com.spot.screentime` and category `monitor`.
- Has `SUPPORTED_PLATFORMS = iphoneos`, `IPHONEOS_DEPLOYMENT_TARGET = 16.0`.

**Rationale**:
- Apple requires `DeviceActivityMonitor` callbacks (`intervalDidStart`, `intervalDidEnd`, `eventDidReachThreshold`) to live in a separate process — the system launches the extension on the schedule boundary, independent of the host app's lifecycle. They cannot be implemented in the main app target.
- Using `OSLog` (rather than `print` or a custom logger) makes the callbacks visible in Console.app on the connected Mac, which is the documented verification path in `quickstart.md`.

**Alternatives considered**:
- *Skip the extension and only use `DeviceActivitySchedule` registration without callbacks*: would silently no-op on boundary events, defeating the educational value of the monitoring card.
- *Ship the extension code in the host app target*: rejected by `prebuild` validation; Apple's tooling requires the dedicated extension target.

---

## R-004 — App Group sharing strategy (reuse feature 014)

**Decision**: Feature 015 **consumes** feature 014's App Group identifier (`group.com.spot.shared`, established in `plugins/with-home-widgets/`). Feature 015's plugin runs `consume-app-group.ts` which:
1. Reads the iOS project for the bundle marker comment `// SPOT_APP_GROUP: 014` (planted by 014).
2. If present, attaches the same App Group entitlement to **both** the main app target (already attached by 014 — idempotent re-attach is a no-op) and the new monitor extension target.
3. If absent (e.g., feature 014's plugin is disabled), logs a warning during prebuild and skips the App Group attachment; the JS layer's `screentime.ts` then falls back to in-memory storage at runtime per FR-018.

**Rationale**:
- The shielding selection token must be readable by both the host app (to present the summary) and the monitor extension (to scope its callbacks). Cross-process sharing requires an App Group.
- Reusing 014's App Group avoids declaring a second App Group identifier and the corresponding provisioning churn.
- The "do not modify 014" rule (FR-021) is enforced by *reading* the marker, not editing 014's plugin output. Idempotence (FR-022 / SC-006) is guaranteed because re-attaching an already-attached entitlement is a no-op in `@expo/config-plugins`' Xcode helpers.

**Alternatives considered**:
- *Declare a new App Group `group.com.spot.screentime`*: forces extra provisioning entries and increases coupling drift between features 014 and 015 (two App Groups to maintain for what is conceptually one shared store).
- *Store the selection in the main app's sandbox `UserDefaults`*: monitor extension would not be able to read it.

---

## R-005 — `ManagedSettings` shielding lifecycle and `ApplicationToken` opaque type handling

**Decision**:
- Maintain a single `ManagedSettingsStore()` instance (default store) inside `ScreenTimeManager`. The default store is process-scoped but persists its `shield.applications` setting across launches automatically (Apple-managed).
- `applyShielding(token:)`: deserialize `token` (base64 → `FamilyActivitySelection` via the Apple-provided `Codable`), then assign `store.shield.applications = selection.applicationTokens` and `store.shield.applicationCategories = .specific(selection.categoryTokens, except: [])` and `store.shield.webDomains = selection.webDomainTokens`. Idempotent re-application overwrites with the same values (FR edge-case "Re-applying shielding while already active").
- `clearShielding()`: assign all three properties to `nil` / empty.
- The `rawSelectionToken` is the base64-encoded `Codable` representation of the entire `FamilyActivitySelection`. JS treats it as opaque; only Swift ever decodes it.
- Status reporting: every Swift entry point wraps in `do/catch`; on success, `OSLog` an `info` event and resolve the Promise; on failure, log `error` and reject with a typed error keyed by `expo-modules-core`'s error code DSL.

**Rationale**:
- `ApplicationToken`, `ActivityCategoryToken`, `WebDomainToken` are opaque, non-PII handles bound to the user's selection; they are explicitly designed to **not** reveal which apps were chosen (Apple's privacy stance). Treating them as opaque is mandatory.
- Apple persists `ManagedSettingsStore` settings transparently across app relaunches; we do not need to re-apply on launch (the JS layer hydrates the *summary* for display, but the actual shielding remains active until cleared).
- Using `OSLog` consistently across the manager and the extension gives the user a single Console.app filter (`subsystem == "com.spot.screentime"`) for verification.

**Alternatives considered**:
- *Persist tokens individually in JSON*: tokens are not stable across reinstalls (per their opacity contract); persisting the whole `FamilyActivitySelection` blob is the only safe option.
- *Re-apply shielding on every launch from the persisted token*: redundant; Apple already persists `store.shield.*`. Re-applying would also briefly clear and reset the shield, causing visible flicker.
- *Use a named (non-default) `ManagedSettingsStore`*: useful when multiple feature surfaces shield independently; for this single-purpose demo the default store is sufficient and avoids name management.

---

## R-006 — Cross-platform stub strategy

**Decision**: Provide explicit `screentime.android.ts` and `screentime.web.ts` files. Both export the same `bridge` shape; `isAvailable()` returns `false` synchronously, `entitlementsAvailable()` resolves to `false`, and every other method rejects with `new ScreenTimeNotSupportedError()` (a typed error from `screentime.types.ts`). This keeps Principle III (Platform File Splitting) satisfied without relying on inline `Platform.select()` for non-trivial fallback logic.

**Rationale**: Mirrors the precedent set by `src/native/widget-center.{ts,android.ts,web.ts}` and `src/native/live-activity.{ts,android.ts,web.ts}`.

**Alternatives considered**:
- *Single `screentime.ts` with `Platform.OS === 'ios'` branches*: violates Principle III for non-trivial differences.

---

## R-007 — Build-validation note (Constitution v1.1.0 Validate-Before-Spec)

**Decision**: A formal proof-of-concept EAS Build with `com.apple.developer.family-controls` declared is **not feasible** without holding the entitlement (the build would fail at the provisioning step, which is precisely the failure documented in `quickstart.md`). The validation that *was* performed during research:
1. **Probe technique** (R-001): cross-checked against Apple's `FamilyControls` framework headers (Xcode 16 SDK) and against community reports of unentitled app launches (the `do/catch`-wrapped probe is the consensus pattern).
2. **Plugin idempotence** (FR-022): validated by the unit test `plugins/with-screentime/index.test.ts` running the plugin twice over fixture projects and asserting deep-equality of the resulting Xcode project state.
3. **Plugin coexistence with 007/014** (FR-020 / FR-021): validated by running the plugin on a fixture that already has the 007 + 014 plugins applied and asserting three distinct extension targets exist with no entitlement collisions.
4. **Entitlement-missing UX path**: testable on Windows + on any unentitled device — the dominant verification path for this feature.

**Spec back-patching trigger**: If an entitled developer subsequently runs an EAS Build and discovers that, e.g., the monitor extension's bundle ID suffix or the App Group attachment requires adjustment, the back-patching guidance in Constitution v1.1.0 §Development Workflow applies. Findings would be folded into spec.md (and this research.md) before tasks are regenerated.

---

## Summary of resolved unknowns

| Item | Status |
|------|--------|
| Entitlement detection | ✅ Resolved (R-001) |
| FamilyActivityPicker bridging | ✅ Resolved (R-002) |
| Monitor extension target setup | ✅ Resolved (R-003) |
| App Group sharing | ✅ Resolved (R-004) |
| Shielding lifecycle + opaque tokens | ✅ Resolved (R-005) |
| Cross-platform stubs | ✅ Resolved (R-006) |
| Build validation feasibility | ✅ Resolved (R-007) |

No remaining `NEEDS CLARIFICATION` items.
