/**
 * CoreImage Lab Module Manifest
 * Feature: 064-core-image
 *
 * iOS 13+ educational module showcasing six built-in CIFilter effects
 * (sepia, Gaussian blur, vignette, colour-invert, photo-noir,
 * luminance-sharpen). The Screen import is deferred inside `render()`
 * so simply importing the registry does not transitively load the
 * native bridge — the module is unavailable in the jsdom Jest
 * environment.
 */
import type { ModuleManifest } from '../types';

const coreImageLab: ModuleManifest = {
  id: 'core-image-lab',
  title: 'Core Image',
  description:
    'Core Image showcase of six built-in CIFilter effects on iOS 13+: sepia tone, Gaussian blur, vignette, colour invert, photo noir, and luminance sharpen. Select a filter, adjust its parameters, and tap Apply to see the filtered result URI.',
  icon: {
    ios: 'camera.filters',
    fallback: '🎨',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => require('./screen').default,
};

export default coreImageLab;
