// GetLastMoodIntent.swift — App Intents Showcase (spec 013)
//
// Reads the most recent record from the shared mood store and
// returns its mood (or "No moods logged yet" when empty).
//
// Verified manually on device per specs/013-app-intents/quickstart.md §1.

import AppIntents
import Foundation

@available(iOS 16.0, *)
struct GetLastMoodIntent: AppIntent {
    static var title: LocalizedStringResource = "Get last mood"
    static var description = IntentDescription("Read the most recently logged Spot mood.")

    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let last = MoodStoreSwift.last()
        let value: String
        if let rec = last {
            value = rec.mood
        } else {
            value = "No moods logged yet"
        }
        let dialog = "Last mood: \(value)"
        return .result(value: value, dialog: IntentDialog(stringLiteral: dialog))
    }
}
