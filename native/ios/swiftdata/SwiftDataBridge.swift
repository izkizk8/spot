/**
 * SwiftDataBridge.swift
 * Feature: 053-swiftdata
 *
 * Expo Module wrapping a SwiftData `@Model class TaskItem` (id,
 * title, completed, priority, dueDate, createdAt, updatedAt). The
 * persistent store is a local `ModelContainer`; the CloudKit-backed
 * variant is intentionally out of scope (see feature 052 for the
 * NSPersistentCloudKitContainer flavour).
 *
 * JS surface mirrors `src/native/swiftdata.ts`.
 *
 * NOTE: This is an educational scaffold. Real SwiftData usage
 * requires iOS 17+; this Swift file is NOT compiled or linked in
 * this PR.
 *
 * @available(iOS 17.0, *)
 */

import ExpoModulesCore
#if canImport(SwiftData)
import SwiftData
#endif
import Foundation

#if canImport(SwiftData)
@available(iOS 17.0, *)
@Model
final class TaskItem {
  @Attribute(.unique) var id: String
  var title: String
  var completed: Bool
  // Stored as String so the @Model schema stays trivial; the JS
  // bridge converts to/from the 'low' | 'medium' | 'high' union.
  var priority: String
  var dueDate: Date?
  var createdAt: Date
  var updatedAt: Date

  init(
    id: String = UUID().uuidString,
    title: String,
    completed: Bool = false,
    priority: String = "medium",
    dueDate: Date? = nil,
    createdAt: Date = Date(),
    updatedAt: Date = Date()
  ) {
    self.id = id
    self.title = title
    self.completed = completed
    self.priority = priority
    self.dueDate = dueDate
    self.createdAt = createdAt
    self.updatedAt = updatedAt
  }
}
#endif

public class SwiftDataBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SwiftData")

    // MARK: - Capability

    AsyncFunction("getSchemaInfo") { () -> [String: Any] in
      #if canImport(SwiftData)
      if #available(iOS 17.0, *) {
        return [
          "available": true,
          "containerName": "SwiftDataLab.store",
          "modelNames": ["TaskItem"],
        ]
      }
      #endif
      return [
        "available": false,
        "containerName": "",
        "modelNames": [String](),
      ]
    }

    // MARK: - CRUD on TaskItem
    //
    // A real implementation creates a `ModelContainer` once at
    // launch, derives a `ModelContext` per call, assembles a
    // `FetchDescriptor<TaskItem>` from the `query` argument, and
    // returns the array. We return placeholders to keep this
    // scaffold compiler-friendly when the schema is not active.

    AsyncFunction("fetchTasks") { (_: [String: Any]?) -> [[String: Any]] in
      return []
    }

    AsyncFunction("createTask") { (draft: [String: Any]) -> [String: Any] in
      let now = Int(Date().timeIntervalSince1970 * 1000)
      let title = draft["title"] as? String ?? ""
      let priority = draft["priority"] as? String ?? "medium"
      let completed = draft["completed"] as? Bool ?? false
      let dueDate = draft["dueDate"] as? Int
      return [
        "id": UUID().uuidString,
        "title": title,
        "completed": completed,
        "priority": priority,
        "dueDate": dueDate as Any,
        "createdAt": now,
        "updatedAt": now,
      ]
    }

    AsyncFunction("updateTask") { (id: String, patch: [String: Any]) -> [String: Any] in
      let now = Int(Date().timeIntervalSince1970 * 1000)
      return [
        "id": id,
        "title": patch["title"] as? String ?? "",
        "completed": patch["completed"] as? Bool ?? false,
        "priority": patch["priority"] as? String ?? "medium",
        "dueDate": patch["dueDate"] as Any,
        "createdAt": now,
        "updatedAt": now,
      ]
    }

    AsyncFunction("deleteTask") { (_: String) -> Void in
      return
    }
  }
}
