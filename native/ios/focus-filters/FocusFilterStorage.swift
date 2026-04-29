/**
 * FocusFilterStorage — App Group-based key-value storage for Focus Filter payloads.
 *
 * Writes filter activation state (mode, accent, event, updatedAt, focusName) to
 * UserDefaults in the shared App Group so JS can read it via the focus-filters bridge.
 *
 * FR-FF-011, FR-FF-012, FR-FF-013, FR-FF-040
 * @see specs/029-focus-filters/tasks.md T054
 */

import Foundation

// MIRRORS 014's AppGroupID — must match the App Group entitlement
private let AppGroupID = "group.com.example.spot"
private let StorageKey = "spot.focus.filterValues"

@available(iOS 16.0, *)
public enum FocusFilterStorage {
  
  public struct ShowcaseFilterValues: Codable {
    let mode: String
    let accentColor: String
  }
  
  public enum ShowcaseFilterEvent: String, Codable {
    case activated
    case deactivated
  }
  
  public struct Payload: Codable {
    let mode: String
    let accentColor: String
    let event: String
    let updatedAt: String
    let focusName: String?
  }
  
  /// Write filter activation state to the App Group.
  public static func write(
    values: ShowcaseFilterValues,
    event: ShowcaseFilterEvent,
    focusName: String?
  ) {
    let payload = Payload(
      mode: values.mode,
      accentColor: values.accentColor,
      event: event.rawValue,
      updatedAt: ISO8601DateFormatter().string(from: Date()),
      focusName: focusName
    )
    
    guard let jsonData = try? JSONEncoder().encode(payload) else {
      return
    }
    
    UserDefaults(suiteName: AppGroupID)?.set(jsonData, forKey: StorageKey)
  }
  
  /// Read filter payload from the App Group. Returns nil if missing or malformed.
  public static func read() -> Payload? {
    guard let jsonData = UserDefaults(suiteName: AppGroupID)?.data(forKey: StorageKey) else {
      return nil
    }
    return try? JSONDecoder().decode(Payload.self, from: jsonData)
  }
}
