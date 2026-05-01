// StandByViews.swift
// SwiftUI views for the Spot StandBy widget (.systemMedium / .systemLarge).
//
// - Branches on widgetFamily and widgetRenderingMode.
// - Applies .containerBackground unconditionally (iOS 17+).
// - Applies .widgetURL("spot://modules/standby-lab") to the root.
// - Tint = accent (`accented` mode) or monochrome translucent (`vibrant`).
// - No I/O in any view body.

import WidgetKit
import SwiftUI

@available(iOS 17.0, *)
struct StandByRootView: View {
    let entry: StandByEntry

    @Environment(\.widgetFamily) private var family
    @Environment(\.widgetRenderingMode) private var renderingMode

    private var tintColor: Color {
        switch entry.tint {
        case "blue": return Color(red: 0.04, green: 0.52, blue: 1.0)
        case "green": return Color(red: 0.19, green: 0.82, blue: 0.35)
        case "orange": return Color(red: 1.0, green: 0.62, blue: 0.04)
        case "pink": return Color(red: 1.0, green: 0.22, blue: 0.37)
        default: return .accentColor
        }
    }

    var body: some View {
        Group {
            switch family {
            case .systemMedium:
                MediumLayout(entry: entry, tintColor: tintColor, renderingMode: renderingMode)
            case .systemLarge:
                LargeLayout(entry: entry, tintColor: tintColor, renderingMode: renderingMode)
            default:
                Text("Unsupported")
            }
        }
        .containerBackground(.fill.tertiary, for: .widget)
        .widgetURL(URL(string: "spot://modules/standby-lab"))
    }
}

@available(iOS 17.0, *)
private struct MediumLayout: View {
    let entry: StandByEntry
    let tintColor: Color
    let renderingMode: WidgetRenderingMode

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.showcaseValue)
                .font(.headline)
                .foregroundColor(renderingMode == .vibrant ? .primary : tintColor)
            Text("\(entry.counter)")
                .font(.system(size: 56, weight: .heavy, design: .rounded))
                .foregroundColor(renderingMode == .accented ? tintColor : .primary)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

@available(iOS 17.0, *)
private struct LargeLayout: View {
    let entry: StandByEntry
    let tintColor: Color
    let renderingMode: WidgetRenderingMode

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(entry.showcaseValue)
                .font(.title3)
                .foregroundColor(renderingMode == .vibrant ? .primary : tintColor)
            Text("\(entry.counter)")
                .font(.system(size: 120, weight: .heavy, design: .rounded))
                .foregroundColor(renderingMode == .accented ? tintColor : .primary)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}
