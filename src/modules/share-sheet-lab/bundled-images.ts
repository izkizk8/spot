/**
 * Bundled Images Catalog - Sample images for the ImageContentPicker
 * Feature: 033-share-sheet
 *
 * Four PNG descriptors reusing existing sample assets from the repo.
 * Each entry exposes a non-empty `alt` string and a finite numeric
 * `source` (a require() module id).
 *
 * @see specs/033-share-sheet/tasks.md T006
 */

export interface BundledImageEntry {
  readonly alt: string;
  readonly source: number;
}

/**
 * Four sample images (reusing 016/032 pattern).
 * Sourced from coreml-lab samples.
 */
export const BUNDLED_IMAGES: readonly BundledImageEntry[] = [
  {
    alt: 'Blue sample image',
    source: require('@/modules/coreml-lab/samples/sample-blue.png') as number,
  },
  {
    alt: 'Green sample image',
    source: require('@/modules/coreml-lab/samples/sample-green.png') as number,
  },
  {
    alt: 'Red sample image',
    source: require('@/modules/coreml-lab/samples/sample-red.png') as number,
  },
  {
    alt: 'Yellow sample image',
    source: require('@/modules/coreml-lab/samples/sample-yellow.png') as number,
  },
] as const;
