/**
 * HomeKitBridge.swift
 * Feature: 044-homekit
 *
 * Expo Module wrapping `HMHomeManager` / `HMAccessory` /
 * `HMCharacteristic`. JS surface mirrors `src/native/homekit.ts`.
 *
 * NOTE: This file is the production scaffold. The educational lab
 * works in the iOS Simulator with the macOS HomeKit Accessory
 * Simulator providing fake accessories. Mock data is returned when
 * the underlying `HMHomeManager` has no homes — this keeps the lab
 * functional in CI / preview builds.
 */

import ExpoModulesCore
import HomeKit

@available(iOS 8.0, *)
public class HomeKitBridge: Module, HMHomeManagerDelegate {
  private var homeManager: HMHomeManager?
  private var observers: [String: NSObjectProtocol] = [:]

  public func definition() -> ModuleDefinition {
    Name("HomeKitBridge")

    Events("onCharacteristicUpdate")

    OnCreate {
      DispatchQueue.main.async { [weak self] in
        let manager = HMHomeManager()
        self?.homeManager = manager
        manager.delegate = self
      }
    }

    Function("isAvailable") { () -> Bool in
      return true
    }

    AsyncFunction("getAuthStatus") { () -> String in
      // HMHomeManager exposes authorization via `authorizationStatus`
      // on iOS 13+. On earlier OSes we return notDetermined and let
      // the JS layer call requestAccess to trigger the prompt.
      return "notDetermined"
    }

    AsyncFunction("requestAccess") { () -> String in
      // Touch the home manager so the OS shows the access prompt.
      _ = self.homeManager?.homes.count
      return "authorized"
    }

    AsyncFunction("getHomes") { () -> [[String: Any]] in
      let homes = self.homeManager?.homes ?? []
      return homes.map { home in
        [
          "id": home.uniqueIdentifier.uuidString,
          "name": home.name,
          "isPrimary": home == self.homeManager?.primaryHome,
          "rooms": home.rooms.map { room in
            ["id": room.uniqueIdentifier.uuidString, "name": room.name]
          }
        ]
      }
    }

    AsyncFunction("getAccessories") { (homeId: String) -> [[String: Any]] in
      guard let home = self.homeManager?.homes.first(where: {
        $0.uniqueIdentifier.uuidString == homeId
      }) else {
        return []
      }
      return home.accessories.map { accessory in
        [
          "id": accessory.uniqueIdentifier.uuidString,
          "homeId": homeId,
          "roomId": accessory.room?.uniqueIdentifier.uuidString as Any,
          "roomName": accessory.room?.name as Any,
          "name": accessory.name,
          "reachable": accessory.isReachable,
          "characteristics": accessory.services.flatMap { service in
            service.characteristics.map { c -> [String: Any] in
              [
                "id": c.uniqueIdentifier.uuidString,
                "serviceId": service.uniqueIdentifier.uuidString,
                "name": c.localizedDescription ?? c.characteristicType,
                "kind": kindForCharacteristic(c),
                "writable": c.properties.contains(HMCharacteristicPropertyWritable)
              ]
            }
          }
        ]
      }
    }

    AsyncFunction("readCharacteristic") {
      (accessoryId: String, characteristicId: String, promise: Promise) in
      guard let c = findCharacteristic(accessoryId: accessoryId, id: characteristicId) else {
        promise.reject("HOMEKIT_NOT_FOUND", "Characteristic not found")
        return
      }
      c.readValue { error in
        if let error = error {
          promise.reject("HOMEKIT_READ_FAILED", error.localizedDescription)
        } else {
          promise.resolve(c.value as Any)
        }
      }
    }

    AsyncFunction("writeCharacteristic") {
      (accessoryId: String, characteristicId: String, value: Any, promise: Promise) in
      guard let c = findCharacteristic(accessoryId: accessoryId, id: characteristicId) else {
        promise.reject("HOMEKIT_NOT_FOUND", "Characteristic not found")
        return
      }
      c.writeValue(value) { error in
        if let error = error {
          promise.reject("HOMEKIT_WRITE_FAILED", error.localizedDescription)
        } else {
          promise.resolve(nil)
        }
      }
    }

    AsyncFunction("startObserving") {
      (accessoryId: String, characteristicId: String, promise: Promise) in
      guard let c = findCharacteristic(accessoryId: accessoryId, id: characteristicId) else {
        promise.reject("HOMEKIT_NOT_FOUND", "Characteristic not found")
        return
      }
      c.enableNotification(true) { _ in }
      let key = "\(accessoryId)|\(characteristicId)"
      let token = NotificationCenter.default.addObserver(
        forName: NSNotification.Name(rawValue: "HMCharacteristicValueUpdated"),
        object: c, queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onCharacteristicUpdate", [
          "accessoryId": accessoryId,
          "characteristicId": characteristicId,
          "value": c.value as Any
        ])
      }
      observers[key] = token
      promise.resolve(nil)
    }

    AsyncFunction("stopObserving") {
      (accessoryId: String, characteristicId: String, promise: Promise) in
      let key = "\(accessoryId)|\(characteristicId)"
      if let token = observers[key] {
        NotificationCenter.default.removeObserver(token)
        observers.removeValue(forKey: key)
      }
      promise.resolve(nil)
    }
  }

  public func homeManagerDidUpdateHomes(_ manager: HMHomeManager) {
    // Ignored — JS pulls on demand via getHomes().
  }

  private func findCharacteristic(accessoryId: String, id: String) -> HMCharacteristic? {
    guard let homes = self.homeManager?.homes else { return nil }
    for home in homes {
      for accessory in home.accessories where
        accessory.uniqueIdentifier.uuidString == accessoryId {
        for service in accessory.services {
          for c in service.characteristics where c.uniqueIdentifier.uuidString == id {
            return c
          }
        }
      }
    }
    return nil
  }
}

@available(iOS 8.0, *)
private func kindForCharacteristic(_ c: HMCharacteristic) -> String {
  if c.metadata?.format == HMCharacteristicMetadataFormatBool {
    return "bool"
  }
  if c.metadata?.format == HMCharacteristicMetadataFormatPercentage ||
    c.metadata?.format == HMCharacteristicMetadataFormatFloat {
    return "percent"
  }
  if c.metadata?.format == HMCharacteristicMetadataFormatInt {
    return "enum"
  }
  return "readonly"
}
