# Feature 071 — SiriKit Custom Intents

**Status**: Specified  
**Branch**: `071-sirikit`  
**Parent**: `053-swiftdata`

## Summary

An additive iOS-10+ educational module demonstrating **SiriKit Custom Intents**
(the legacy INIntent / INExtension framework). Shows intent types, the handling
lifecycle, vocabulary registration, and the NSSiriUsageDescription requirement.

This is the Nth module in the showcase registry. It follows the established
lab-module shape: manifest, iOS screen, Android/web gates, iOS-only bridge
stub, and JS-pure unit tests with the native module mocked at the import
boundary.

## User stories

- **US1** (must) — Developer sees available intent domain categories.
- **US2** (must) — Developer can simulate an intent lifecycle (pending → handling → response).
- **US3** (must) — Developer sees vocabulary registration info (user-specific vs app-specific).
- **US4** (must) — On Android / web the module shows an iOS-only banner.
- **US5** (should) — Setup instructions describe INExtension, Info.plist keys, and the Intents extension target.
