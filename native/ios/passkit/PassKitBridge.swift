/**
 * PassKitBridge — Swift native module.
 * Feature: 036-passkit-wallet
 *
 * Contracts: B1, B2, B5, B6, B7, B8, B9
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

import ExpoModulesCore
import PassKit
import UIKit

public class PassKitBridge: Module {
  // MARK: - Module Definition

  public func definition() -> ModuleDefinition {
    Name("PassKitBridge")

    // B2: Six async functions
    AsyncFunction("canAddPasses") { () -> Bool in
      return PKAddPassesViewController.canAddPasses()
    }

    AsyncFunction("isPassLibraryAvailable") { () -> Bool in
      return PKPassLibrary.isPassLibraryAvailable()
    }

    AsyncFunction("passes") { () -> [[String: Any?]] in
      let library = PKPassLibrary()
      let passes = library.passes()
      return passes.map { pass in
        [
          "passTypeIdentifier": pass.passTypeIdentifier,
          "serialNumber": pass.serialNumber,
          "organizationName": pass.organizationName,
          "localizedDescription": pass.localizedDescription,
          "passType": passTypeString(from: pass.passType),
        ]
      }
    }

    AsyncFunction("addPassFromBytes") { (base64: String, promise: Promise) in
      guard let data = Data(base64Encoded: base64) else {
        promise.reject(PassKitError.invalidPass.toException())
        return
      }

      do {
        guard let pass = try PKPass(data: data) else {
          promise.reject(PassKitError.invalidPass.toException())
          return
        }

        self.presentAddPassesViewController(with: [pass], promise: promise)
      } catch {
        promise.reject(PassKitError.invalidPass.toException())
      }
    }

    AsyncFunction("addPassFromURL") { (url: String, promise: Promise) in
      guard let passURL = URL(string: url) else {
        promise.reject(PassKitError.downloadFailed.toException())
        return
      }

      let task = URLSession.shared.dataTask(with: passURL) { data, response, error in
        if error != nil {
          promise.reject(PassKitError.downloadFailed.toException())
          return
        }

        guard let data = data else {
          promise.reject(PassKitError.downloadFailed.toException())
          return
        }

        do {
          guard let pass = try PKPass(data: data) else {
            promise.reject(PassKitError.invalidPass.toException())
            return
          }

          DispatchQueue.main.async {
            self.presentAddPassesViewController(with: [pass], promise: promise)
          }
        } catch {
          promise.reject(PassKitError.invalidPass.toException())
        }
      }

      task.resume()
    }

    AsyncFunction("openPass") { (passTypeIdentifier: String, serialNumber: String, promise: Promise) in
      if #available(iOS 13.4, *) {
        let library = PKPassLibrary()
        library.openPass(withTypeIdentifier: passTypeIdentifier, serialNumber: serialNumber) { result in
          if case .failure = result {
            promise.reject(PassKitError.invalidPass.toException())
          } else {
            promise.resolve(nil)
          }
        }
      } else {
        promise.reject(PassKitError.openUnsupported.toException())
      }
    }
  }

  // MARK: - PKAddPassesViewController Presentation

  private func presentAddPassesViewController(with passes: [PKPass], promise: Promise) {
    guard let viewController = PKAddPassesViewController(passes: passes) else {
      promise.reject(PassKitError.invalidPass.toException())
      return
    }

    viewController.delegate = self

    // Store promise for delegate callback
    self.currentPromise = promise

    // Present from top-most view controller
    DispatchQueue.main.async {
      guard let rootVC = UIApplication.shared.keyWindow?.rootViewController else {
        promise.reject(PassKitError.notSupported.toException())
        return
      }

      var topVC = rootVC
      while let presentedVC = topVC.presentedViewController {
        topVC = presentedVC
      }

      topVC.present(viewController, animated: true, completion: nil)
    }
  }

  // MARK: - Promise Storage

  private var currentPromise: Promise?

  // MARK: - Helper Functions

  private func passTypeString(from type: PKPassType) -> String {
    switch type {
    case .barcode:
      return "generic"
    case .payment:
      return "storeCard"
    case .anyPass:
      return "generic"
    @unknown default:
      return "generic"
    }
  }
}

// MARK: - PKAddPassesViewControllerDelegate

extension PassKitBridge: PKAddPassesViewControllerDelegate {
  public func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) {
    controller.dismiss(animated: true) {
      // User completed or cancelled — resolve with { added: false } for cancel
      self.currentPromise?.resolve(["added": false])
      self.currentPromise = nil
    }
  }
}

// MARK: - Error Definitions (B7)

enum PassKitError: String {
  case notSupported = "PassKitNotSupported"
  case openUnsupported = "PassKitOpenUnsupported"
  case downloadFailed = "PassKitDownloadFailed"
  case invalidPass = "PassKitInvalidPass"
  case cancelled = "PassKitCancelled"

  func toException() -> Exception {
    return Exception(name: self.rawValue, description: self.rawValue)
  }
}
