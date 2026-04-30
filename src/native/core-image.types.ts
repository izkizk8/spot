/**
 * CoreImage Bridge Types
 * Feature: 064-core-image
 *
 * Shared type definitions for the CoreImage bridge.
 * Exposes six built-in CIFilter effects that ship on every iOS device.
 */

export const NATIVE_MODULE_NAME = 'CoreImage' as const;

/** Built-in filter identifiers mirroring the CIFilter catalog. */
export type FilterId = 'sepia' | 'blur' | 'vignette' | 'color-invert' | 'noir' | 'sharpen';

/** A single adjustable parameter for a filter. */
export interface ParameterDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

/** Metadata for one entry in the filter catalog. */
export interface FilterInfo {
  id: FilterId;
  /** Human-readable display name. */
  name: string;
  /** One-sentence description of the effect. */
  description: string;
  /** CIFilter class name on iOS. */
  ciFilterName: string;
  /** Adjustable parameters; empty for parameter-free filters. */
  params: readonly ParameterDef[];
}

/**
 * Dynamic parameter values keyed by `ParameterDef.key`.
 * Values not present fall back to `ParameterDef.defaultValue`.
 */
export type FilterParams = Record<string, number>;

/** Processing result returned by the bridge. */
export interface FilterResult {
  /** Base64 data URI or file URI of the filtered image. */
  outputUri: string;
  filterId: FilterId;
  /** Wall-clock processing time in milliseconds. */
  processingTimeMs: number;
}

/** Capability summary surfaced by `getCapabilities`. */
export interface CICapabilities {
  available: boolean;
  /** Total number of CIFilter names registered on the device. */
  filterCount: number;
  /** The six filter IDs this module supports. */
  supportedFilters: readonly FilterId[];
}

/** Full bridge surface. */
export interface CoreImageBridge {
  getCapabilities(): Promise<CICapabilities>;
  applyFilter(filterId: FilterId, params: FilterParams): Promise<FilterResult>;
}

export class CoreImageNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoreImageNotSupported';
  }
}
