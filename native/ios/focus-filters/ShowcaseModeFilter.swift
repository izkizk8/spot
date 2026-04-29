/**
 * ShowcaseModeFilter — SetFocusFilterIntent implementation for the "Showcase Mode" filter.
 *
 * iOS 16+ Focus Filter that exposes mode (relaxed/focused/quiet) and accentColor (blue/orange/green/purple)
 * parameters. Writes activation state to FocusFilterStorage for JS consumption.
 *
 * Auto-discovered by Settings → Focus → Add Filter (no AppShortcutsProvider needed).
 *
 * FR-FF-006, FR-FF-007, FR-FF-008, FR-FF-009, FR-FF-013, FR-FF-014
 * @see specs/029-focus-filters/tasks.md T055
 */

import AppIntents
import Foundation

@available(iOS 16.0, *)
public enum ShowcaseFilterMode: String, AppEnum, CaseIterable {
  case relaxed
  case focused
  case quiet
  
  public static var caseDisplayRepresentations: [ShowcaseFilterMode: DisplayRepresentation] {
    [
      .relaxed: DisplayRepresentation(stringLiteral: "Relaxed"),
      .focused: DisplayRepresentation(stringLiteral: "Focused"),
      .quiet: DisplayRepresentation(stringLiteral: "Quiet"),
    ]
  }
  
  public static var typeDisplayRepresentation: TypeDisplayRepresentation {
    TypeDisplayRepresentation(name: "Mode")
  }
}

@available(iOS 16.0, *)
public struct ShowcaseModeFilter: SetFocusFilterIntent {
  public static var title: LocalizedStringResource = "Showcase Mode"
  public static var description: IntentDescription = IntentDescription(
    "Tints the spot showcase to match your focus."
  )
  
  @Parameter(title: "Mode")
  public var mode: ShowcaseFilterMode = .relaxed
  
  @Parameter(title: "Accent Color")
  public var accentColor: String = "blue"
  
  public init() {}
  
  public init(mode: ShowcaseFilterMode, accentColor: String) {
    self.mode = mode
    self.accentColor = accentColor
  }
  
  public func perform() async throws -> some IntentResult {
    // R-B fallback: event derivation from activation flag is not exposed in iOS 16.0 SDK.
    // Default to 'activated' for all calls. The deactivation event can be inferred by
    // monitoring if the focus is no longer active in subsequent queries.
    let event = FocusFilterStorage.ShowcaseFilterEvent.activated
    
    // System-supplied focus name is not directly accessible via this API in iOS 16.0.
    // Leave focusName nil. This limitation is documented in R-B.
    let focusName: String? = nil
    
    let values = FocusFilterStorage.ShowcaseFilterValues(
      mode: mode.rawValue,
      accentColor: accentColor
    )
    
    FocusFilterStorage.write(values: values, event: event, focusName: focusName)
    
    return .result()
  }
}
