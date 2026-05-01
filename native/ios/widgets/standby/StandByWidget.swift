// StandByWidget.swift
// WidgetKit widget definition for the Spot StandBy widget (iOS 17+).
//
// - kind: "SpotStandByWidget" (matches the JS-side reload key).
// - Supported families: .systemMedium, .systemLarge.
// - Honours .widgetAccentedRenderingMode(.accented) when system surfaces it.

import WidgetKit
import SwiftUI

@available(iOS 17.0, *)
struct StandByWidget: Widget {
    let kind: String = "SpotStandByWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StandByProvider()) { entry in
            StandByRootView(entry: entry)
        }
        .configurationDisplayName("Spot StandBy")
        .description("Showcase value, counter, tint, and rendering mode in StandBy.")
        .supportedFamilies([.systemMedium, .systemLarge])
        .widgetAccentedRenderingMode(.accented)
    }
}
