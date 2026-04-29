/**
 * Bundled Sample Files Descriptor
 * Feature: 032-document-picker-quicklook
 *
 * Static descriptor for the four bundled sample files.
 * URIs are resolved at runtime via Asset.fromModule.
 *
 * @see specs/032-document-picker-quicklook/spec.md FR-006, US2
 * @see specs/032-document-picker-quicklook/plan.md (no PDF sample)
 */

import { Asset } from 'expo-asset';

/**
 * Sample descriptor shape.
 */
export interface SampleDescriptor {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly requireAsset: number;
}

/**
 * The four bundled samples (no PDF per plan).
 * Each entry includes a require() reference for Asset.fromModule.
 */
export const SAMPLES: readonly SampleDescriptor[] = [
  {
    id: 'hello.txt',
    name: 'hello.txt',
    mimeType: 'text/plain',
    size: 22,
    requireAsset: 1, // Module ID will be assigned by Metro bundler
  },
  {
    id: 'note.md',
    name: 'note.md',
    mimeType: 'text/markdown',
    size: 45,
    requireAsset: 2,
  },
  {
    id: 'data.json',
    name: 'data.json',
    mimeType: 'application/json',
    size: 29,
    requireAsset: 3,
  },
  {
    id: 'icon.png',
    name: 'icon.png',
    mimeType: 'image/png',
    size: 70,
    requireAsset: 4,
  },
] as const;

/**
 * Resolves the bundle URI for a sample descriptor.
 * Returns the localUri from expo-asset's Asset.fromModule.
 */
export async function resolveSampleUri(sample: SampleDescriptor): Promise<string> {
  const asset = Asset.fromModule(sample.requireAsset);
  await asset.downloadAsync();
  return asset.localUri || asset.uri;
}
