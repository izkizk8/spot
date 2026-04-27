// ShowcaseWidgetView.swift
// SwiftUI view branching on @Environment(\.widgetFamily).

import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct ShowcaseWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: ShowcaseEntry

    private var tintColor: Color {
        switch entry.tint {
        case .blue:   return Color(red: 0x0A / 255, green: 0x84 / 255, blue: 0xFF / 255)
        case .green:  return Color(red: 0x30 / 255, green: 0xD1 / 255, blue: 0x58 / 255)
        case .orange: return Color(red: 0xFF / 255, green: 0x9F / 255, blue: 0x0A / 255)
        case .pink:   return Color(red: 0xFF / 255, green: 0x37 / 255, blue: 0x5F / 255)
        }
    }

    var body: some View {
        switch family {
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                Text(entry.showcaseValue)
                    .font(.headline)
                    .foregroundColor(tintColor)
                    .lineLimit(2)
                Spacer()
                Text("\(entry.counter)")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(tintColor)
            }
            .padding(12)
        case .systemMedium:
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.showcaseValue)
                        .font(.headline)
                        .foregroundColor(tintColor)
                        .lineLimit(2)
                    Text("Spot Showcase")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text("\(entry.counter)")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(tintColor)
            }
            .padding(16)
        default:
            VStack(alignment: .leading, spacing: 12) {
                Text(entry.showcaseValue)
                    .font(.title2)
                    .foregroundColor(tintColor)
                Spacer()
                Text("\(entry.counter)")
                    .font(.system(size: 64, weight: .bold))
                    .foregroundColor(tintColor)
                Spacer()
                Text("Spot Showcase Widget")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(20)
        }
    }
}
