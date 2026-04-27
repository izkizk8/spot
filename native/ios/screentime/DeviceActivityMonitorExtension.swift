// DeviceActivityMonitorExtension.swift
// Feature 015 — DeviceActivityMonitor extension target.
//
// Runs out-of-process when a registered DeviceActivitySchedule reaches
// an interval boundary. Reads `screentime.selection.token` from the
// shared App Group (FR-021) and emits OSLog lines that show up in
// Console.app under `subsystem:com.spot.screentime`.
//
// On-device verification: quickstart.md §3c.

import DeviceActivity
import Foundation
import OSLog

@available(iOS 16.0, *)
fileprivate let monitorLog = OSLog(subsystem: "com.spot.screentime", category: "monitor")

@available(iOS 16.0, *)
public class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    private func appGroupDefaults() -> UserDefaults? {
        // The monitor extension runs with its own bundle identifier; it
        // does NOT match the host app's bundleIdentifier. The app group
        // suite name is derived from the host app's bundle id, persisted
        // by the plugin into Info.plist as APP_GROUP_SUITE. Fall back to
        // probing common variants.
        if let suite = Bundle.main.object(forInfoDictionaryKey: "APP_GROUP_SUITE") as? String {
            return UserDefaults(suiteName: suite)
        }
        if let bundleId = Bundle.main.bundleIdentifier {
            // Strip the .screentimemonitor suffix to get the host bundle id.
            let host = bundleId.hasSuffix(".screentimemonitor")
                ? String(bundleId.dropLast(".screentimemonitor".count))
                : bundleId
            return UserDefaults(suiteName: "group.\(host).showcase")
        }
        return nil
    }

    public override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        let token = appGroupDefaults()?.string(forKey: "screentime.selection.token") ?? ""
        os_log(
            "intervalDidStart for activity %{public}@ tokenBytes=%{public}d",
            log: monitorLog,
            type: .info,
            activity.rawValue,
            token.count
        )
    }

    public override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        os_log(
            "intervalDidEnd for activity %{public}@",
            log: monitorLog,
            type: .info,
            activity.rawValue
        )
    }

    public override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)
        // Defensive — feature 015 does not currently register thresholds,
        // but the callback must exist per Apple API.
        os_log(
            "eventDidReachThreshold event=%{public}@ activity=%{public}@",
            log: monitorLog,
            type: .info,
            event.rawValue,
            activity.rawValue
        )
    }
}
