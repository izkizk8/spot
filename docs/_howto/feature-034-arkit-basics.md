---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode 15+ (ARKit requires native iOS build; no simulator support)
  - iPhone running iOS 11+ with A9 chip or later (required for ARKit)
  - Apple Developer account (free tier sufficient)
---

# How to verify ARKit Basics on iPhone

## Goal
Confirm ARWorldTrackingConfiguration initialises, horizontal and vertical plane
detection works, object placement anchors persist, and the debug visualisation
(feature points, plane extent) renders correctly.

## Prerequisites
- macOS with Xcode 15+
- iPhone running iOS 11+ with A9+ chip (iPhone 6s or later)
- `with-arkit` plugin registered in `app.json` (adds `NSCameraUsageDescription`,
  `ARWorldTrackingConfiguration` entitlement)

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
4. In the app, navigate to **"ARKit"** in the Modules tab.
5. Grant camera permission when prompted.
6. Point the camera at a flat surface (table / floor) — confirm feature points
   (yellow dots) appear within 5 s.
7. Confirm at least one horizontal plane detected (grey mesh overlay).
8. Tap a detected plane — confirm a virtual cube anchors to the plane.
9. Walk around the cube — confirm the anchor holds and the cube does not drift.
10. Toggle **Vertical Planes** — point at a wall — confirm a vertical plane mesh appears.
11. Toggle **Debug Visualisation** off — confirm raw camera view with placed cube only.

## Verify
- Camera permission prompt appears on first launch
- Feature point cloud renders over tracked surfaces
- Horizontal plane detected within 10 s of scanning a flat surface
- Virtual object anchors correctly to tapped plane and does not drift
- Vertical plane detection activates when toggle enabled
- On non-ARKit devices: in-app banner "ARKit requires A9 chip or later"
- On Android: ARCore path used; plane detection equivalent verified

## Troubleshooting
- **Black screen after camera permission** → ensure `with-arkit` plugin is in
  `app.json` and a fresh prebuild ran; raw camera permission alone is insufficient
  for ARKit — the entitlement must also be present
- **Plane detection never fires** → move to a well-lit area with distinct texture;
  plain white floors or dark environments degrade tracking
- **App crashes on ARKit init** → check Xcode console for "Failed to create ARSession"
  — likely occurring on a simulator or non-A9 device

## Implementation references
- Spec: `specs/034-arkit-basics/spec.md`
- Plan: `specs/034-arkit-basics/plan.md`
- Module: `src/modules/arkit-lab/`
- Native bridge: `src/native/arkit.ts`
- Native Swift: `native/ios/arkit/`
- Plugin: `plugins/with-arkit/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows