# Feature 060 — Visual Look Up

**Slug:** 060-visual-look-up
**Branch:** 060-visual-look-up (based on 053-swiftdata)
**iOS min:** 15.0

## Overview

Visual Look Up (VisionKit `ImageAnalysisInteraction` + `VNAnalyzer`) lets users long-press an image to identify subjects, look up QR/barcodes, and trigger the system "Look Up" popover. This lab exposes the bridge, demonstrates live image analysis, and surfaces per-subject labels, confidence scores, and bounding boxes.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | iOS 15+ only; Android and Web show `IOSOnlyBanner`. |
| FR-002 | `VisualLookUpBridge.isSupported()` returns `true` on iOS 15+. |
| FR-003 | `VisualLookUpBridge.analyzeImage(imageUri)` returns subjects with label, confidence, and bounding box. |
| FR-004 | The capability card shows support status and the analysed image URI. |
| FR-005 | The subjects list renders one row per detected subject. |
| FR-006 | A "Demo" button triggers analysis on a bundled sample URI placeholder. |
| FR-007 | Setup instructions explain `ImageAnalysisInteraction` and `NSPhotoLibraryUsageDescription`. |
| FR-008 | `with-visual-look-up` plugin writes `NSPhotoLibraryUsageDescription` to Info.plist (idempotent, preserves operator values). |

## Non-functional Requirements

- Bridge mocked at import boundary via `__setVisualLookUpBridgeForTests`.
- All styles via `StyleSheet.create`, no inline styles.
- `ThemedText` / `ThemedView` only; `Spacing` scale from `constants/theme`.
- Single quotes throughout.
- Zero `eslint-disable` comments.
