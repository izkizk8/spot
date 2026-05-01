// ShowcaseEntry.swift
// TimelineEntry + WidgetConfig + Tint enum for SpotShowcaseWidget.
// @see specs/014-home-widgets/data-model.md

import Foundation
import WidgetKit

enum Tint: String, Codable, CaseIterable {
    case blue
    case green
    case orange
    case pink
}

struct WidgetConfig {
    let showcaseValue: String
    let counter: Int
    let tint: Tint

    static let `default` = WidgetConfig(
        showcaseValue: "Hello, Widget!",
        counter: 0,
        tint: .blue
    )
}

@available(iOS 14.0, *)
struct ShowcaseEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: Tint
}
