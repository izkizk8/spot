# Contract: Demo Block (SwiftUI ↔ RN echo)

Each of the five demo components in
`src/modules/swiftui-interop/demos/` adheres to the same shape, so
that the screen can compose them uniformly and tests can target them
by a common pattern.

## Component shape

Each `*Demo.tsx` (iOS), `*Demo.android.tsx`, and `*Demo.web.tsx`
default-exports a React component with this signature:

```ts
export function PickerDemo(): React.ReactElement;
export function ColorPickerDemo(): React.ReactElement;
export function DatePickerDemo(): React.ReactElement;
export function SliderDemo(): React.ReactElement;
export function StepperToggleDemo(): React.ReactElement;
```

- **No props.** Each demo owns its own state (research Decision 7).
- **Self-contained.** A demo MAY be mounted in isolation (e.g. by a
  unit test) and MUST render without external context beyond what the
  app shell already provides (theme provider, safe-area provider).

## Per-demo behavioural contract

For every demo, the platform-default (iOS) variant MUST satisfy:

1. **Render the SwiftUI control(s).** Imported from
   `@expo/ui/swift-ui`. Exact import names confirmed via the
   `Expo-UI-SwiftUI` skill at implement time.
2. **Hold the most recent value in React state.** A single `useState`
   slice per the data-model.
3. **Render an RN echo.** The echo uses `ThemedText` / `ThemedView`
   primitives and reflects the latest value:
   - Picker → `ThemedText` displaying the selected option's `label`.
   - ColorPicker → an RN swatch (`ThemedView` with `backgroundColor`
     style **value** computed from state — permitted dynamic value).
   - DatePicker → `ThemedText` showing the date in a readable format.
   - Slider → an RN bar (`ThemedView` with `width: '${value}%'`
     style value computed from state).
   - StepperToggle → `ThemedText` showing both the integer and the
     boolean.
4. **Render a caption.** A short `ThemedText` block of the form
   `"This is a real SwiftUI <Name>; the value below is read in
   React."` (FR-011, SC-004).

For each `.android.tsx` / `.web.tsx` variant:

5. **MUST NOT import `@expo/ui/swift-ui`** anywhere in its module
   graph. Enforced by tests via
   `jest.mock('@expo/ui/swift-ui', () => { throw new Error(...) })`.
6. **MUST render an interactive RN equivalent** (research Decision 5)
   plus the same caption (the caption text MAY be rephrased to "RN
   fallback for SwiftUI <Name>"; the test does not pin exact
   wording).
7. **MUST hold the same state slice shape** as the iOS variant so
   that the screen can swap variants without changing surrounding
   layout assumptions.

## Test contract

For every demo `X` in {Picker, ColorPicker, DatePicker, Slider,
StepperToggle}, three Jest test files exist:

### `X.test.tsx` (iOS path, default platform)

- `jest.mock('@expo/ui/swift-ui', () => ...)` returns a host-View
  stand-in for each control that captures its change-callback prop
  (e.g. `onChange`, `onValueChange` — exact name confirmed via skill;
  the mock should expose all common names).
- Render the demo with `@testing-library/react-native`.
- Locate the control mock, fire its captured callback with a sample
  value.
- Assert the RN echo (text/swatch/bar) reflects the new value.
- Assert the caption is present.

### `X.android.test.tsx`

- `import { X } from '@/modules/swiftui-interop/demos/XDemo.android';`
  (explicit-filename import — bypasses Jest's iOS-default platform
  resolver, exactly mirroring
  `test/unit/components/glass/index.android.test.tsx`).
- `jest.mock('@expo/ui/swift-ui', () => { throw new Error('should not be imported on android'); });`
- Render the demo. Assert it renders without throwing (proves no
  accidental SwiftUI import).
- Interact with the fallback control (e.g. press a fallback chip)
  and assert the RN echo updates.

### `X.web.test.tsx`

- Symmetric to Android, importing `XDemo.web` directly with the same
  throw-on-import mock guarding `@expo/ui/swift-ui`.

## Screen integration

`screen.tsx`, `screen.android.tsx`, and `screen.web.tsx` MUST:

- Render the five demos in the order: `PickerDemo`,
  `ColorPickerDemo`, `DatePickerDemo`, `SliderDemo`,
  `StepperToggleDemo` (FR-004).
- The Android and Web screens MUST render a banner above the demos
  with the **exact** strings:
  - Android: `SwiftUI is iOS-only — here's the Material counterpart`
    (FR-012).
  - Web: `Native SwiftUI is iOS-only` (FR-015).
- The iOS screen MUST NOT render a fallback banner.

`screen.test.tsx` asserts the iOS path renders all five demos.
`screen.android.test.tsx` and `screen.web.test.tsx` assert the
banner text and the presence of all five fallback demos, both with
the throw-on-import mock for `@expo/ui/swift-ui` in place.
