---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (Associated Domains requires native iOS build)
  - iPhone running iOS 9+
  - Control of a domain to host `apple-app-site-association` (AASA) file
  - Apple Developer account (paid account required for Associated Domains entitlement)
---

# How to verify Universal Links on iPhone

## Goal
Confirm the Associated Domains entitlement is correctly configured, the AASA file
is served with the right Content-Type, tapping a universal link (from Safari, Notes,
or Messages) opens the app directly instead of the browser, and the in-app route
matches the tapped URL path.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 9+
- Paid Apple Developer account (Associated Domains capability enabled)
- AASA file hosted at `https://<domain>/.well-known/apple-app-site-association`
  with Content-Type `application/json`

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
4. In Safari on the iPhone, open
   `https://<your-domain>/.well-known/apple-app-site-association` — confirm a
   valid JSON blob with your Team ID and Bundle ID is served.
5. Open the Notes app; type `https://<your-domain>/modules/universal-links` and
   long-press → tap the URL — Spot app opens (not Safari).
6. Confirm the in-app screen navigates to the **"Universal Links"** module.
7. In the app, the Universal Links screen shows the last opened URL path.
8. From Safari, open `https://<your-domain>/modules/arkit` — confirm app opens
   directly to the ARKit module.

## Verify
- AASA file is reachable and valid JSON with correct `appID`
- Tapping a universal link opens the app (not Safari)
- URL path maps to the correct in-app route
- Last-opened universal link URL is displayed in the module
- If app is not installed: link opens in Safari (correct fallback)

## Troubleshooting
- **Safari opens instead of app** → re-install the app; iOS re-validates the AASA
  at install time; also check the AASA Content-Type header (`application/json`)
- **AASA validation fails** → use Apple's AASA validator tool at
  `https://branch.io/resources/aasa-validator/` or
  `https://app-site-association.cdn-apple.com/a/v1/<domain>`
- **Route not matching** → confirm `expo-router` has the correct `href` path
  registered for the universal link pattern

## Implementation references
- Spec: `specs/041-universal-links/spec.md`
- Plan: `specs/041-universal-links/plan.md`
- Module: `src/modules/universal-links-lab/`
- Native bridge: `src/native/universal-links.ts`
- Plugin: `plugins/with-universal-links/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows