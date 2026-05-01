/**
 * CopyWithPrefixActivity — Custom UIActivity for "Copy with prefix".
 * feature 033 / T042.
 *
 * UIActivity subclass with activityType 'com.spot.share-sheet.copy-with-prefix'.
 */

import UIKit

@available(iOS 8.0, *)
class CopyWithPrefixActivity: UIActivity {
  private var activityItems: [Any] = []

  override var activityType: UIActivity.ActivityType? {
    return UIActivity.ActivityType("com.spot.share-sheet.copy-with-prefix")
  }

  override var activityTitle: String? {
    return "Copy with prefix"
  }

  override var activityImage: UIImage? {
    if #available(iOS 13.0, *) {
      return UIImage(systemName: "doc.on.clipboard")
    } else {
      return nil
    }
  }

  override func canPerform(withActivityItems activityItems: [Any]) -> Bool {
    // Can perform if at least one item is a String
    return activityItems.contains { $0 is String }
  }

  override func prepare(withActivityItems activityItems: [Any]) {
    self.activityItems = activityItems
  }

  override func perform() {
    let strings = activityItems.compactMap { $0 as? String }
    let joined = strings.joined(separator: " ")
    let prefixed = "Spot says: \(joined)"

    UIPasteboard.general.string = prefixed
    activityDidFinish(true)
  }
}
