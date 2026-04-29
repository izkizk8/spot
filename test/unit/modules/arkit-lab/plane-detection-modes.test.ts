/**
 * Plane Detection Modes Test
 * Feature: 034-arkit-basics
 *
 * Tests the static catalog of plane detection modes consumed by ConfigurationCard
 * and the default mode re-exported from arkit.types.ts.
 */

import {
  PLANE_DETECTION_MODES,
  DEFAULT_PLANE_DETECTION_MODE,
} from '@/modules/arkit-lab/plane-detection-modes';
import { PlaneDetectionMode } from '@/native/arkit.types';

describe('plane-detection-modes', () => {
  it('exports exactly four modes in the correct order', () => {
    expect(PLANE_DETECTION_MODES).toHaveLength(4);
    expect(PLANE_DETECTION_MODES[0].value).toBe('none');
    expect(PLANE_DETECTION_MODES[1].value).toBe('horizontal');
    expect(PLANE_DETECTION_MODES[2].value).toBe('vertical');
    expect(PLANE_DETECTION_MODES[3].value).toBe('both');
  });

  it('each mode has a non-empty human-readable label', () => {
    PLANE_DETECTION_MODES.forEach((mode) => {
      expect(mode.label).toBeTruthy();
      expect(typeof mode.label).toBe('string');
      expect(mode.label.length).toBeGreaterThan(0);
    });
  });

  it('each mode value matches PlaneDetectionMode type', () => {
    const validModes: PlaneDetectionMode[] = [
      'none',
      'horizontal',
      'vertical',
      'both',
    ];

    PLANE_DETECTION_MODES.forEach((mode) => {
      expect(validModes).toContain(mode.value);
    });
  });

  it('has no duplicate values', () => {
    const values = PLANE_DETECTION_MODES.map((m) => m.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it('catalog is frozen (immutable)', () => {
    expect(Object.isFrozen(PLANE_DETECTION_MODES)).toBe(true);
  });

  it('DEFAULT_PLANE_DETECTION_MODE equals "horizontal"', () => {
    expect(DEFAULT_PLANE_DETECTION_MODE).toBe('horizontal');
  });

  it('DEFAULT_PLANE_DETECTION_MODE matches DEFAULT_CONFIGURATION from types', () => {
    const { DEFAULT_CONFIGURATION } = require('@/native/arkit.types');
    expect(DEFAULT_PLANE_DETECTION_MODE).toBe(
      DEFAULT_CONFIGURATION.planeDetection,
    );
  });
});
