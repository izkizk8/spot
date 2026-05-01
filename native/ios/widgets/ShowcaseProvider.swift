// ShowcaseProvider.swift
// TimelineProvider for SpotShowcaseWidget.
// Reads App Group UserDefaults; falls back to defaults on read failure.
// 30-min refresh cadence (plan.md §Resolved #3, FR-014).

import Foundation
import WidgetKit

@available(iOS 14.0, *)
struct ShowcaseProvider: TimelineProvider {
    typealias Entry = ShowcaseEntry

    private static let refreshInterval: TimeInterval = 30 * 60

    func placeholder(in context: Context) -> ShowcaseEntry {
        return ShowcaseEntry(
            date: Date(),
            showcaseValue: WidgetConfig.default.showcaseValue,
            counter: WidgetConfig.default.counter,
            tint: WidgetConfig.default.tint
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ShowcaseEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ShowcaseEntry>) -> Void) {
        let entry = currentEntry()
        let next = Date().addingTimeInterval(Self.refreshInterval)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func currentEntry() -> ShowcaseEntry {
        let bundleId = Bundle.main.bundleIdentifier
            .map { $0.replacingOccurrences(of: ".LiveActivityDemoWidget", with: "") }
            ?? "com.example.spot"
        let suite = AppGroup.suiteName(for: bundleId)
        let defaults = UserDefaults(suiteName: suite)
        guard let defaults = defaults else {
            return ShowcaseEntry(
                date: Date(),
                showcaseValue: WidgetConfig.default.showcaseValue,
                counter: WidgetConfig.default.counter,
                tint: WidgetConfig.default.tint
            )
        }
        let showcaseValue = defaults.string(forKey: AppGroupKeys.showcaseValue)
            ?? WidgetConfig.default.showcaseValue
        let counter = defaults.object(forKey: AppGroupKeys.counter) as? Int
            ?? WidgetConfig.default.counter
        let rawTint = defaults.string(forKey: AppGroupKeys.tint) ?? WidgetConfig.default.tint.rawValue
        let tint = Tint(rawValue: rawTint) ?? WidgetConfig.default.tint
        return ShowcaseEntry(
            date: Date(),
            showcaseValue: showcaseValue,
            counter: counter,
            tint: tint
        )
    }
}
