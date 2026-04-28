/**
 * VisionDetector.swift — Native Swift bridge for feature 017 (Camera + Vision).
 *
 * Exposes `analyze(mode:payload:)` to JS via expo-modules-core. Dispatches to
 * VNDetectFaceRectanglesRequest, VNRecognizeTextRequest, or VNDetectBarcodesRequest
 * based on mode. Converts observations to JS-friendly normalized-coordinate shape.
 *
 * Per-mode request bodies are filled in via T038 (faces), T043 (text), T047 (barcodes).
 *
 * @see specs/017-camera-vision/contracts/vision-detector.swift.md
 */

import ExpoModulesCore
import Vision
import CoreImage
import UIKit

public class VisionDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Vision")

    AsyncFunction("analyze") { (mode: String, payload: [String: String]) -> [String: Any] in
      // 1. Validate payload (InvalidInput contract).
      let base64 = payload["base64"]
      let uri    = payload["uri"]
      
      switch (base64, uri) {
      case (nil, nil):
        throw InvalidInputError("payload requires base64 or uri")
      case (.some, .some):
        throw InvalidInputError("payload accepts only one of base64 or uri")
      default:
        break
      }

      // 2. Decode the image to a CGImage.
      let cgImage: CGImage
      let imageWidth: Int
      let imageHeight: Int
      
      if let b64 = base64 {
        guard let data = Data(base64Encoded: b64),
              let uiImage = UIImage(data: data),
              let cg = uiImage.cgImage else {
          throw InvalidInputError("base64 payload could not be decoded")
        }
        cgImage = cg
      } else if let uriString = uri {
        guard let url = URL(string: uriString),
              let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
              let cg = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
          throw InvalidInputError("uri payload could not be loaded")
        }
        cgImage = cg
      } else {
        throw InvalidInputError("payload requires base64 or uri")
      }
      
      imageWidth  = cgImage.width
      imageHeight = cgImage.height

      // 3. Build the request for the requested mode.
      let request: VNRequest
      switch mode {
      case "faces":
        // TODO US1: T038 — VNDetectFaceRectanglesRequest
        request = VNDetectFaceRectanglesRequest()
      case "text":
        // TODO US2: T043 — VNRecognizeTextRequest with recognitionLevel = .fast
        let r = VNRecognizeTextRequest()
        r.recognitionLevel = .fast
        request = r
      case "barcodes":
        // TODO US3: T047 — VNDetectBarcodesRequest
        request = VNDetectBarcodesRequest()
      default:
        throw InvalidInputError("unknown mode: \\(mode)")
      }

      // 4. Perform the request, measuring wall-clock duration.
      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      let start = CFAbsoluteTimeGetCurrent()
      
      do {
        try handler.perform([request])
      } catch {
        throw VisionAnalysisFailedError("\\(error)")
      }
      
      let analysisMs = Int(((CFAbsoluteTimeGetCurrent() - start) * 1000.0).rounded())

      // 5. Convert observations to the JS-side shape, flipping Y to top-left origin.
      let observations: [[String: Any]] = (request.results ?? []).compactMap { result in
        guard let bbox = (result as? VNDetectedObjectObservation)?.boundingBox else {
          return nil
        }
        
        // Y-flip: Vision uses bottom-left origin, React Native uses top-left
        let yTop = 1.0 - (bbox.origin.y + bbox.height)
        
        let normalized: [String: Any] = [
          "x":      bbox.origin.x,
          "y":      yTop,
          "width":  bbox.width,
          "height": bbox.height,
        ]
        
        switch result {
        case let face as VNFaceObservation:
          return ["kind": "face", "boundingBox": normalized]
          
        case let txt as VNRecognizedTextObservation:
          let text = txt.topCandidates(1).first?.string ?? ""
          return ["kind": "text", "boundingBox": normalized, "text": text]
          
        case let bar as VNBarcodeObservation:
          var entry: [String: Any] = [
            "kind":        "barcode",
            "boundingBox": normalized,
            "payload":     bar.payloadStringValue ?? "",
          ]
          
          // Strip the 'VNBarcodeSymbology' prefix (e.g., "VNBarcodeSymbologyQR" → "QR")
          let raw = bar.symbology.rawValue
          if raw.hasPrefix("VNBarcodeSymbology") {
            entry["symbology"] = String(raw.dropFirst("VNBarcodeSymbology".count))
          }
          return entry
          
        default:
          return nil
        }
      }

      // 6. Return the result
      NSLog("[VisionDetector] analyze(\\(mode)) — \\(analysisMs)ms — \\(observations.count) observations")
      return [
        "observations": observations,
        "analysisMs":   analysisMs,
        "imageWidth":   imageWidth,
        "imageHeight":  imageHeight,
      ]
    }
  }
}

// Error helpers

struct InvalidInputError: Error {
  let message: String
  init(_ message: String) {
    self.message = message
  }
}

struct VisionAnalysisFailedError: Error {
  let message: String
  init(_ message: String) {
    self.message = message
  }
}
