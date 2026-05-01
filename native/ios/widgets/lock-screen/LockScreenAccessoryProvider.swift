// LockScreenAccessoryProvider.swift
// Timeline provider for lock-screen accessory widget

import WidgetKit
import SwiftUI

struct LockScreenAccessoryProvider: TimelineProvider {
    typealias Entry = LockScreenAccessoryEntry
    
    func placeholder(in context: Context) -> LockScreenAccessoryEntry {
        LockScreenAccessoryEntry(
            date: Date(),
            showcaseValue: "Hello, Lock!",
            counter: 0,
            tint: "blue"
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (LockScreenAccessoryEntry) -> Void) {
        // Read from App Group UserDefaults
        let suiteName = "group.com.izkizk8.spot.showcase"
        let defaults = UserDefaults(suiteName: suiteName)
        
        let showcaseValue = defaults?.string(forKey: "spot.widget.lockConfig.showcaseValue") ?? "Hello, Lock!"
        let counter = defaults?.integer(forKey: "spot.widget.lockConfig.counter") ?? 0
        let tint = defaults?.string(forKey: "spot.widget.lockConfig.tint") ?? "blue"
        
        let entry = LockScreenAccessoryEntry(
            date: Date(),
            showcaseValue: showcaseValue,
            counter: counter,
            tint: tint
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<LockScreenAccessoryEntry>) -> Void) {
        // Push-driven timeline — single entry, no automatic refresh
        let suiteName = "group.com.izkizk8.spot.showcase"
        let defaults = UserDefaults(suiteName: suiteName)
        
        let showcaseValue = defaults?.string(forKey: "spot.widget.lockConfig.showcaseValue") ?? "Hello, Lock!"
        let counter = defaults?.integer(forKey: "spot.widget.lockConfig.counter") ?? 0
        let tint = defaults?.string(forKey: "spot.widget.lockConfig.tint") ?? "blue"
        
        let entry = LockScreenAccessoryEntry(
            date: Date(),
            showcaseValue: showcaseValue,
            counter: counter,
            tint: tint
        )
        
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}
