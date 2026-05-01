/**
 * CarPlayBridge.swift — feature 045.
 *
 * Expo Module that exposes a *no-op* CarPlay bridge to JS. Until
 * Apple has issued the matching CarPlay entitlement (Audio /
 * Communication / Driving Task / EV / Parking / Quick Food) and a
 * real `CPTemplateApplicationScene` is connected, every call to
 * `presentTemplate` rejects with `carplay-not-entitled`. The JS
 * surface mirrors `src/native/carplay.ts`.
 *
 * The module deliberately reports `not-entitled` rather than
 * `unavailable` so the lab UI can distinguish "no native module" from
 * "wrong host platform" (the latter is handled by the Android / Web
 * sibling modules).
 */

import ExpoModulesCore

@available(iOS 12.0, *)
public class CarPlayBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("CarPlayBridge")

    Function("isAvailable") { () -> Bool in
      return false
    }

    AsyncFunction("getStatus") { () -> String in
      return "not-entitled"
    }

    AsyncFunction("presentTemplate") { (kind: String) -> Void in
      throw CarPlayBridgeError.notEntitled(kind: kind)
    }
  }
}

enum CarPlayBridgeError: Error, CustomStringConvertible {
  case notEntitled(kind: String)

  var description: String {
    switch self {
    case .notEntitled(let kind):
      return "CarPlay entitlement is not active; cannot present \(kind)."
    }
  }
}
