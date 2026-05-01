/**
 * Controls Lab Module Manifest
 * Feature: 087-controls
 *
 * iOS 18+ educational module demonstrating Control Center custom action buttons:
 *   - ControlWidget          — the SwiftUI view shown in Control Center
 *   - ControlValueProvider   — supplies current toggle / value state
 *   - AppIntent              — the action invoked when a control is tapped
 *
 * The Screen import is deferred inside render() so simply importing
 * the registry does not transitively load the native bridge.
 */
import type { ModuleManifest } from '../types';

const controlsLab: ModuleManifest = {
  id: 'controls-lab',
  title: 'Control Center',
  description:
    'Educational lab for iOS 18+ Control Center custom controls. Demonstrates ControlWidget for building SwiftUI control views, ControlValueProvider for supplying live toggle and value state, and AppIntent-driven actions triggered when a control is tapped from Control Center. Shows capability detection, registered control descriptors, kind (button / toggle), and simulated control triggering.',
  icon: {
    ios: 'slider.horizontal.3',
    fallback: '🎛️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '18.0',
  render: () => require('./screen').default,
};

export default controlsLab;
