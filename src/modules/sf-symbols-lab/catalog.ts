/**
 * @file catalog.ts
 * @description Curated symbol and effect catalog for SF Symbols Lab (T005)
 * Per data-model.md and contracts/catalog.md.
 */

import type { CuratedSymbol, EffectMetadata, TintToken } from './types';

/**
 * The 12 curated SF Symbols (FR-005, FR-008 default = first).
 * Source order matches picker display order.
 */
export const SYMBOLS: readonly CuratedSymbol[] = [
  { name: 'heart.fill', displayLabel: 'Heart' },
  { name: 'star.fill', displayLabel: 'Star' },
  { name: 'bolt.fill', displayLabel: 'Bolt' },
  { name: 'cloud.sun.fill', displayLabel: 'Cloud Sun' },
  { name: 'flame.fill', displayLabel: 'Flame' },
  { name: 'drop.fill', displayLabel: 'Drop' },
  { name: 'leaf.fill', displayLabel: 'Leaf' },
  { name: 'sparkles', displayLabel: 'Sparkles' },
  { name: 'moon.stars.fill', displayLabel: 'Moon Stars' },
  { name: 'cloud.bolt.rain.fill', displayLabel: 'Storm' },
  { name: 'sun.max.fill', displayLabel: 'Sun' },
  { name: 'snowflake', displayLabel: 'Snowflake' },
] as const;

/**
 * The 7 symbol effects (FR-009 – FR-012, default = Bounce).
 * Metadata per effect drives Speed/Repeat selector visibility (FR-015, FR-016)
 * and Replace mini-picker visibility (FR-025).
 */
export const EFFECTS: readonly EffectMetadata[] = [
  {
    id: 'bounce',
    displayLabel: 'Bounce',
    respondsToSpeed: true,
    respondsToRepeat: true,
    requiresSecondarySymbol: false,
  },
  {
    id: 'pulse',
    displayLabel: 'Pulse',
    respondsToSpeed: true,
    respondsToRepeat: true,
    requiresSecondarySymbol: false,
  },
  {
    id: 'scale',
    displayLabel: 'Scale',
    respondsToSpeed: true,
    respondsToRepeat: true,
    requiresSecondarySymbol: false,
  },
  {
    id: 'variable-color',
    displayLabel: 'Variable Color',
    respondsToSpeed: true,
    respondsToRepeat: true,
    requiresSecondarySymbol: false,
  },
  {
    id: 'replace',
    displayLabel: 'Replace',
    respondsToSpeed: false,
    respondsToRepeat: false,
    requiresSecondarySymbol: true,
  },
  {
    id: 'appear',
    displayLabel: 'Appear',
    respondsToSpeed: false,
    respondsToRepeat: false,
    requiresSecondarySymbol: false,
  },
  {
    id: 'disappear',
    displayLabel: 'Disappear',
    respondsToSpeed: false,
    respondsToRepeat: false,
    requiresSecondarySymbol: false,
  },
] as const;

/**
 * The 4 tint swatches exposed by TintPicker (FR-022).
 * Resolved at render via useTheme() so no color literals here (FR-036).
 */
export const TINTS: readonly TintToken[] = ['text', 'textSecondary', 'tintA', 'tintB'] as const;
