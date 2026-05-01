// StandByEntry.swift
// Timeline entry for the Spot StandBy widget (iOS 17+).

import WidgetKit
import SwiftUI

enum RenderingMode: String {
    case fullColor
    case accented
    case vibrant
}

struct StandByEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: String
    let mode: RenderingMode
}
