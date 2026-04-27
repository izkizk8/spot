# Contract: `LiveActivityDemoAttributes` (Swift / ActivityKit)

The Swift `ActivityAttributes` declaration that the Widget Extension's
`ActivityConfiguration` consumes and that the main-app-side Expo native
module (`LiveActivityDemoModule.swift`) constructs at `Activity.request`
time. This file is the single Swift-side source of truth for the activity
shape and is referenced (not duplicated) by both the main app target and
the Widget Extension target.

## Source location

`ios-widget/LiveActivityDemoAttributes.swift`, copied/symbolic-referenced
into the iOS project by `plugins/with-live-activity/` at prebuild time.

## Swift declaration

```swift
import ActivityKit
import Foundation

@available(iOS 16.1, *)
public struct LiveActivityDemoAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Monotonically non-decreasing while running. Asserted >= 0 at
    /// every Activity.update call site.
    public var counter: Int

    public init(counter: Int) {
      precondition(counter >= 0, "LiveActivityDemoAttributes.counter must be >= 0")
      self.counter = counter
    }
  }

  /// Display name shown in the Lock Screen header and DI expanded view.
  /// Set once at Activity.request time, never mutated thereafter.
  public var name: String

  public init(name: String) {
    precondition(!name.isEmpty, "LiveActivityDemoAttributes.name must be non-empty")
    self.name = name
  }
}
```

## Render contract (Widget Extension)

`ios-widget/LiveActivityDemoWidget.swift` MUST declare exactly one
`ActivityConfiguration<LiveActivityDemoAttributes>` and MUST render *all*
of the following regions inside that single configuration:

- **Lock Screen view** — full-width row: SF Symbol (leading) +
  `attributes.name` + counter (trailing), with a SwiftUI `ProgressView`
  underneath bound to the derived `progress` value.
- **Dynamic Island compact leading** — the SF Symbol only.
- **Dynamic Island compact trailing** — the counter as text.
- **Dynamic Island expanded** — top region: SF Symbol + name; bottom
  region: counter + `ProgressView`.
- **Dynamic Island minimal** — the SF Symbol only.

The derived `progress` value MUST be computed view-side as
`min(1.0, Double(state.counter) / 10.0)` — it is NOT stored in
`ContentState` (R1, data-model E3).

All visuals MUST use SF Symbols and system colours only — no custom
fonts, no bundled images, no custom hex colours (FR-015).

## Authoring rules (native module side)

`ios-widget/LiveActivityDemoModule.swift` (the Expo native module living
in the *main app target*) MUST:
- Call `ActivityAuthorizationInfo().areActivitiesEnabled` before each
  `Activity.request` and surface a JS-side `LiveActivityAuthorisationError`
  if false (FR-019, FR-024).
- Refuse to start a second activity for `LiveActivityDemoAttributes` if
  `Activity<LiveActivityDemoAttributes>.activities` is non-empty;
  surface this as a typed JS-side error (spec edge case 2).
- Call `activity.end(dismissalPolicy: .immediate)` from `endActivity()`.
- Use `activity.update(using: .init(counter: n))` for `updateActivity`.

## Stability

The `ActivityAttributes` shape (one `name` + one `ContentState.counter`)
is stable for the lifetime of this feature. Adding fields to
`ContentState` is a breaking change for the activity (existing in-flight
activities cannot decode new fields) and requires either a new attributes
type or a feature spec amendment.
