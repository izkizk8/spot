/**
 * Live Text Lab Module Manifest
 * Feature: 080-live-text
 *
 * iOS 13+ educational module demonstrating Live Text (image OCR):
 *   - VNRecognizeTextRequest (iOS 13+)     — Vision OCR on static images
 *   - DataScannerViewController (iOS 16+)  — live camera text scanning
 *   - ImageAnalysisInteraction (iOS 16+)   — long-press text overlay
 *
 * The Screen import is deferred inside render() so simply importing
 * the registry does not transitively load the native bridge.
 */

import type { ModuleManifest } from '../types';

const liveTextLab: ModuleManifest = {
  id: 'live-text-lab',
  title: 'Live Text',
  description:
    'Educational lab for Live Text OCR (iOS 13+). Demonstrates VNRecognizeTextRequest for Vision-based static image OCR (iOS 13+), DataScannerViewController for live camera text and barcode scanning (iOS 16+), and ImageAnalysisInteraction for long-press text extraction on still images (iOS 16+). Shows capability detection, recognised text blocks with confidence scores, and scanner session lifecycle.',
  icon: {
    ios: 'text.viewfinder',
    fallback: '🔍',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => require('./screen').default,
};

export default liveTextLab;
