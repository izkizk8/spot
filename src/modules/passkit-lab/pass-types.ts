/**
 * Pass types catalog.
 * Feature: 036-passkit-wallet
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

import type { PassCategory, PassMetadata } from '@/native/passkit.types';

// Re-export PassMetadata for ergonomic in-module imports
export type { PassMetadata };

/**
 * Pass category catalog with user-facing labels.
 * Contract: Exhaustive over PassCategory union.
 */
export const PASS_CATEGORIES: Record<PassCategory, string> = Object.freeze({
  boardingPass: 'Boarding Pass',
  coupon: 'Coupon',
  eventTicket: 'Event Ticket',
  generic: 'Generic',
  storeCard: 'Store Card',
});

/**
 * Get user-facing label for a pass category.
 */
export function getPassCategoryLabel(category: PassCategory): string {
  return PASS_CATEGORIES[category] || 'Unknown';
}
