/**
 * LiveActivityDemoModule.swift
 *
 * Expo Modules API native module for managing Live Activities.
 * Lives in the main app target (not the widget extension).
 *
 * Exposes: isAvailable (sync), start (async), update (async), end (async), current (async)
 *
 * Error codes thrown to JS:
 *   - AUTHORISATION: User disabled Live Activities in Settings
 *   - NO_SESSION: No activity is currently running
 *   - ALREADY_RUNNING: An activity is already running
 *   - NOT_SUPPORTED: iOS < 16.1 or ActivityKit unavailable
 *
 * @see specs/007-live-activities-dynamic-island/contracts/activity-attributes.md
 */

import ActivityKit
import ExpoModulesCore

public class LiveActivityDemoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiveActivityDemo")

        // Synchronous availability check
        Function("isAvailable") { () -> Bool in
            if #available(iOS 16.1, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new Live Activity
        AsyncFunction("start") { (args: [String: Any], promise: Promise) in
            guard #available(iOS 16.1, *) else {
                promise.reject("NOT_SUPPORTED", "Live Activities require iOS 16.1 or later")
                return
            }

            guard let name = args["name"] as? String, !name.isEmpty else {
                promise.reject("INVALID_ARGS", "name must be non-empty")
                return
            }

            let initialCounter = (args["initialCounter"] as? Int) ?? 0
            guard initialCounter >= 0 else {
                promise.reject("INVALID_ARGS", "initialCounter must be >= 0")
                return
            }

            // Check authorisation
            let authInfo = ActivityAuthorizationInfo()
            guard authInfo.areActivitiesEnabled else {
                promise.reject("AUTHORISATION", "Live Activities are disabled for this app. Enable them in iOS Settings.")
                return
            }

            // Check if already running
            if !Activity<LiveActivityDemoAttributes>.activities.isEmpty {
                promise.reject("ALREADY_RUNNING", "A Live Activity is already running")
                return
            }

            do {
                let attributes = LiveActivityDemoAttributes(name: name)
                let contentState = LiveActivityDemoAttributes.ContentState(counter: initialCounter)

                let activity = try Activity<LiveActivityDemoAttributes>.request(
                    attributes: attributes,
                    contentState: contentState,
                    pushType: nil
                )

                let result: [String: Any] = [
                    "id": activity.id,
                    "attributes": [
                        "name": name,
                        "initialCounter": initialCounter
                    ],
                    "state": [
                        "counter": initialCounter
                    ]
                ]

                promise.resolve(result)
            } catch {
                promise.reject("START_FAILED", error.localizedDescription)
            }
        }

        // Update the running activity's state
        AsyncFunction("update") { (state: [String: Any], promise: Promise) in
            guard #available(iOS 16.1, *) else {
                promise.reject("NOT_SUPPORTED", "Live Activities require iOS 16.1 or later")
                return
            }

            guard let counter = state["counter"] as? Int, counter >= 0 else {
                promise.reject("INVALID_ARGS", "counter must be >= 0")
                return
            }

            guard let activity = Activity<LiveActivityDemoAttributes>.activities.first else {
                promise.reject("NO_SESSION", "No Live Activity is currently running")
                return
            }

            Task {
                let contentState = LiveActivityDemoAttributes.ContentState(counter: counter)
                await activity.update(using: contentState)

                let result: [String: Any] = [
                    "id": activity.id,
                    "attributes": [
                        "name": activity.attributes.name,
                        "initialCounter": 0  // Not tracked after start
                    ],
                    "state": [
                        "counter": counter
                    ]
                ]

                promise.resolve(result)
            }
        }

        // End the running activity
        AsyncFunction("end") { (promise: Promise) in
            guard #available(iOS 16.1, *) else {
                promise.reject("NOT_SUPPORTED", "Live Activities require iOS 16.1 or later")
                return
            }

            guard let activity = Activity<LiveActivityDemoAttributes>.activities.first else {
                promise.reject("NO_SESSION", "No Live Activity is currently running")
                return
            }

            Task {
                await activity.end(dismissalPolicy: .immediate)
                promise.resolve(nil)
            }
        }

        // Get current activity (if any)
        AsyncFunction("current") { (promise: Promise) in
            guard #available(iOS 16.1, *) else {
                promise.resolve(nil)
                return
            }

            guard let activity = Activity<LiveActivityDemoAttributes>.activities.first else {
                promise.resolve(nil)
                return
            }

            let contentState = activity.contentState
            let result: [String: Any] = [
                "id": activity.id,
                "attributes": [
                    "name": activity.attributes.name,
                    "initialCounter": 0  // Not tracked after start
                ],
                "state": [
                    "counter": contentState.counter
                ]
            ]

            promise.resolve(result)
        }
    }
}
