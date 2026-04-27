// FamilyActivityPickerView.swift
// Feature 015 — Helper for presenting Apple's `FamilyActivityPicker`.
//
// Selection encoding (R-002): the resulting `FamilyActivitySelection` is
// `Codable`; we JSON-encode then base64-encode it into the
// `rawSelectionToken` returned to JS.
//
// Cancellation: when the user dismisses without confirming, the JS
// bridge rejects with `PickerCancelledError`.
//
// On-device verification: quickstart.md §3a / §3b.

import SwiftUI
import UIKit
import FamilyControls

@available(iOS 16.0, *)
public struct FamilyActivityPickerView: UIViewControllerRepresentable {
    @Binding var selection: FamilyActivitySelection

    public func makeUIViewController(context: Context) -> UIViewController {
        let picker = FamilyActivityPicker(selection: $selection)
        return UIHostingController(rootView: picker)
    }

    public func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        // No-op — `selection` binding feeds the picker directly.
    }
}

@available(iOS 16.0, *)
public enum FamilyActivityPickerEncoder {
    /// JSON-encode + base64-encode a `FamilyActivitySelection` so it can
    /// round-trip through the JS bridge as an opaque string token.
    public static func encode(_ selection: FamilyActivitySelection) -> String {
        guard let data = try? JSONEncoder().encode(selection) else { return "" }
        return data.base64EncodedString()
    }

    /// Inverse of `encode`. Returns `nil` on malformed input.
    public static func decode(_ token: String) -> FamilyActivitySelection? {
        guard let data = Data(base64Encoded: token) else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
}
