//
//  BackgroundTaskManager.swift
//  spot — feature 030
//
//  iOS 13+ BGTaskScheduler wrapper. Authored on Windows; verified on-device
//  per `specs/030-background-tasks/quickstart.md` (Constitution V exemption
//  mirroring 007/013/014/027/028/029).
//
//  Responsibilities (FR-060..065):
//    - Register the two task identifiers (refresh + processing) in
//      `application(_:didFinishLaunchingWithOptions:)`.
//    - Each handler runs a tiny simulated workload (sum + sleep), wires
//      `task.expirationHandler` to mark `setTaskCompleted(success: false)`,
//      and on success calls `setTaskCompleted(success: true)` exactly once.
//    - Writes a `LastRunSnapshot` JSON payload to App Group UserDefaults
//      under key `spot.bgtasks.lastRun` on every handler entry/exit
//      (FR-063 / R-B).
//    - Posts a best-effort `UNNotificationRequest` on success (FR-064 /
//      EC-008). Failure is swallowed.
//
//  Exposed to JS via `requireOptionalNativeModule('BackgroundTasks')` —
//  see `src/native/background-tasks.ts`.
//

import Foundation

#if canImport(BackgroundTasks)
import BackgroundTasks
import UserNotifications
import UIKit

@available(iOS 13.0, *)
public enum BackgroundTaskManager {

    public static let refreshIdentifier = "com.izkizk8.spot.refresh"
    public static let processingIdentifier = "com.izkizk8.spot.processing"
    public static let appGroupID = "group.com.izkizk8.spot"
    public static let snapshotKey = "spot.bgtasks.lastRun"

    // MARK: - Registration

