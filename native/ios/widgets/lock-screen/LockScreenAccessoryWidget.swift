// LockScreenAccessoryWidget.swift
// Main widget definition for lock-screen accessory widget

import WidgetKit
import SwiftUI

struct LockScreenAccessoryWidget: Widget {
    let kind: String = "SpotLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: LockScreenAccessoryProvider()
        ) { entry in
            // Select view based on widget family
            if #available(iOS 16.0, *) {
                switch entry.widgetFamily {
                case .accessoryRectangular:
                    AccessoryRectangularView(entry: entry)
                case .accessoryCircular:
                    AccessoryCircularView(entry: entry)
                case .accessoryInline:
                    AccessoryInlineView(entry: entry)
                default:
                    Text("Unsupported")
                }
            } else {
                Text("iOS 16+ required")
            }
        }
        .configurationDisplayName("Spot Lock")
        .description("Showcase value, counter, and tint on the Lock Screen.")
        .supportedFamilies([
            .accessoryRectangular,
            .accessoryCircular,
            .accessoryInline
        ])
    }
}

extension WidgetFamily {
    var widgetFamily: WidgetFamily {
        return self
    }
}

// Helper extension to get widgetFamily from entry context
extension TimelineEntry {
    var widgetFamily: WidgetFamily {
        return .accessoryRectangular // Default, actual value comes from Environment
    }
}
