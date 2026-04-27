/**
 * LiveActivityDemoWidget.swift
 *
 * The Widget Extension entry point declaring one ActivityConfiguration
 * for LiveActivityDemoAttributes. Renders the Lock Screen view and all
 * three Dynamic Island regions (compact, expanded, minimal).
 *
 * Uses SF Symbols and system colours only — no custom fonts, no bundled
 * images, no custom hex colours (FR-015).
 *
 * @see specs/007-live-activities-dynamic-island/contracts/activity-attributes.md
 */

import ActivityKit
import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
struct LiveActivityDemoWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LiveActivityDemoAttributes.self) { context in
            // Lock Screen view (full-width row)
            LockScreenView(attributes: context.attributes, state: context.state)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded region
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Image(systemName: "bolt.badge.clock.fill")
                            .foregroundStyle(.blue)
                        Text(context.attributes.name)
                            .font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    // Empty trailing — content goes in bottom
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        HStack {
                            Text("Counter:")
                                .font(.subheadline)
                            Text("\(context.state.counter)")
                                .font(.title2.bold())
                        }
                        ProgressView(value: min(1.0, Double(context.state.counter) / 10.0))
                            .tint(.blue)
                    }
                    .padding(.horizontal)
                }
            } compactLeading: {
                // Compact leading: SF Symbol only
                Image(systemName: "bolt.badge.clock.fill")
                    .foregroundStyle(.blue)
            } compactTrailing: {
                // Compact trailing: counter as text
                Text("\(context.state.counter)")
                    .font(.caption.bold())
            } minimal: {
                // Minimal: SF Symbol only
                Image(systemName: "bolt.badge.clock.fill")
                    .foregroundStyle(.blue)
            }
        }
    }
}

/// Lock Screen view for the Live Activity
@available(iOS 16.1, *)
struct LockScreenView: View {
    let attributes: LiveActivityDemoAttributes
    let state: LiveActivityDemoAttributes.ContentState

    /// Derived progress value: min(1.0, counter / 10.0)
    private var progress: Double {
        min(1.0, Double(state.counter) / 10.0)
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "bolt.badge.clock.fill")
                    .font(.title2)
                    .foregroundStyle(.blue)

                Text(attributes.name)
                    .font(.headline)

                Spacer()

                Text("\(state.counter)")
                    .font(.title.bold())
            }

            ProgressView(value: progress)
                .tint(.blue)
        }
        .padding()
        .background(.ultraThinMaterial)
    }
}

/// Bundle entry point for WidgetKit
@available(iOS 16.1, *)
@main
struct LiveActivityDemoWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityDemoWidget()
    }
}