    /// Call from `application(_:didFinishLaunchingWithOptions:)` (FR-060).
    public static func registerTaskHandlers() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: refreshIdentifier,
            using: nil
        ) { task in
            guard let refreshTask = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            handleRefresh(refreshTask)
        }

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: processingIdentifier,
            using: nil
        ) { task in
            guard let processingTask = task as? BGProcessingTask else {
                task.setTaskCompleted(success: false)
                return
            }
            handleProcessing(processingTask)
        }
    }

    // MARK: - Handlers (FR-061 / FR-062)

    private static func handleRefresh(_ task: BGAppRefreshTask) {
        let scheduledAt = Date()
        writeSnapshot(
            type: "refresh",
            scheduledAt: scheduledAt,
            startedAt: Date(),
            endedAt: nil,
            durationMs: nil,
            status: "running"
        )

        task.expirationHandler = {
            writeSnapshot(
                type: "refresh",
                scheduledAt: scheduledAt,
                startedAt: scheduledAt,
                endedAt: Date(),
                durationMs: nil,
                status: "expired"
            )
            task.setTaskCompleted(success: false)
        }

        // ~2 s simulated workload (FR-061 / NFR-003)
        DispatchQueue.global(qos: .background).async {
            let started = Date()
            var sum: UInt64 = 0
            for i in 0..<5_000_000 { sum &+= UInt64(i) }
            _ = sum
            Thread.sleep(forTimeInterval: 1.5)

            let endedAt = Date()
            let durationMs = Int(endedAt.timeIntervalSince(started) * 1000)
            writeSnapshot(
                type: "refresh",
                scheduledAt: scheduledAt,
                startedAt: started,
                endedAt: endedAt,
                durationMs: durationMs,
                status: "completed"
            )
            postCompletionNotification(taskType: "refresh")
            task.setTaskCompleted(success: true)
        }
    }

    private static func handleProcessing(_ task: BGProcessingTask) {
        let scheduledAt = Date()
        writeSnapshot(
            type: "processing",
            scheduledAt: scheduledAt,
            startedAt: Date(),
            endedAt: nil,
            durationMs: nil,
            status: "running"
        )

        task.expirationHandler = {
            writeSnapshot(
                type: "processing",
                scheduledAt: scheduledAt,
                startedAt: scheduledAt,
                endedAt: Date(),
                durationMs: nil,
                status: "expired"
            )
            task.setTaskCompleted(success: false)
        }

        // ~5 s simulated workload (FR-062 / NFR-003)
        DispatchQueue.global(qos: .background).async {
            let started = Date()
            var sum: UInt64 = 0
            for i in 0..<10_000_000 { sum &+= UInt64(i) }
            _ = sum
            Thread.sleep(forTimeInterval: 4.5)

            let endedAt = Date()
            let durationMs = Int(endedAt.timeIntervalSince(started) * 1000)
            writeSnapshot(
                type: "processing",
                scheduledAt: scheduledAt,
                startedAt: started,
                endedAt: endedAt,
                durationMs: durationMs,
                status: "completed"
            )
            postCompletionNotification(taskType: "processing")
            task.setTaskCompleted(success: true)
        }
    }

    // MARK: - Scheduling (FR-021 / FR-031)

    public static func scheduleAppRefresh(
        earliestBeginIntervalMs: Double
    ) throws {
        let request = BGAppRefreshTaskRequest(identifier: refreshIdentifier)
        request.earliestBeginDate = Date(
            timeIntervalSinceNow: earliestBeginIntervalMs / 1000.0
        )
        try BGTaskScheduler.shared.submit(request)
    }

    public static func scheduleProcessing(
        requiresExternalPower: Bool,
        requiresNetworkConnectivity: Bool
    ) throws {
        let request = BGProcessingTaskRequest(identifier: processingIdentifier)
        request.requiresExternalPower = requiresExternalPower
        request.requiresNetworkConnectivity = requiresNetworkConnectivity
        try BGTaskScheduler.shared.submit(request)
    }

    public static func cancelAll() {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: refreshIdentifier)
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: processingIdentifier)
    }

    public static func registeredIdentifiers() -> [String] {
        return [refreshIdentifier, processingIdentifier]
    }

    // MARK: - Snapshot persistence (FR-063 / R-B)

    public static func readLastRunSnapshot() -> [String: Any]? {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            return nil
        }
        guard let raw = defaults.data(forKey: snapshotKey) else { return nil }
        guard
            let parsed = try? JSONSerialization.jsonObject(with: raw)
                as? [String: Any]
        else {
            return nil
        }
        return parsed
    }

    private static func writeSnapshot(
        type: String,
        scheduledAt: Date,
        startedAt: Date?,
        endedAt: Date?,
        durationMs: Int?,
        status: String
    ) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }

        let existing = readLastRunSnapshot() ?? [
            "refresh": NSNull() as Any,
            "processing": NSNull() as Any,
        ]

        var record: [String: Any] = [
            "id": "\(type)-\(Int(scheduledAt.timeIntervalSince1970 * 1000))",
            "type": type,
            "scheduledAt": Int(scheduledAt.timeIntervalSince1970 * 1000),
            "status": status,
        ]
        record["startedAt"] = startedAt.map {
            Int($0.timeIntervalSince1970 * 1000)
        } ?? NSNull()
        record["endedAt"] = endedAt.map {
            Int($0.timeIntervalSince1970 * 1000)
        } ?? NSNull()
        record["durationMs"] = durationMs ?? NSNull()

        var next = existing
        next[type] = record

        if let data = try? JSONSerialization.data(withJSONObject: next) {
            defaults.set(data, forKey: snapshotKey)
        }
    }

    // MARK: - Best-effort notification (FR-064 / EC-008)

    private static func postCompletionNotification(taskType: String) {
        let content = UNMutableNotificationContent()
        content.title = "Background task completed"
        content.body = "\(taskType) task finished"
        content.sound = nil

        let request = UNNotificationRequest(
            identifier: "spot.bgtasks.\(taskType).\(UUID().uuidString)",
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request) { _ in
            // best-effort — failure is swallowed (EC-008)
        }
    }
}
#endif
