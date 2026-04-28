import ExpoModulesCore
import MapKit
import UIKit

public class LookAroundBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotLookAround")

    AsyncFunction("presentLookAround") { (lat: Double, lng: Double) -> LookAroundResult in
      try await self.presentLookAround(lat: lat, lng: lng)
    }
  }

  private func presentLookAround(lat: Double, lng: Double) async throws -> LookAroundResult {
    if #available(iOS 16.0, *) {
      let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
      let request = MKLookAroundSceneRequest(coordinate: coordinate)
      
      guard let scene = try await request.scene else {
        return LookAroundResult(shown: false)
      }
      
      return try await MainActor.run {
        let lookAroundVC = MKLookAroundViewController()
        lookAroundVC.scene = scene
        
        guard let topVC = UIApplication.shared.topMostViewController() else {
          return LookAroundResult(shown: false)
        }
        
        return try await withCheckedThrowingContinuation { continuation in
          topVC.present(lookAroundVC, animated: true) {
            continuation.resume(returning: LookAroundResult(shown: true))
          }
        }
      }
    } else {
      return LookAroundResult(shown: false)
    }
  }
}

struct LookAroundResult: Record {
  @Field var shown: Bool
}

extension UIApplication {
  func topMostViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes
    guard let windowScene = scenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
          let keyWindow = windowScene.keyWindow,
          let rootVC = keyWindow.rootViewController else {
      return nil
    }
    return rootVC.topMostPresented
  }
}

extension UIViewController {
  var topMostPresented: UIViewController {
    presentedViewController?.topMostPresented ?? self
  }
}
