// KeychainBridge.swift
//
// Expo native module wrapping iOS Keychain Services (Security.framework).
// Exposes: addItem, getItem, updateItem, deleteItem, listLabels, tryAccessGroupProbe.
//
// Covers FR-011, D-01, D-02, plan.md §Architecture.

import ExpoModulesCore
import Security
import Foundation

public class KeychainBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotKeychain")

    Function("addItem") { (input: AddItemInput) -> KeychainResult in
      return addItem(input: input)
    }

    Function("getItem") { (label: String, accessGroup: String?) -> KeychainResult in
      return getItem(label: label, accessGroup: accessGroup)
    }

    Function("updateItem") { (label: String, value: String, accessGroup: String?) -> KeychainResult in
      return updateItem(label: label, value: value, accessGroup: accessGroup)
    }

    Function("deleteItem") { (label: String, accessGroup: String?) -> KeychainResult in
      return deleteItem(label: label, accessGroup: accessGroup)
    }

    Function("listLabels") { (accessGroup: String?) -> KeychainResult in
      return listLabels(accessGroup: accessGroup)
    }

    Function("tryAccessGroupProbe") { (accessGroup: String) -> KeychainResult in
      return tryAccessGroupProbe(accessGroup: accessGroup)
    }
  }

  // MARK: - addItem

  private func addItem(input: AddItemInput) -> KeychainResult {
    // Build base query
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: input.label,
      kSecValueData as String: Data(input.value.utf8),
      kSecAttrAccessible as String: accessibilityConstant(for: input.accessibilityClass)
    ]

    if let accessGroup = input.accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    // Add biometry requirement via SecAccessControl
    if input.biometryRequired {
      let access = SecAccessControlCreateWithFlags(
        nil,
        accessibilityConstant(for: input.accessibilityClass),
        .biometryCurrentSet,
        nil
      )
      if let access = access {
        query[kSecAttrAccessControl as String] = access
        query.removeValue(forKey: kSecAttrAccessible as String)
      }
    }

    let status = SecItemAdd(query as CFDictionary, nil)

    // Handle errSecDuplicateItem by upgrading to update
    if status == errSecDuplicateItem {
      return updateItem(label: input.label, value: input.value, accessGroup: input.accessGroup)
    }

    return mapStatus(status)
  }

  // MARK: - getItem

  private func getItem(label: String, accessGroup: String?) -> KeychainResult {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: label,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne
    ]

    if let accessGroup = accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    if status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) {
      return KeychainResult(kind: "ok", value: value)
    }

    return mapStatus(status)
  }

  // MARK: - updateItem

  private func updateItem(label: String, value: String, accessGroup: String?) -> KeychainResult {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: label
    ]

    if let accessGroup = accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    let attributes: [String: Any] = [
      kSecValueData as String: Data(value.utf8)
    ]

    let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    return mapStatus(status)
  }

  // MARK: - deleteItem

  private func deleteItem(label: String, accessGroup: String?) -> KeychainResult {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: label
    ]

    if let accessGroup = accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    let status = SecItemDelete(query as CFDictionary)
    return mapStatus(status)
  }

  // MARK: - listLabels

  private func listLabels(accessGroup: String?) -> KeychainResult {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecReturnAttributes as String: true,
      kSecMatchLimit as String: kSecMatchLimitAll
    ]

    if let accessGroup = accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    var items: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &items)

    if status == errSecSuccess, let itemsArray = items as? [[String: Any]] {
      let labels = itemsArray.compactMap { $0[kSecAttrAccount as String] as? String }
      return KeychainResult(kind: "ok", value: labels)
    }

    if status == errSecItemNotFound {
      return KeychainResult(kind: "ok", value: [])
    }

    return mapStatus(status)
  }

  // MARK: - tryAccessGroupProbe

  private func tryAccessGroupProbe(accessGroup: String) -> KeychainResult {
    let testLabel = "spot.keychain.probe.\(UUID().uuidString)"
    let testValue = "probe"

    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: testLabel,
      kSecValueData as String: Data(testValue.utf8),
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked,
      kSecAttrAccessGroup as String: accessGroup
    ]

    let addStatus = SecItemAdd(query as CFDictionary, nil)

    if addStatus != errSecSuccess {
      return mapStatus(addStatus)
    }

    // Clean up
    let deleteQuery: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: testLabel,
      kSecAttrAccessGroup as String: accessGroup
    ]
    SecItemDelete(deleteQuery as CFDictionary)

    let bytes = testValue.utf8.count
    return KeychainResult(kind: "ok", value: ["bytes": bytes])
  }

  // MARK: - Helper

  private func accessibilityConstant(for key: String) -> CFString {
    switch key {
    case "whenUnlocked":
      return kSecAttrAccessibleWhenUnlocked
    case "afterFirstUnlock":
      return kSecAttrAccessibleAfterFirstUnlock
    case "whenUnlockedThisDeviceOnly":
      return kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    case "afterFirstUnlockThisDeviceOnly":
      return kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    case "whenPasscodeSetThisDeviceOnly":
      return kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
    default:
      return kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    }
  }

  private func mapStatus(_ status: OSStatus) -> KeychainResult {
    switch status {
    case errSecSuccess:
      return KeychainResult(kind: "ok")
    case errSecUserCanceled:
      return KeychainResult(kind: "cancelled")
    case errSecAuthFailed:
      return KeychainResult(kind: "auth-failed")
    case errSecMissingEntitlement:
      return KeychainResult(kind: "missing-entitlement")
    case errSecItemNotFound:
      return KeychainResult(kind: "not-found")
    default:
      return KeychainResult(kind: "error", message: "OSStatus: \(status)")
    }
  }
}

// MARK: - Data structures

struct AddItemInput: Record {
  @Field var label: String
  @Field var value: String
  @Field var accessibilityClass: String
  @Field var biometryRequired: Bool
  @Field var accessGroup: String?
}

struct KeychainResult: Record {
  @Field var kind: String
  @Field var value: Any?
  @Field var message: String?

  init(kind: String, value: Any? = nil, message: String? = nil) {
    self.kind = kind
    self.value = value
    self.message = message
  }
}
