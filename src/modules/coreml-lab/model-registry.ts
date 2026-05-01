/**
 * JS-side model registry for feature 016.
 *
 * V1 contains only MobileNetV2. Future models can be added here without
 * screen-side changes — the Model Picker reads from this registry.
 */

export interface ModelDescriptor {
  /** Stable identifier passed to bridge.loadModel(). */
  name: string;
  /** Human-readable label for the Model Picker segment. */
  displayName: string;
  /** Resource basename (without extension) used by Bundle.main lookup. */
  resourceName: string;
}

export const MODEL_REGISTRY: readonly ModelDescriptor[] = [
  {
    name: 'MobileNetV2',
    displayName: 'MobileNetV2',
    resourceName: 'MobileNetV2',
  },
] as const;
