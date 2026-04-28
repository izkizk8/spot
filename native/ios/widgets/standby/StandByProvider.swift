// StandByProvider.swift
// Timeline provider for the Spot StandBy widget. Push-driven (.never policy).

import WidgetKit
import SwiftUI

struct StandByProvider: TimelineProvider {
    typealias Entry = StandByEntry

    private let suiteName = "group.com.izkizk8.spot.showcase"

    func placeholder(in context: Context) -> StandByEntry {
        StandByEntry(
            date: Date(),
            showcaseValue: "StandBy",
            counter: 0,
            tint: "blue",
            mode: .fullColor
        )
    }

    private func readConfig() -> StandByEntry {
        let defaults = UserDefaults(suiteName: suiteName)
        let showcaseValue = defaults?.string(forKey: "spot.widget.standbyConfig.showcaseValue") ?? "StandBy"
        let counter = defaults?.integer(forKey: "spot.widget.standbyConfig.counter") ?? 0
        let tint = defaults?.string(forKey: "spot.widget.standbyConfig.tint") ?? "blue"
        let modeStr = defaults?.string(forKey: "spot.widget.standbyConfig.mode") ?? "fullColor"
        let mode = RenderingMode(rawValue: modeStr) ?? .fullColor
        return StandByEntry(
            date: Date(),
            showcaseValue: showcaseValue,
            counter: counter,
            tint: tint,
            mode: mode
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (StandByEntry) -> Void) {
        completion(readConfig())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StandByEntry>) -> Void) {
        let timeline = Timeline(entries: [readConfig()], policy: .never)
        completion(timeline)
    }
}
