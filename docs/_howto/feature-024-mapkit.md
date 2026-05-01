---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (native MapKit bridge requires iOS build)
  - iPhone running iOS 13+
  - Apple Developer account (free tier sufficient)
---

# How to verify MapKit on iPhone

## Goal
Confirm MKMapView renders with all four map types, user-location works, annotations
and polylines are added correctly, the MapKit Search bridge returns local results,
and LookAround presents on iOS 16+ over supported regions.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 13+
- `react-native-maps` and `expo-location` installed
- `with-mapkit` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   npx expo install react-native-maps expo-location
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   npx expo run:ios --device
   ```
3. In the app, navigate to **"MapKit Lab"** in the Modules tab.
4. Confirm the map renders full-bleed with a 4-segment type control and toolbar.
5. Tap each type (Standard / Satellite / Hybrid / MutedStandard) — basemap changes.
6. Open the **Permissions** card → tap **Request when-in-use** → accept → Recenter moves
   camera to device location.
7. Open **Annotations** tab → toggle preset landmarks on/off; tap **Add at center**.
8. Open **Polyline** tab → tap **Draw sample loop** — closed overlay appears; tap **Clear**.
9. Open **Search** tab → type "coffee" → result list populates; tap a result →
   camera animates to that coordinate.
10. Open **LookAround** tab (iOS 16+) → tap **Show LookAround at center** → modal appears.

## Verify
- All four map types change the basemap correctly
- Recenter animates to device location after permission granted
- Annotations can be added and removed; polyline appears and clears
- Search returns non-empty results in a populated region
- LookAround modal appears on iOS 16+ over a supported location
- On Android: map renders via Google Maps; Search and LookAround show IOSOnlyBanner
- On web: map area shows placeholder; other panels render; Search/LookAround show IOSOnlyBanner

## Troubleshooting
- **Map appears blank on Android** → `react-native-maps` requires a Google Maps API key
  in `android/app/src/main/AndroidManifest.xml`
- **Search returns empty** → confirm device has network connectivity and the search
  query contains recognizable place names
- **LookAround unavailable** → ensure iOS 16+ and the pin location is in a LookAround-covered area

## Implementation references
- Spec: `specs/024-mapkit/spec.md`
- Plan: `specs/024-mapkit/plan.md`
- Module: `src/modules/mapkit-lab/`
- Native bridge: `src/native/mapkit-search.ts`, `src/native/lookaround.ts`
- Plugin: `plugins/with-mapkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows