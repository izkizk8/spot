//
//  QuickLookPresenter.swift
//  spot — feature 032 (Document Picker + Quick Look)
//
//  Wraps QLPreviewController behind the `QuickLook` Expo native module
//  name. Presents the preview sheet over the application's root view
//  controller, resolving `{ shown: true }` once `viewDidAppear` fires.
//
//  Errors are rejected with one of the documented codes:
//    'invalid-uri' | 'unreadable' | 'no-root-view-controller' | 'preview-failed'
//
//  Self-retains via an associated object for the duration of the sheet;
//  releases on dismissal. Registers under `NATIVE_MODULE_NAME = "QuickLook"`
//  to match `src/native/quicklook.types.ts`.
//
//  iOS 11+ only. On older systems, `isAvailable()` returns false.
//

import ExpoModulesCore
import QuickLook
import UIKit

@available(iOS 11.0, *)
public class QuickLookPresenter: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
    private var previewURL: URL?
    private var resolvePromise: ((Any) -> Void)?
    private var rejectPromise: ((String, String) -> Void)?
    private var strongSelf: QuickLookPresenter?

    public func isAvailable() -> Bool {
        if #available(iOS 11.0, *) {
            return true
        }
        return false
    }

    public func present(uri: String, resolve: @escaping (Any) -> Void, reject: @escaping (String, String) -> Void) {
        guard let url = URL(string: uri) else {
            reject("invalid-uri", "Could not parse URI: \(uri)")
            return
        }

        guard FileManager.default.isReadableFile(atPath: url.path) else {
            reject("unreadable", "File at \(url.path) is not readable")
            return
        }

        DispatchQueue.main.async {
            guard let root = self.firstPresentedViewController() else {
                reject("no-root-view-controller", "No root view controller available")
                return
            }

            self.previewURL = url
            self.resolvePromise = resolve
            self.rejectPromise = reject
            self.strongSelf = self

            let controller = QLPreviewController()
            controller.dataSource = self
            controller.delegate = self
            root.present(controller, animated: true) {
                resolve(["shown": true])
            }
        }
    }

    private func firstPresentedViewController() -> UIViewController? {
        guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow })
            ?? UIApplication.shared.windows.first else {
            return nil
        }
        var controller = window.rootViewController
        while let presented = controller?.presentedViewController {
            controller = presented
        }
        return controller
    }

    // MARK: - QLPreviewControllerDataSource

    public func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
        return previewURL == nil ? 0 : 1
    }

    public func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
        return (previewURL ?? URL(fileURLWithPath: "/dev/null")) as QLPreviewItem
    }

    // MARK: - QLPreviewControllerDelegate

    public func previewControllerDidDismiss(_ controller: QLPreviewController) {
        self.resolvePromise = nil
        self.rejectPromise = nil
        self.previewURL = nil
        self.strongSelf = nil
    }
}
