/**
 * Plane Detection Modes
 * Feature: 034-arkit-basics
 *
 * Static catalog of plane detection modes consumed by ConfigurationCard.
 * Re-exports the default from arkit.types.ts for a single source of truth.
 */

import { PlaneDetectionMode, DEFAULT_CONFIGURATION } from '@/native/arkit.types';

interface PlaneDetectionModeEntry {
  readonly value: PlaneDetectionMode;
  readonly label: string;
}

/**
 * Catalog of plane detection modes in the fixed order displayed by
 * ConfigurationCard's segmented control.
 */
export const PLANE_DETECTION_MODES: readonly PlaneDetectionModeEntry[] =
  Object.freeze([
    { value: 'none', label: 'None' },
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' },
    { value: 'both', label: 'Both' },
  ] as const);

/**
 * Default plane detection mode (matches DEFAULT_CONFIGURATION.planeDetection).
 * Single source of truth from arkit.types.ts.
 */
export const DEFAULT_PLANE_DETECTION_MODE = DEFAULT_CONFIGURATION.planeDetection;
