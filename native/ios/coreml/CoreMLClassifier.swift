/**
 * CoreMLClassifier — Swift wrapper around VNCoreMLRequest for feature 016.
 *
 * Loads a bundled `.mlmodelc` via `MLModel(contentsOf:)`, configures it with
 * `MLComputeUnits.all`, and exposes `classify(image:topK:)` that runs the
 * Vision request and returns the top-K predictions plus the wall-clock
 * inference duration.
 *
 * Every entry point is wrapped in `do/catch` so native failures surface as
 * typed rejections, never uncaught exceptions (NFR-006).
 */

import Foundation
import CoreML
import Vision
import UIKit

struct Prediction {
    let label: String
    let confidence: Float
}

class CoreMLClassifier {
    private var model: MLModel?
    private var computeUnits: [String] = []
    
    /// Loads the named bundled CoreML model.
    /// - Parameter name: Resource basename (without extension).
    /// - Returns: The compute units the model is configured to use.
    /// - Throws: If the model file is missing or loading fails.
    func loadModel(name: String) throws -> [String] {
        guard let url = Bundle.main.url(forResource: name, withExtension: "mlmodelc") else {
            throw NSError(
                domain: "CoreMLClassifier",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Model file not found: \(name).mlmodelc"]
            )
        }
        
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .all
        
        let loadedModel = try MLModel(contentsOf: url, configuration: configuration)
        self.model = loadedModel
        
        // Read back the actually-selected compute units
        let units = loadedModel.configuration.computeUnits
        var unitsArray: [String] = []
        
        switch units {
        case .cpuOnly:
            unitsArray = ["cpu"]
        case .cpuAndGPU:
            unitsArray = ["cpu", "gpu"]
        case .all:
            // On A12+ hardware with Neural Engine, this includes all three.
            // On older hardware, it's cpu + gpu.
            unitsArray = ["cpu", "gpu", "neuralEngine"]
        case .cpuAndNeuralEngine:
            unitsArray = ["cpu", "neuralEngine"]
        @unknown default:
            unitsArray = ["cpu"]
        }
        
        self.computeUnits = unitsArray
        return unitsArray
    }
    
    /// Runs image classification against the loaded model.
    /// - Parameters:
    ///   - image: The UIImage to classify.
    ///   - topK: Number of top predictions to return (default 5).
    /// - Returns: A tuple of (predictions, inferenceMs).
    /// - Throws: If no model is loaded or the Vision request fails.
    func classify(image: UIImage, topK: Int = 5) throws -> (predictions: [Prediction], inferenceMs: Int) {
        guard let model = model else {
            throw NSError(
                domain: "CoreMLClassifier",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "No model loaded. Call loadModel first."]
            )
        }
        
        guard let ciImage = CIImage(image: image) else {
            throw NSError(
                domain: "CoreMLClassifier",
                code: 3,
                userInfo: [NSLocalizedDescriptionKey: "Failed to create CIImage from UIImage."]
            )
        }
        
        let visionModel = try VNCoreMLModel(for: model)
        let request = VNCoreMLRequest(model: visionModel)
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
        try handler.perform([request])
        
        let endTime = CFAbsoluteTimeGetCurrent()
        let inferenceMs = Int((endTime - startTime) * 1000)
        
        guard let results = request.results as? [VNClassificationObservation] else {
            throw NSError(
                domain: "CoreMLClassifier",
                code: 4,
                userInfo: [NSLocalizedDescriptionKey: "No classification results returned."]
            )
        }
        
        let predictions = results
            .prefix(topK)
            .map { Prediction(label: $0.identifier, confidence: $0.confidence) }
        
        return (predictions, inferenceMs)
    }
}
