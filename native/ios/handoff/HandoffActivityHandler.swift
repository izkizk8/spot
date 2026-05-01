//
//  HandoffActivityHandler.swift
//  spot — feature 040
//
//  AppDelegate subscriber: forwards NSUserActivity continuation events
//  to the JS layer via the `onContinue` event channel exposed by
//  HandoffBridge.
//
//  Per `specs/040-handoff-continuity/contracts/continuation.md`, the
//  handler ALWAYS returns `true` to claim the activity (Decision 2).
//

import ExpoModulesCore
import Foundation
import UIKit

public class HandoffActivityHandler: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let payload = Self.wirePayload(from: userActivity)
    // Send the event to all registered listeners across active modules.
    AppContext.shared?.eventEmitter.sendEvent("onContinue", payload)
    return true
  }

  /// Convert NSUserActivity to the wire payload documented in
  /// `contracts/continuation.md`. Non-string userInfo keys are dropped;
  /// `requiredUserInfoKeys` is sorted + deduplicated by the Set→Array
  /// conversion.
  private static func wirePayload(from activity: NSUserActivity) -> [String: Any] {
    var payload: [String: Any] = [
      "activityType": activity.activityType,
      "title": activity.title ?? "",
    ]
    if let url = activity.webpageURL?.absoluteString {
      payload["webpageURL"] = url
    }
    var userInfo: [String: Any] = [:]
    if let raw = activity.userInfo {
      for (k, v) in raw {
        if let key = k as? String {
          userInfo[key] = v
        }
      }
    }
    payload["userInfo"] = userInfo
    let required = Array(activity.requiredUserInfoKeys ?? Set<String>()).sorted()
    payload["requiredUserInfoKeys"] = required
    return payload
  }
}
