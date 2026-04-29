/**
 * ShareSheetPresenter — iOS UIActivityViewController wrapper.
 * feature 033 / T041.
 *
 * @available(iOS 8.0, *)
 * Expo Module exposing AsyncFunction "present" per contracts/native-module.contract.ts.
 */

import UIKit
import ExpoModulesCore

@available(iOS 8.0, *)
public class ShareSheetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShareSheet")

    AsyncFunction("present") { (options: [String: Any], promise: Promise) in
      DispatchQueue.main.async {
        self.presentShareSheet(options: options, promise: promise)
      }
    }

    Function("isAvailable") { () -> Bool in
      return true
    }
  }

  private func presentShareSheet(options: [String: Any], promise: Promise) {
    guard let rootVC = UIApplication.shared.keyWindow?.rootViewController else {
      promise.reject("NO_ROOT_VC", "No root view controller available")
      return
    }

    // Parse content
    guard let content = options["content"] as? [String: Any],
          let kind = content["kind"] as? String else {
      promise.reject("INVALID_CONTENT", "Missing or invalid content")
      return
    }

    var activityItems: [Any] = []

    switch kind {
    case "text":
      if let text = content["text"] as? String {
        activityItems.append(text)
      }
    case "url":
      if let urlString = content["url"] as? String,
         let url = URL(string: urlString) {
        activityItems.append(url)
      }
    case "image":
      // For bundled images, we'd need the actual UIImage
      // Simplified: just share the alt text
      if let alt = content["alt"] as? String {
        activityItems.append(alt)
      }
    case "file":
      if let uriString = content["uri"] as? String,
         let url = URL(string: uriString) {
        activityItems.append(url)
      }
    default:
      break
    }

    if activityItems.isEmpty {
      promise.reject("NO_ITEMS", "No shareable items generated")
      return
    }

    // Parse options
    let excludedActivityTypes = (options["excludedActivityTypes"] as? [String] ?? [])
      .compactMap { UIActivity.ActivityType(rawValue: $0) }
    let includeCustomActivity = options["includeCustomActivity"] as? Bool ?? false

    var applicationActivities: [UIActivity]? = nil
    if includeCustomActivity {
      applicationActivities = [CopyWithPrefixActivity()]
    }

    let activityVC = UIActivityViewController(
      activityItems: activityItems,
      applicationActivities: applicationActivities
    )
    activityVC.excludedActivityTypes = excludedActivityTypes

    // iPad anchor
    if let anchor = options["anchor"] as? [String: Any],
       let x = anchor["x"] as? CGFloat,
       let y = anchor["y"] as? CGFloat,
       let width = anchor["width"] as? CGFloat,
       let height = anchor["height"] as? CGFloat,
       let popover = activityVC.popoverPresentationController {
      popover.sourceView = rootVC.view
      popover.sourceRect = CGRect(x: x, y: y, width: width, height: height)
    }

    // Completion handler
    activityVC.completionWithItemsHandler = { activityType, completed, _, error in
      if let error = error {
        promise.reject("SHARE_ERROR", error.localizedDescription)
      } else {
        let result: [String: Any] = [
          "activityType": activityType?.rawValue as Any,
          "completed": completed
        ]
        promise.resolve(result)
      }
    }

    rootVC.present(activityVC, animated: true)
  }
}
