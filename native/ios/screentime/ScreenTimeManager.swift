// ScreenTimeManager.swift
// Feature 015 — ScreenTime / FamilyControls Showcase Module
//
// Expo Modules Core native module exposing the 9 JS bridge methods
// declared in `src/native/screentime.types.ts`.
//
// US2 (T043–T047) and US3 (T048–T049) success-path bodies are filled in
// below. All Swift sources here are scaffold-only on Windows (R-007);
// on-device verification is documented in
// specs/015-screentime-api/quickstart.md.

import ExpoModulesCore
import FamilyControls
import ManagedSettings
import DeviceActivity
import OSLog
import Foundation
import UIKit
import SwiftUI

@available(iOS 16.0, *)
fileprivate let managerLog = OSLog(subsystem: "com.spot.screentime", category: "manager")

@available(iOS 16.0, *)
public class ScreenTimeManager: Module {
    private let store = ManagedSettingsStore()
    private let activityCenter = DeviceActivityCenter()
    private let activityName = DeviceActivityName(rawValue: "spot.screentime.daily")

    public func definition() -> ModuleDefinition {
        Name("SpotScreenTime")

        Function("isAvailable") { () -> Bool in
            return true
        }

        AsyncFunction("entitlementsAvailable") { () -> Bool in
            return self.probeEntitlement()
        }

        AsyncFunction("requestAuthorization") { () async throws -> String in
            return try await self.requestAuthorization()
        }

        AsyncFunction("getAuthorizationStatus") { () -> String in
            return self.getAuthorizationStatus()
        }

        AsyncFunction("pickActivity") { () async throws -> [String: Any] in
            return try await self.pickActivity()
        }

        AsyncFunction("applyShielding") { (token: String) throws -> Void in
            try self.applyShielding(token: token)
        }

        AsyncFunction("clearShielding") { () -> Void in
            self.clearShielding()
        }

        AsyncFunction("startMonitoring") { (token: String, schedule: [String: Int]) throws -> Void in
            try self.startMonitoring(token: token, schedule: schedule)
        }

        AsyncFunction("stopMonitoring") { () -> Void in
            self.stopMonitoring()
        }
    }

    // MARK: - App Group helper

    private func appGroupDefaults() -> UserDefaults? {
        // Read the bundle identifier the same way feature 014 does so we
        // share the same `group.<bundleId>.showcase` suite (FR-021).
        guard let bundleId = Bundle.main.bundleIdentifier else { return nil }
        let suite = "group.\(bundleId).showcase"
        return UserDefaults(suiteName: suite)
    }

