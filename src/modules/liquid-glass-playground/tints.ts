/**
 * Tint chip palette for the Liquid Glass Playground controls.
 * Authored as `as const` so the values are exact-typed at use sites.
 *
 * Note: this is the tint chip palette for an interactive control — it is the
 * one acknowledged set of literal color values inside this feature (plan.md
 * §Constitution Check, principle II).
 */
export const TINTS = [
  { id: 'none', label: 'None', value: undefined },
  { id: 'aqua', label: 'Aqua', value: 'rgba(60,159,254,0.35)' },
  { id: 'rose', label: 'Rose', value: 'rgba(255,99,132,0.32)' },
  { id: 'mint', label: 'Mint', value: 'rgba(80,210,150,0.32)' },
  { id: 'amber', label: 'Amber', value: 'rgba(255,180,60,0.32)' },
  { id: 'violet', label: 'Violet', value: 'rgba(154,108,255,0.34)' },
] as const;

export type TintId = (typeof TINTS)[number]['id'];
