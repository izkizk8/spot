/**
 * LiveActivityDemoAttributes.swift
 *
 * The ActivityAttributes declaration for the Live Activity Demo.
 * Shared between the main app target and the Widget Extension target.
 *
 * @see specs/007-live-activities-dynamic-island/contracts/activity-attributes.md
 */

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