    private func mapAuthorizationStatus(_ status: AuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .approved: return "approved"
        case .denied: return "denied"
        @unknown default: return "notDetermined"
        }
    }

    // MARK: - Entitlement probe (T014)

    private func probeEntitlement() -> Bool {
        // R-005: read `authorizationStatus` inside a guard. Without the
        // entitlement the framework call throws at runtime; the catch
        // returns false and the JS bridge memoizes.
        do {
            let status = AuthorizationCenter.shared.authorizationStatus
            os_log("entitlementsAvailable probe ok: %{public}d", log: managerLog, type: .info, status.rawValue)
            return true
        } catch {
            os_log(
                "entitlementsAvailable probe failed: %{public}@",
                log: managerLog,
                type: .info,
                String(describing: error)
            )
            return false
        }
    }

    // MARK: - Authorization (T043, T044)

    private func requestAuthorization() async throws -> String {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            let mapped = mapAuthorizationStatus(AuthorizationCenter.shared.authorizationStatus)
            appGroupDefaults()?.set(mapped, forKey: "screentime.auth.status")
            os_log("requestAuthorization → %{public}@", log: managerLog, type: .info, mapped)
            return mapped
        } catch {
            os_log("requestAuthorization failed: %{public}@", log: managerLog, type: .error, String(describing: error))
            throw error
        }
    }

    private func getAuthorizationStatus() -> String {
        let mapped = mapAuthorizationStatus(AuthorizationCenter.shared.authorizationStatus)
        appGroupDefaults()?.set(mapped, forKey: "screentime.auth.status")
        return mapped
    }

    // MARK: - Activity picker (T045)

    private func pickActivity() async throws -> [String: Any] {
        let selection = try await presentPicker()
        let token = encodeSelection(selection)
        let appCount = selection.applicationTokens.count
        let categoryCount = selection.categoryTokens.count
        let webCount = selection.webDomainTokens.count

        if let defaults = appGroupDefaults() {
            defaults.set(token, forKey: "screentime.selection.token")
            defaults.set(appCount, forKey: "screentime.selection.applicationCount")
            defaults.set(categoryCount, forKey: "screentime.selection.categoryCount")
            defaults.set(webCount, forKey: "screentime.selection.webDomainCount")
        }

        return [
            "applicationCount": appCount,
            "categoryCount": categoryCount,
            "webDomainCount": webCount,
            "rawSelectionToken": token,
        ]
    }

    private func encodeSelection(_ selection: FamilyActivitySelection) -> String {
        do {
            let data = try JSONEncoder().encode(selection)
            return data.base64EncodedString()
        } catch {
            os_log("encodeSelection failed: %{public}@", log: managerLog, type: .error, String(describing: error))
            return ""
        }
    }

    private func decodeSelection(_ token: String) -> FamilyActivitySelection? {
        guard let data = Data(base64Encoded: token) else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }

    @MainActor
    private func presentPicker() async throws -> FamilyActivitySelection {
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async {
                guard let topVC = self.topViewController() else {
                    continuation.resume(throwing: NSError(
                        domain: "com.spot.screentime",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "No top view controller"]
                    ))
                    return
                }
                let presenter = FamilyActivityPickerPresenter { result in
                    topVC.dismiss(animated: true) {
                        switch result {
                        case .success(let selection):
                            continuation.resume(returning: selection)
                        case .cancelled:
                            continuation.resume(throwing: NSError(
                                domain: "com.spot.screentime",
                                code: -2,
                                userInfo: [NSLocalizedDescriptionKey: "PickerCancelled"]
                            ))
                        }
                    }
                }
                let host = UIHostingController(rootView: presenter)
                host.modalPresentationStyle = .pageSheet
                topVC.present(host, animated: true)
            }
        }
    }

    private func topViewController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }),
              var top = window.rootViewController else {
            return nil
        }
        while let presented = top.presentedViewController { top = presented }
        return top
    }

    // MARK: - Shielding (T046, T047)

    private func applyShielding(token: String) throws {
        guard let selection = decodeSelection(token) else {
            throw NSError(
                domain: "com.spot.screentime",
                code: -3,
                userInfo: [NSLocalizedDescriptionKey: "Failed to decode selection token"]
            )
        }
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? nil
            : .specific(selection.categoryTokens, except: Set())
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
        os_log("applyShielding ok", log: managerLog, type: .info)
    }

    private func clearShielding() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        os_log("clearShielding ok", log: managerLog, type: .info)
    }

    // MARK: - Monitoring (T048, T049)

    private func startMonitoring(token: String, schedule: [String: Int]) throws {
        let startHour = schedule["startHour"] ?? 9
        let startMinute = schedule["startMinute"] ?? 0
        let endHour = schedule["endHour"] ?? 21
        let endMinute = schedule["endMinute"] ?? 0

        let activitySchedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: startHour, minute: startMinute),
            intervalEnd: DateComponents(hour: endHour, minute: endMinute),
            repeats: true
        )

        do {
            try activityCenter.startMonitoring(activityName, during: activitySchedule)
            if let defaults = appGroupDefaults() {
                defaults.set(activityName.rawValue, forKey: "screentime.monitoring.activityName")
                if let scheduleData = try? JSONEncoder().encode(schedule) {
                    defaults.set(scheduleData, forKey: "screentime.monitoring.schedule")
                }
                if !token.isEmpty {
                    defaults.set(token, forKey: "screentime.selection.token")
                }
            }
            os_log("startMonitoring ok", log: managerLog, type: .info)
        } catch {
            os_log("startMonitoring failed: %{public}@", log: managerLog, type: .error, String(describing: error))
            throw error
        }
    }

    private func stopMonitoring() {
        activityCenter.stopMonitoring([activityName])
        if let defaults = appGroupDefaults() {
            defaults.removeObject(forKey: "screentime.monitoring.activityName")
            defaults.removeObject(forKey: "screentime.monitoring.schedule")
        }
        os_log("stopMonitoring ok", log: managerLog, type: .info)
    }
}

// MARK: - SwiftUI presenter wrapper for FamilyActivityPicker

@available(iOS 16.0, *)
private enum FamilyActivityPickerResult {
    case success(FamilyActivitySelection)
    case cancelled
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerPresenter: View {
    @State private var selection = FamilyActivitySelection()
    @Environment(\.dismiss) private var dismiss
    let onComplete: (FamilyActivityPickerResult) -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Pick activities")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            onComplete(.cancelled)
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            onComplete(.success(selection))
                        }
                    }
                }
        }
    }
}
