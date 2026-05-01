---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (CoreSpotlight requires native iOS build)
  - iPhone running iOS 9+
  - Apple Developer account (free tier sufficient)
---

# How to verify Spotlight Indexing on iPhone

## Goal
Confirm CSSearchableItem objects are indexed successfully, appear in iOS Spotlight
search results, trigger an in-app navigation on tap, and can be deleted from the index.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 9+
- `with-spotlight` plugin registered in `app.json`

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
4. In the app, navigate to **"Spotlight"** in the Modules tab.
5. Tap **Index Sample Items** — confirm a success toast.
6. Press the Home button to go to the Home Screen.
7. Swipe down to open Spotlight (or pull down from the middle of the Home Screen).
8. Type "spot" — confirm at least one item from the app appears with the custom
   icon and description.
9. Tap the Spotlight result — confirm the app opens and navigates to the correct item.
10. Back in the module, tap **Delete Item** for one item, then search Spotlight again
    to confirm it no longer appears.

## Verify
- Sample items appear in Spotlight after indexing
- Tapping a Spotlight result opens the app and deep-links to the item
- Deleted items no longer appear in Spotlight
- Spotlight results display correct title, description, and thumbnail icon
- On Android: equivalent `FirebaseAppIndexing` path tested; module hidden on non-iOS

## Troubleshooting
- **Items not appearing in Spotlight** → Spotlight can take a few minutes to index;
  try force-quitting and re-opening the app; also ensure Settings → Siri & Search →
  Spot → Search & Siri Suggestions are enabled
- **Deep link on tap not firing** → confirm `onContinueUserActivity` delegate
  is implemented in AppDelegate and routes the `CSSearchableItemActionType`
- **Index fails with "domain not found"** → ensure a unique `domainIdentifier`
  is provided in every CSSearchableItemAttributeSet

## Implementation references
- Spec: `specs/031-spotlight-indexing/spec.md`
- Plan: `specs/031-spotlight-indexing/plan.md`
- Module: `src/modules/spotlight-lab/`
- Native bridge: `src/native/spotlight.ts`
- Plugin: `plugins/with-spotlight/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows