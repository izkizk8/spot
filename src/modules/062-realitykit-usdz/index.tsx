/**
 * RealityKit USDZ Lab Module Manifest
 * Feature: 062-realitykit-usdz
 *
 * iOS 13+ educational module demonstrating 3D model preview and AR Quick Look
 * via RealityKit. The Screen import is deferred inside `render()` so simply
 * importing the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */
import type { ModuleManifest } from '../types';

const realityKitUsdzLab: ModuleManifest = {
  id: 'realitykit-usdz-lab',
  title: 'RealityKit USDZ',
  description:
    'RealityKit USDZ showcase of 3D model preview and AR Quick Look on iOS 13+: query AR capability flags, select a bundled USDZ model (toy drummer, biplane, gramophone), and open it in a full-screen AR Quick Look sheet.',
  icon: {
    ios: 'arkit',
    fallback: '🥽',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => require('./screen').default,
};

export default realityKitUsdzLab;
