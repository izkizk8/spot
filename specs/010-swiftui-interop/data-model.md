# Phase 1 Data Model: SwiftUI Interop Showcase

All entities are **transient, in-memory React state**. No storage, no
network, no schema migrations. Each demo block owns its slice
independently (no shared store) per Decision 7 of `research.md`.

## Module-level entity

### `ModuleManifest` (existing, from `@/modules/types`)

The `swiftui-interop` module reuses the project-wide `ModuleManifest`
contract — no new fields. Concrete values:

| Field | Value |
|---|---|
| `id` | `'swiftui-interop'` (matches `/^[a-z][a-z0-9-]*$/`) |
| `title` | `'SwiftUI Interop'` |
| `description` | One sentence (≤ ~80 chars), e.g. `'Real SwiftUI Picker, ColorPicker, DatePicker, Slider, Stepper & Toggle.'` |
| `icon.ios` | SF Symbol — confirm via skill; placeholder: `'swift'` |
| `icon.fallback` | A glyph string, e.g. `'🟦'` |
| `platforms` | `['ios', 'android', 'web']` |
| `minIOS` | `'16.0'` |
| `render` | `() => <SwiftUIInteropScreen />` |

**Validation invariants** (already enforced by
`test/unit/modules/registry.test.ts` and per-module `manifest.test.ts`):

- `id` unique across `MODULES`.
- `platforms` non-empty.
- `render` is a function returning a valid React element.

## Per-demo state slices

Each `*Demo.tsx` holds its own `useState` slice. There is no
cross-demo dependency.

### `PickerDemo` state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `selectedId` | `PickerOptionId` | first option's id | Drives both segmented and wheel SwiftUI Pickers (shared selection per spec FR-005). |

```ts
type PickerOptionId = 'one' | 'two' | 'three' | 'four';
interface PickerOption { readonly id: PickerOptionId; readonly label: string; }
const OPTIONS: ReadonlyArray<PickerOption> = [
  { id: 'one',   label: 'One'   },
  { id: 'two',   label: 'Two'   },
  { id: 'three', label: 'Three' },
  { id: 'four',  label: 'Four'  },
];
```

Validation: `selectedId` MUST be one of `OPTIONS[].id`.

### `ColorPickerDemo` state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `color` | `string` (RN-compatible color) | `'rgba(60,159,254,0.85)'` (aqua, matches existing token spirit) | Updated by the SwiftUI ColorPicker `onChange`, normalised through `toRNColor()` per research Decision 6. |

Validation: `color` MUST be a string parseable by RN as a
`backgroundColor` value. Helper guarantees this; on unrecognised input
the helper returns the previous value.

### `DatePickerDemo` state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `date` | `Date` | `new Date()` at first render (frozen for that mount) | Both compact and wheel SwiftUI DatePickers share this state per FR-008 ("the most recently changed picker"). |

Validation: `date` MUST be a valid `Date` instance (i.e.
`!Number.isNaN(date.getTime())`).

### `SliderDemo` state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `value` | `number` (0..100) | `50` | Drives the RN bar width as `${value}%` (FR-009). |

Validation: `0 <= value <= 100`. Implementation clamps in the
`onChange` handler defensively.

### `StepperToggleDemo` state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `count` | `number` (integer ≥ 0) | `0` | Driven by the SwiftUI Stepper. |
| `on` | `boolean` | `false` | Driven by the SwiftUI Toggle. |

Validation: `count` MUST be an integer ≥ 0. The SwiftUI Stepper
emits integers natively.

## Conceptual entities (per spec § Key Entities)

The spec defines `DemoBlock`, `PickerOption`, and `InteropState` as
conceptual entities. In implementation:

- **`DemoBlock`** is **not** a runtime data structure. It maps to a
  React component (`PickerDemo`, `ColorPickerDemo`, …) plus a static
  `caption` string defined in that component's source.
- **`PickerOption`** materialises as the `PickerOption` interface
  shown above, local to `PickerDemo.tsx`.
- **`InteropState`** is intentionally *not* materialised as a single
  type or store. The five per-demo slices above collectively
  represent it. Splitting state per demo is a deliberate decision
  (research Decision 7) for testability and to keep each demo
  independently mountable.

## State transitions

There are no multi-step state machines. Each slice has exactly one
transition: `initial → set(newValue)` driven by the SwiftUI control's
`onChange` callback (or the fallback control's equivalent on
Android/Web). Unmount discards all state — no cleanup hooks required.

## Relationships

None. The five demo blocks are siblings rendered in a vertical
`ScrollView` and share no state.
