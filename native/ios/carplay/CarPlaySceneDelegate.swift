/**
 * CarPlaySceneDelegate.swift — feature 045 placeholder scaffold.
 *
 * Conforms to `CPTemplateApplicationSceneDelegate` and would own the
 * root template once the app has the Apple-issued CarPlay
 * entitlement. The implementation here is intentionally a no-op:
 * `templateApplicationScene(_:didConnect:)` simply records the
 * scene reference so a future iteration can mount a real template.
 *
 * The `with-carplay` Expo config plugin authors the matching
 * UISceneConfiguration entry that names this class.
 */

#if canImport(CarPlay)
import CarPlay
import UIKit

@available(iOS 13.0, *)
public final class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
  private weak var carplayInterfaceController: CPInterfaceController?

  public func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didConnect interfaceController: CPInterfaceController
  ) {
    // Educational scaffold: hold the controller so a real
    // implementation can push a template here. Until Apple has
    // issued the entitlement, this delegate never fires on a real
    // device.
    self.carplayInterfaceController = interfaceController
  }

  public func templateApplicationScene(
    _ templateApplicationScene: CPTemplateApplicationScene,
    didDisconnectInterfaceController interfaceController: CPInterfaceController
  ) {
    if self.carplayInterfaceController === interfaceController {
      self.carplayInterfaceController = nil
    }
  }
}
#endif
