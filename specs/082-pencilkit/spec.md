# Feature 082 — PencilKit Drawing Canvas

## Summary

Educational lab module wrapping Apple's **PencilKit** framework on iOS 17+.
Surfaces the `PKCanvasView`, `PKDrawing`, and `PKToolPicker` APIs through an
Expo Module bridge so JS can drive a hosted ink canvas without owning any
UIKit views directly.

## Goals

- Render a capability card showing canvas availability, Apple Pencil
  detection, and the active drawing policy.
- Allow switching between the six PencilKit tool variants
  (`pen`, `pencil`, `marker`, `crayon`, `eraser`, `lasso`).
- Allow toggling `PKCanvasView.drawingPolicy` between `default`,
  `anyInput`, and `pencilOnly`.
- Surface live drawing stats (stroke count, serialized data length,
  bounding-box dimensions).
- Document the project-side setup required to host a PencilKit canvas in
  an Expo / React Native app.

## Non-goals

- Implementing the actual Swift Expo Module that hosts `PKCanvasView`.
  That work is **deferred** — this feature delivers the JS surface
  (types, bridge stubs, hook, components, registry entry, tests). The
  drawing area is rendered as an educational placeholder.
- Persistence beyond the JS-side `exportDrawingData` / `importDrawingData`
  contract.

## Platform support

| Platform | Behaviour |
|----------|-----------|
| iOS 17+  | Full feature surface (placeholder canvas until native module ships) |
| Android  | `IOSOnlyBanner` |
| Web      | `IOSOnlyBanner` |

## Apple framework notes

- `PKCanvasView` — UIKit view that owns the ink stack.
- `PKDrawing` — value type that holds strokes; serializable via
  `dataRepresentation()` / `init(data:)`.
- `PKToolPicker` — floating tool palette (`pen`, `pencil`, `marker`,
  `crayon`, `eraser`, `lasso`).
- No Info.plist key, capability, or entitlement is required; just
  `import PencilKit` in Swift.

## User stories

1. As a developer, I can see whether PencilKit is available on the
   current device and whether an Apple Pencil is paired.
2. As a developer, I can pick a tool and see the selection feed back to
   the (placeholder) canvas.
3. As a developer, I can toggle `drawingPolicy` to restrict input to
   Apple Pencil only.
4. As a developer, I can read a copy-pasteable Swift setup checklist for
   wiring `PKCanvasView` + `PKToolPicker` in a host app.

## Deferred work

The Swift Expo Module that hosts `PKCanvasView` (and forwards the
`PKCanvasViewDelegate` callbacks back to JS) is intentionally not part of
this feature. It will be implemented in a follow-up once the JS contract
is in place.
