// LockScreenAccessoryEntry.swift
// Timeline entry for lock-screen accessory widget

import WidgetKit
import SwiftUI

struct LockScreenAccessoryEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: String
}
