// ShowcaseWidget.swift
// Widget declaration for kind "SpotShowcaseWidget".
// NOT @main — the SpotWidgetBundle synthesised by the with-home-widgets
// plugin owns the @main attribute.

import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct ShowcaseWidget: Widget {
    let kind: String = "SpotShowcaseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ShowcaseProvider()) { entry in
            ShowcaseWidgetView(entry: entry)
        }
        .configurationDisplayName("Spot Showcase")
        .description("Push values from the Widgets Lab module to the Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
