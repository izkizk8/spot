/**
 * ShowcaseGroupActivity.swift
 * Feature: 047-shareplay
 *
 * Custom GroupActivity that the showcase module registers with
 * the system. It carries a single `activityType` payload (counter
 * / drawing / quiz) so the receiving side knows which UI to
 * present. The metadata's `title` mirrors what the user types in
 * the activity composer.
 */

import Foundation
#if canImport(GroupActivities)
import GroupActivities
#endif

#if canImport(GroupActivities)
@available(iOS 15.0, *)
public struct ShowcaseGroupActivity: GroupActivity {
  public static let activityIdentifier = "com.spot.shareplay.showcase"

  public let activityType: String
  public let displayTitle: String

  public var metadata: GroupActivityMetadata {
    var m = GroupActivityMetadata()
    m.type = .generic
    m.title = displayTitle
    m.fallbackURL = URL(string: "https://github.com/izkizk8/spot")
    m.supportsContinuationOnTV = false
    return m
  }
}
#endif
