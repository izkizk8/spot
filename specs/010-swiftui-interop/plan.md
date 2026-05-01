# Implementation Plan: SwiftUI Interop Showcase

**Branch**: `010-swiftui-interop` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: [`specs/010-swiftui-interop/spec.md`](./spec.md)

## Summary

Add a new module `swiftui-interop` to the iOS Feature Showcase plugin
registry that mounts **real SwiftUI views** inline inside an Expo
React Native screen via `@expo/ui/swift-ui` on iOS 16+, with five
interactive demo blocks (Picker, ColorPicker, DatePicker, Slider,
Stepper + Toggle). Each demo holds local state and renders an RN echo
(text label, swatch, or bar) to prove SwiftUI → JS → RN value flow.
Android and Web get a banner + per-demo RN fallbacks via the project's
existing `.android.tsx` / `.web.tsx` platform-resolver pattern, and the
`@expo/ui/swift-ui` import never enters the non-iOS bundles. Tests are
JS-pure (Jest on Windows): per-demo iOS tests mock `@expo/ui/swift-ui`
and assert RN echo updates; per-demo fallback tests use the
explicit-filename import trick (importing `.android.tsx` / `.web.tsx`
directly) plus a throw-on-import mock to prove no SwiftUI code path is
reachable. Manual on-device verification is documented in
[`quickstart.md`](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React
Native 0.83, Expo SDK 55. Constitution v1.0.1 (file header records
v1.1.0 — both retain TS strict + StyleSheet + ThemedText/ThemedView +
`@/*` alias requirements that this plan honors).
**Primary Dependencies**: `@expo/ui` (provides `@expo/ui/swift-ui`) —
**not yet installed**. Plan adds it via `npx expo install @expo/ui`.
Existing: `react-native`, `expo`, themed primitives, `Spacing` scale.
**Storage**: N/A (in-memory React state per demo, discarded on
unmount per FR-022 / Out-of-Scope).
**Testing**: Jest + `@testing-library/react-native` on Windows host;
no native unit tests. Manual on-device verification on iOS 16+ device
documented in `quickstart.md`.
**Target Platform**: iOS 16+ (real SwiftUI), Android (RN fallback),
Web (RN-Web fallback). Module manifest declares
`platforms: ['ios','android','web']` and `minIOS: '16.0'`.
**Project Type**: mobile-app (Expo Router single project).
**Performance Goals**: SC-002 — SwiftUI control change → RN echo
update in <100 ms on current-gen iOS hardware (well within React
state update budget; no animation frame coupling required).
**Constraints**: Additive only. Exactly one line added to
`src/modules/registry.ts` (SC-006). No global state, no new lint/test
tooling, no new bridging layers (FR-020/021/022/024). `@expo/ui/swift-ui`
MUST NOT be reachable from Android or Web bundles (FR-014/017).
**Scale/Scope**: 1 module, 5 demo components × 3 platform variants
(iOS real / Android fallback / Web fallback) + 1 screen × 3 variants
+ 1 manifest. ~10 source files, ~10 test files.

### Library decision: `@expo/ui/swift-ui`

The implement-phase agent **MUST** invoke the project's
`Expo-UI-SwiftUI` skill via the `skill` tool **before writing code**
to confirm the exact import names, prop shapes, and `onChange`
callback signatures of `Picker`, `ColorPicker`, `DatePicker`,
`Slider`, `Stepper`, and `Toggle`. The skill is the authoritative
source for the API — this plan deliberately does not pin
component-level prop names because they may have changed since the
spec was drafted. See `research.md` for the assumptions captured
here and the gaps the skill must close.

If `@expo/ui` is missing from `package.json` (verified: it is, as of
this plan), the very first implementation task is:

```sh
npx expo install @expo/ui
```

followed by a clean install (`pnpm install`) and a
`pnpm typecheck` to confirm types resolve.

## Constitution Check

Constitution at `.specify/memory/constitution.md` (v1.0.1 per spec
SC-008; file currently shows v1.1.0 — both versions impose the same
gates evaluated below).

| Principle | Status | How this plan complies |
|---|---|---|
| I. Cross-Platform Parity | ✅ | Module declares all three platforms. iOS gets real SwiftUI; Android/Web get a banner + RN equivalents via `.android.tsx` / `.web.tsx`. Spec acceptance scenarios exist for all three. |
| II. Token-Based Theming | ✅ | All static surfaces use `ThemedText` / `ThemedView` and `useTheme()`. The only acknowledged dynamic style values are the Slider-driven bar width and the ColorPicker-driven swatch tint — both derive from runtime state, not hardcoded literals (FR-023). |
| III. Platform File Splitting | ✅ | Per-demo and per-screen variants live in `.android.tsx` / `.web.tsx` siblings of the iOS-default `.tsx` file. No inline `Platform.OS` for non-trivial branching. The single banner-text difference between Android and Web is a literal string per file, not a `Platform.select()` ladder. |
| IV. StyleSheet Discipline | ✅ | All styles via `StyleSheet.create()` using the `Spacing` scale (FR-023). The two dynamic values noted above are passed as inline style **values** computed from state — permitted as a "single-value difference" by the constitution. |
| V. Test-First for New Features | ✅ | Per-demo iOS test, per-demo fallback test (.android + .web), `screen.test.tsx` integration, and `manifest.test.ts` are written alongside or before each implementation file. JS-only; on-device manual verification documented in `quickstart.md`. |
| Tech constraints (TS strict, `@/*` alias, no Animated, no inline-style libs) | ✅ | Module is plain RN + `@expo/ui/swift-ui`; no animation framework needed; imports use `@/modules/...`, `@/components/...`. |
| Validate-Before-Spec (build-pipeline features) | n/a | This is a feature module, not a build/infra change. The library's behavior is validated indirectly via the implement-phase skill consult and on-device run in quickstart. |

**Gate result**: PASS. No Complexity Tracking entries required.

Re-check after Phase 1: PASS — design artifacts (data-model, contracts,
quickstart) introduce no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-swiftui-interop/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual on-device steps)
├── contracts/
│   ├── module-manifest.md   # Manifest contract (extends @/modules/types)
│   └── demo-block.md        # Per-demo SwiftUI ↔ RN echo contract
├── spec.md
└── checklists/
```

### Source Code (repository root)

```text
src/modules/swiftui-interop/
├── index.tsx                       # ModuleManifest (1-line export)
├── screen.tsx                      # iOS screen — composes 5 demo blocks
├── screen.android.tsx              # Android banner + RN fallbacks
├── screen.web.tsx                  # Web banner + RN-Web fallbacks
└── demos/
    ├── PickerDemo.tsx              # iOS: real SwiftUI Picker(s) + RN echo
    ├── PickerDemo.android.tsx      # RN @react-native-picker/picker or segmented fallback
    ├── PickerDemo.web.tsx          # RN-Web / <select> fallback
    ├── ColorPickerDemo.tsx         # iOS: real SwiftUI ColorPicker
    ├── ColorPickerDemo.android.tsx # RN swatch grid fallback
    ├── ColorPickerDemo.web.tsx     # <input type=color> wrapper
    ├── DatePickerDemo.tsx          # iOS: real SwiftUI DatePicker (compact + wheel)
    ├── DatePickerDemo.android.tsx  # RN date input fallback
    ├── DatePickerDemo.web.tsx      # <input type=date> wrapper
    ├── SliderDemo.tsx              # iOS: real SwiftUI Slider
    ├── SliderDemo.android.tsx      # @react-native-community/slider OR segmented fallback
    ├── SliderDemo.web.tsx          # <input type=range> wrapper
    ├── StepperToggleDemo.tsx       # iOS: real SwiftUI Stepper + Toggle
    ├── StepperToggleDemo.android.tsx
    └── StepperToggleDemo.web.tsx

