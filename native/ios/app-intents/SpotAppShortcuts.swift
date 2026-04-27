// SpotAppShortcuts.swift — App Intents Showcase (spec 013)
//
// Single AppShortcutsProvider exposing all three intents to Siri,
// Shortcuts, and Spotlight with one Apple-recommended phrase each.
//
// Verified manually on device per specs/013-app-intents/quickstart.md §2.

import AppIntents

@available(iOS 16.0, *)
struct SpotAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogMoodIntent(),
            phrases: [
                "Log my mood with \(.applicationName)"
            ],
            shortTitle: "Log mood",
            systemImageName: "face.smiling"
        )
        AppShortcut(
            intent: GetLastMoodIntent(),
            phrases: [
                "Ask \(.applicationName) for my last mood"
            ],
            shortTitle: "Get last mood",
            systemImageName: "clock.arrow.circlepath"
        )
        AppShortcut(
            intent: GreetUserIntent(),
            phrases: [
                "Greet me with \(.applicationName)"
            ],
            shortTitle: "Greet user",
            systemImageName: "hand.wave"
        )
    }
}
