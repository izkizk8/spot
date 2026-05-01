/**
 * tints.ts — module-local hex map for the 4 documented widget tints.
 *
 * NOT a global theme token (FR-050) — these are widget brand colours that
 * mirror the Swift `Tint` enum exactly. Used by RN previews, the swatch
 * picker, and any other widgets-lab chrome that needs the literal hex.
 *
 * @see specs/014-home-widgets/data-model.md "Tint" hex map
 */

import type { Tint } from '@/modules/widgets-lab/widget-config';

export const TINT_HEX: Readonly<Record<Tint, string>> = {
  blue: '#0A84FF',
  green: '#30D158',
  orange: '#FF9F0A',
  pink: '#FF375F',
};
