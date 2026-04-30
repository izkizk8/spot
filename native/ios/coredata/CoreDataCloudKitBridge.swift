/**
 * CoreDataCloudKitBridge.swift
 * Feature: 052-core-data-cloudkit
 *
 * Expo Module wrapping `NSPersistentCloudKitContainer` over a single
 * `Note` entity (id, title, body, createdAt, updatedAt). The
 * persistent store is mirrored to the user's CloudKit private
 * database; `NSPersistentStoreRemoteChange` notifications drive the
 * `__observe` event surface.
 *
 * JS surface mirrors `src/native/coredata-cloudkit.ts`.
 *
 * NOTE: This is an educational scaffold. Real CloudKit sync requires
 * a configured iCloud container, the
 * `com.apple.developer.icloud-services` and
 * `com.apple.developer.icloud-container-identifiers` entitlements,
 * and a push-enabled provisioning profile (handled by
 * `plugins/with-coredata-cloudkit`). This Swift file is NOT compiled
 * or linked in this PR.
 *
 * @available(iOS 13.0, *)
 */

import ExpoModulesCore
#if canImport(CoreData)
import CoreData
#endif
#if canImport(CloudKit)
import CloudKit
#endif

public class CoreDataCloudKitBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("CoreDataCloudKit")

    Events("onSyncStateChanged")

    // MARK: - Account

    AsyncFunction("getAccountStatus") { () -> String in
      #if canImport(CloudKit)
      if #available(iOS 13.0, *) {
        let status = try await CKContainer.default().accountStatus()
        switch status {
        case .available: return "available"
        case .noAccount: return "noAccount"
        case .restricted: return "restricted"
        case .couldNotDetermine: return "couldNotDetermine"
        case .temporarilyUnavailable: return "temporarilyUnavailable"
        @unknown default: return "couldNotDetermine"
        }
      }
      #endif
      return "couldNotDetermine"
    }

    // MARK: - CRUD (Note entity)

    AsyncFunction("fetchNotes") { () -> [[String: Any]] in
      // A real implementation issues an NSFetchRequest on the Note
      // entity sorted by updatedAt descending.
      return []
    }

    AsyncFunction("createNote") { (draft: [String: Any]) -> [String: Any] in
      let now = Int(Date().timeIntervalSince1970 * 1000)
      let title = draft["title"] as? String ?? ""
      let body = draft["body"] as? String ?? ""
      return [
        "id": UUID().uuidString,
        "title": title,
        "body": body,
        "createdAt": now,
        "updatedAt": now,
      ]
    }

    AsyncFunction("updateNote") { (id: String, patch: [String: Any]) -> [String: Any] in
      let now = Int(Date().timeIntervalSince1970 * 1000)
      return [
        "id": id,
        "title": patch["title"] as? String ?? "",
        "body": patch["body"] as? String ?? "",
        "createdAt": now,
        "updatedAt": now,
      ]
    }

    AsyncFunction("deleteNote") { (_: String) -> Void in
      return
    }

    // MARK: - Conflict demo

    AsyncFunction("simulateConflict") { (id: String) -> [String: Any] in
      // Two rapid writes; CloudKit applies last-write-wins.
      let now = Int(Date().timeIntervalSince1970 * 1000)
      return [
        "id": id,
        "title": "conflict-resolved",
        "body": "last-write-wins",
        "createdAt": now,
        "updatedAt": now,
      ]
    }

    // MARK: - Observer

    OnStartObserving {
      // Wire NSPersistentStoreRemoteChange notifications here.
    }

    OnStopObserving {
      // Tear down observer here.
    }
  }
}
