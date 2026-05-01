---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Focus Filters requires native iOS build)
  - iPhone running iOS 16+
  - Apple Developer account (free tier sufficient)
---

# How to verify Focus Filters on iPhone

## Goal
Confirm the Focus Filter extension surfaces in iOS Focus settings, applies the
registered filter values when that Focus is active, and removes the filter when
Focus is deactivated.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 16+
- `with-focus-filters` plugin registered in `app.json` (registers the
  `AppIntentConfiguration` Focus filter extension)

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
4. In the app, navigate to **"Focus Filters"** in the Modules tab.
5. Confirm the current Focus state card shows the active/inactive Focus name.
6. Open Settings → Focus → Work (or create a custom Focus).
7. Tap **Add Filter** → scroll to **Spot** → select the filter → configure
   the filter parameter value → tap **Add**.
8. Activate the Work Focus via Control Center — observe the in-app Focus Filter
   card updates to reflect the applied filter values.
9. Deactivate the Focus — confirm the filter values revert to defaults.

## Verify
- Spot focus filter appears in Settings → Focus → [any Focus] → Add Filter
- Activating a Focus with the Spot filter applied changes in-app behavior
- Deactivating the Focus reverts filter values
- On iOS < 16: in-app banner "Focus Filters require iOS 16+"; module grayed out

## Troubleshooting
- **Spot not appearing in Add Filter list** → ensure `with-focus-filters` is in
  `app.json` plugins and a fresh prebuild ran; Focus Filters require App Intents
  extension; verify the extension target is included in the build
- **Filter values not updating in app** → confirm the bridge listens to
  `FocusFilterIntent.current` and observes `NSNotification.Name.NSExtensionHostDidBecomeActive`
- **Filter configuration blank** → the intent parameter must have a valid
  `AppEnum` conformance or `StringLiteralType` for the UI to show controls

## Implementation references
- Spec: `specs/029-focus-filters/spec.md`
- Plan: `specs/029-focus-filters/plan.md`
- Module: `src/modules/focus-filters-lab/`
- Native bridge: `src/native/focus-filters.ts`
- Plugin: `plugins/with-focus-filters/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows