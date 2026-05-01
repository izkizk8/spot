/**
 * CoreMLBridge — expo-modules-core Module for feature 016.
 *
 * Exposes `loadModel(name:)` and `classify(imageBase64:)` through the
 * `SpotCoreML` native module. Every entry point is wrapped in `do/catch`
 * so native failures surface as typed rejections, never uncaught exceptions.
 */

import ExpoModulesCore
import Foundation
import UIKit

public class CoreMLBridge: Module {
    private let classifier = CoreMLClassifier()
    
    public func definition() -> ModuleDefinition {
        Name("SpotCoreML")
        
        AsyncFunction("loadModel") { (name: String) -> [String: Any] in
            do {
                let computeUnits = try self.classifier.loadModel(name: name)
                return [
                    "loaded": true,
                    "modelName": name,
                    "computeUnits": computeUnits
                ]
            } catch {
                throw Exception(
                    name: "ModelLoadError",
                    description: "Failed to load model: \(error.localizedDescription)"
                )
            }
        }
        
        AsyncFunction("classify") { (imageBase64: String) -> [String: Any] in
            do {
                // Decode base64 to Data
                guard let imageData = Data(base64Encoded: imageBase64, options: .ignoreUnknownCharacters) else {
                    throw Exception(
                        name: "DecodeError",
                        description: "Failed to decode base64 image data."
                    )
                }
                
                // Create UIImage
                guard let uiImage = UIImage(data: imageData) else {
                    throw Exception(
                        name: "DecodeError",
                        description: "Failed to create UIImage from decoded data."
                    )
                }
                
                // Run classification
                let (predictions, inferenceMs) = try self.classifier.classify(image: uiImage, topK: 5)
                
                let predictionsArray = predictions.map { pred -> [String: Any] in
                    return [
                        "label": pred.label,
                        "confidence": pred.confidence
                    ]
                }
                
                return [
                    "predictions": predictionsArray,
                    "inferenceMs": inferenceMs
                ]
            } catch let error as Exception {
                throw error
            } catch {
                throw Exception(
                    name: "InferenceError",
                    description: "Classification failed: \(error.localizedDescription)"
                )
            }
        }
    }
}
