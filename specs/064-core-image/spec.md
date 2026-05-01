# 064 Core Image — Specification

## Feature Slug
`064-core-image`

## Summary
Educational showcase of built-in CIFilter effects available on iOS via the CoreImage framework.
Demonstrates sepia, Gaussian blur, vignette, colour-invert, photo-noir, and luminance-sharpen
applied to a built-in reference image.  Android and web render an IOSOnlyBanner gate.

## Platforms
| Platform | Support |
|----------|---------|
| iOS      | Full (CIFilter, requires iOS 13+) |
| Android  | IOSOnlyBanner |
| Web      | IOSOnlyBanner |

## Functional Requirements
- FR-001: Module manifest exposes id `core-image-lab`, title "Core Image", platforms `['ios','android','web']`, minIOS `'13.0'`.
- FR-002: On iOS show a CapabilityCard with `CICapabilities` (available flag, filter count).
- FR-003: Present a FilterPicker listing all six built-in filters.
- FR-004: Present a FilterCard for the selected filter with its parameter sliders.
- FR-005: Present a FilterPreview showing the last applied-filter result URI.
- FR-006: Present a SetupInstructions card documenting the CIFilter setup.
- FR-007: The native bridge (`src/native/core-image.ts`) exposes `getCapabilities` and `applyFilter`.
- FR-008: Android and web stubs reject all calls with `CoreImageNotSupported`.
- FR-009: `__setCoreImageBridgeForTests` seam on the hook for unit testing.

## Non-Functional Requirements
- No Expo plugin required (CIFilter needs no Info.plist keys).
- Zero eslint-disable comments.
- All styles via `StyleSheet.create`; spacing via `Spacing` constants.
