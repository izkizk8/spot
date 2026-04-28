// LockScreenAccessoryViews.swift
// SwiftUI views for the three accessory families

import WidgetKit
import SwiftUI

struct AccessoryRectangularView: View {
    let entry: LockScreenAccessoryEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.showcaseValue)
                .font(.caption)
                .bold()
            Text("\(entry.counter)")
                .font(.title2)
                .bold()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct AccessoryCircularView: View {
    let entry: LockScreenAccessoryEntry
    
    var body: some View {
        ZStack {
            Text("\(entry.counter)")
                .font(.title2)
                .bold()
        }
    }
}

struct AccessoryInlineView: View {
    let entry: LockScreenAccessoryEntry
    
    var body: some View {
        Text("\(entry.showcaseValue) · \(entry.counter)")
            .font(.caption)
    }
}