src/modules/registry.ts             # +1 import line, +1 array entry (only edit outside the module dir)
```

```text
test/unit/modules/swiftui-interop/
├── manifest.test.ts                       # id/platforms/minIOS gate
├── screen.test.tsx                        # iOS path: all 5 blocks render
├── screen.android.test.tsx                # Banner + fallbacks; jest.mock @expo/ui/swift-ui to throw
├── screen.web.test.tsx                    # Banner + fallbacks; same throw-mock
└── demos/
    ├── PickerDemo.test.tsx                # iOS: mock @expo/ui/swift-ui, fire onChange, assert RN echo
    ├── PickerDemo.android.test.tsx        # Explicit-filename import; throw-mock guard
    ├── PickerDemo.web.test.tsx            # Explicit-filename import; throw-mock guard
    ├── ColorPickerDemo.test.tsx
    ├── ColorPickerDemo.android.test.tsx
    ├── ColorPickerDemo.web.test.tsx
    ├── DatePickerDemo.test.tsx
    ├── DatePickerDemo.android.test.tsx
    ├── DatePickerDemo.web.test.tsx
    ├── SliderDemo.test.tsx
    ├── SliderDemo.android.test.tsx
    ├── SliderDemo.web.test.tsx
    ├── StepperToggleDemo.test.tsx
    ├── StepperToggleDemo.android.test.tsx
    └── StepperToggleDemo.web.test.tsx
```

**Structure Decision**: Mirrors the canonical platform-split pattern
established by `src/components/glass/` (`index.tsx` / `index.android.tsx` /
`index.web.tsx`) and the per-module manifest pattern of
`src/modules/sf-symbols-lab/` and `src/modules/liquid-glass-playground/`.
The bundler resolves `screen.tsx` and each `demos/<Name>.tsx` per
platform automatically; iOS-only `@expo/ui/swift-ui` imports live
**only** in the iOS-default `.tsx` files, which Metro never resolves on
Android/Web — guaranteeing FR-014 / FR-017 by construction. Tests use
the explicit-filename import trick (e.g.
`import { PickerDemo } from '@/modules/swiftui-interop/demos/PickerDemo.android'`)
to load the non-iOS variant under Jest, paired with
`jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not import') })`
to fail loudly if the wrong code path ever pulls the iOS-only package.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
