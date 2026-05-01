// GreetUserIntent.swift — App Intents Showcase (spec 013)
//
// Returns a personalised greeting; defends against empty / whitespace
// names from Siri / Shortcuts (returns "Hello, there!" per planning
// resolution #1 in plan.md).
//
// Verified manually on device per specs/013-app-intents/quickstart.md §1, §2.

import AppIntents
import Foundation

@available(iOS 16.0, *)
struct GreetUserIntent: AppIntent {
    static var title: LocalizedStringResource = "Greet user"
    static var description = IntentDescription("Return a personalised greeting from Spot.")

    @Parameter(title: "Name")
    var name: String

    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        let greeting: String
        if trimmed.isEmpty {
            greeting = "Hello, there!"
        } else {
            greeting = "Hello, \(trimmed)!"
        }
        return .result(value: greeting, dialog: IntentDialog(stringLiteral: greeting))
    }
}
