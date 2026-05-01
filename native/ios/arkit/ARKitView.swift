/**
 * ARKitView.swift
 * Feature: 034-arkit-basics
 *
 * Expo Module ViewDefinition wrapping RealityKit ARView.
 * Props: planeDetection, peopleOcclusion, lightEstimation.
 * Events: onSessionStateChange, onAnchorAdded, onAnchorRemoved, onError.
 *
 * @see specs/034-arkit-basics/tasks.md T037
 */

import ExpoModulesCore
import ARKit
import RealityKit

@available(iOS 11.0, *)
public class ARKitView: ExpoView {
  // Placeholder view definition
  // In production, this would wrap RealityKit.ARView with props and events
  
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
}

@available(iOS 11.0, *)
public class ARKitViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ARKitView")

    View(ARKitView.self) {
      Prop("planeDetection") { (view: ARKitView, value: String) in
        // Placeholder: In production, update ARWorldTrackingConfiguration
      }

      Prop("peopleOcclusion") { (view: ARKitView, value: Bool) in
        // Placeholder: iOS 13+ LiDAR
      }

      Prop("lightEstimation") { (view: ARKitView, value: Bool) in
        // Placeholder: lightEstimationMode configuration
      }

      Events("onSessionStateChange", "onAnchorAdded", "onAnchorRemoved", "onError")
    }
  }
}
