/**
 * PencilKit Lab Module Manifest
 * Feature: 082-pencilkit
 *
 * iOS 17+ educational module wrapping PencilKit (`PKCanvasView`,
 * `PKDrawing`, `PKToolPicker`).
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge.
 */

import type { ModuleManifest } from '../types';

const pencilkitLab: ModuleManifest = {
  id: 'pencilkit-lab',
  title: 'PencilKit',
  description:
    'Educational lab for PencilKit (iOS 17+). Demonstrates PKCanvasView for ink capture, PKDrawing for stroke storage and serialization, and PKToolPicker for picking pen / pencil / marker / crayon / eraser / lasso tools. Covers the drawing policy gate (default / anyInput / pencilOnly) and surfaces stroke count + bounding-box stats.',
  icon: {
    ios: 'pencil.tip',
    fallback: '✏️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  render: () => require('./screen').default,
};

export default pencilkitLab;
