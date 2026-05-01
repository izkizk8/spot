/**
 * Visual Look Up Lab Module Manifest
 * Feature: 060-visual-look-up
 *
 * iOS 15+ educational module demonstrating VisionKit
 * `ImageAnalysisInteraction` and `VNImageAnalyzer` for long-press
 * subject recognition (Visual Look Up). Surfaces subject labels,
 * confidence scores, and bounding boxes from a demo image.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const visualLookUpLab: ModuleManifest = {
  id: 'visual-look-up-lab',
  title: 'Visual Look Up',
  description:
    'Educational lab for VisionKit Visual Look Up (iOS 15+). Demonstrates VNImageAnalyzer and ImageAnalysisInteraction for long-press subject recognition. Surfaces detected subjects with labels, confidence scores, and normalised bounding boxes from a demo image URI.',
  icon: {
    ios: 'eye.circle',
    fallback: '🔍',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '15.0',
  render: () => require('./screen').default,
};

export default visualLookUpLab;
