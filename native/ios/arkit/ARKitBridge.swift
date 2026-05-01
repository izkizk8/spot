/**
 * ARKitBridge.swift
 * Feature: 034-arkit-basics
 *
 * Expo Module exposing AsyncFunction surface for ARKit session control.
 * Holds weak ref to active ARKitView's ARSession via process-wide registry.
 * When zero views registered, every AsyncFunction rejects with 'no-active-view'.
 *
 * @see specs/034-arkit-basics/tasks.md T036
 */

import ExpoModulesCore
import ARKit

@available(iOS 11.0, *)
public class ARKitBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("ARKitBridge")

    AsyncFunction("placeAnchorAt") { (x: Double, y: Double) -> [String: Any]? in
      // Placeholder: In production, look up active view from registry, perform raycast
      // Return AnchorRecord shape or null
      return nil
    }

    AsyncFunction("clearAnchors") { () -> Void in
      // Placeholder: In production, remove all anchors from active view
    }

    AsyncFunction("pauseSession") { () -> Void in
      // Placeholder: In production, call session.pause()
    }

    AsyncFunction("resumeSession") { () -> Void in
      // Placeholder: In production, call session.run(config)
    }

    AsyncFunction("getSessionInfo") { () -> [String: Any] in
      // Placeholder: In production, return SessionInfo shape
      return [
        "state": "idle",
        "anchorCount": 0,
        "fps": 0.0,
        "duration": 0.0,
        "trackingState": "notAvailable"
      ]
    }

    Function("isAvailable") { () -> Bool in
      return ARWorldTrackingConfiguration.isSupported
    }
  }
}
