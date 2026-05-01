// AppGroupKeys.swift
// Shared between widget extension and main-app Expo module.
// @see specs/014-home-widgets/data-model.md "Cross-target invariants"

import Foundation

enum AppGroup {
    /// Suite name uses the main-app bundle identifier as prefix.
    /// Substituted at runtime via Bundle.main.bundleIdentifier; the plugin
    /// guarantees the entitlement exists on both targets.
    static func suiteName(for bundleId: String) -> String {
        return "group.\(bundleId).showcase"
    }

    /// Default suite name when bundle id cannot be resolved at startup.
    static let defaultSuiteName = "group.com.example.spot.showcase"
}

enum AppGroupKeys {
    static let showcaseValue = "widgetConfig.showcaseValue"
    static let counter = "widgetConfig.counter"
    static let tint = "widgetConfig.tint"
}
