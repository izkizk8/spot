/**
 * Filter catalog for the CoreImage Lab module
 * Feature: 064-core-image
 *
 * Pure, tree-shakeable catalog of the six built-in CIFilter effects
 * showcased by this module. Importing this file has zero side effects.
 */
import type { FilterId, FilterInfo, ParameterDef } from '@/native/core-image.types';

export type { FilterId, FilterInfo, ParameterDef };

/** Ordered catalog of filters shown in the picker. */
export const FILTER_CATALOG: readonly FilterInfo[] = [
  {
    id: 'sepia',
    name: 'Sepia Tone',
    description: 'Maps the colours of an image to sepia-tone, evoking an aged-photograph look.',
    ciFilterName: 'CISepiaTone',
    params: [
      {
        key: 'intensity',
        label: 'Intensity',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.8,
      },
    ],
  },
  {
    id: 'blur',
    name: 'Gaussian Blur',
    description: 'Blurs the image using a Gaussian distribution of sample weights.',
    ciFilterName: 'CIGaussianBlur',
    params: [
      {
        key: 'radius',
        label: 'Radius',
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 5,
      },
    ],
  },
  {
    id: 'vignette',
    name: 'Vignette',
    description: 'Darkens the edges of an image to draw the eye toward the centre.',
    ciFilterName: 'CIVignette',
    params: [
      {
        key: 'radius',
        label: 'Radius',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 1,
      },
      {
        key: 'intensity',
        label: 'Intensity',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.6,
      },
    ],
  },
  {
    id: 'color-invert',
    name: 'Colour Invert',
    description: 'Inverts the colour of each pixel, producing a photographic negative.',
    ciFilterName: 'CIColorInvert',
    params: [],
  },
  {
    id: 'noir',
    name: 'Photo Noir',
    description: 'Applies a desaturated, high-contrast film-noir look to the image.',
    ciFilterName: 'CIPhotoEffectNoir',
    params: [],
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    description: 'Increases the contrast of edges in the luminance channel.',
    ciFilterName: 'CISharpenLuminance',
    params: [
      {
        key: 'sharpness',
        label: 'Sharpness',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.4,
      },
    ],
  },
] as const;

/** Lookup a filter by id; returns undefined if not found. */
export function findFilter(id: FilterId): FilterInfo | undefined {
  return FILTER_CATALOG.find((f) => f.id === id);
}

/**
 * Build a default params map from a filter's `ParameterDef[]`.
 * Missing keys fall back to `defaultValue`.
 */
export function defaultParams(info: FilterInfo): Record<string, number> {
  return Object.fromEntries(info.params.map((p) => [p.key, p.defaultValue]));
}
