/**
 * CarPlay templates catalog (feature 045).
 *
 * Frozen catalog of the five CarPlay templates an app may compose
 * via `CPTemplateApplicationScene`. Pure data: shapes the UI of the
 * SceneComposer and TemplatePreview components.
 *
 * Template availability is gated by the *category* of the
 * Apple-issued CarPlay entitlement — e.g. CPNowPlayingTemplate is
 * audio-only; CPMapTemplate is reserved for Navigation/EV/Parking.
 * The `categories` field captures that gate so the lab can warn the
 * user when their selected category cannot legitimately use a
 * template.
 */

import type { CarPlayCategory, CarPlayTemplateKind } from '@/native/carplay.types';

export interface CarPlayTemplate {
  readonly kind: CarPlayTemplateKind;
  readonly className: string;
  readonly label: string;
  readonly summary: string;
  /** Categories Apple permits to use this template. */
  readonly categories: readonly CarPlayCategory[];
  /** Short example body used by the mock TemplatePreview renderer. */
  readonly previewLines: readonly string[];
}

export const CARPLAY_TEMPLATES: readonly CarPlayTemplate[] = Object.freeze([
  Object.freeze({
    kind: 'list' as const,
    className: 'CPListTemplate',
    label: 'List',
    summary: 'Hierarchical list of items, optionally grouped into sections.',
    categories: Object.freeze([
      'audio',
      'communication',
      'driving-task',
      'ev',
      'parking',
      'quick-food',
    ] as const),
    previewLines: Object.freeze(['Recently Played', 'My Library', 'Stations', 'Search'] as const),
  }),
  Object.freeze({
    kind: 'grid' as const,
    className: 'CPGridTemplate',
    label: 'Grid',
    summary: '2x4 grid of large icons, capped at 8 buttons by Apple.',
    categories: Object.freeze([
      'audio',
      'communication',
      'driving-task',
      'ev',
      'parking',
      'quick-food',
    ] as const),
    previewLines: Object.freeze(['Browse', 'Recents', 'Charts', 'Radio'] as const),
  }),
  Object.freeze({
    kind: 'information' as const,
    className: 'CPInformationTemplate',
    label: 'Information',
    summary: 'Read-only labelled rows. Used for trip summaries and detail views.',
    categories: Object.freeze([
      'driving-task',
      'ev',
      'parking',
      'quick-food',
      'communication',
    ] as const),
    previewLines: Object.freeze(['Route — 12 mi', 'ETA — 18 min', 'Charge — 64%'] as const),
  }),
  Object.freeze({
    kind: 'map' as const,
    className: 'CPMapTemplate',
    label: 'Map',
    summary: 'Full-bleed map with up to four corner buttons. Navigation-only.',
    categories: Object.freeze(['driving-task', 'ev', 'parking'] as const),
    previewLines: Object.freeze(['⌖ Map canvas', 'Pan / zoom buttons', 'Trip controls'] as const),
  }),
  Object.freeze({
    kind: 'now-playing' as const,
    className: 'CPNowPlayingTemplate',
    label: 'Now Playing',
    summary: 'System-provided audio transport surface. Audio category only.',
    categories: Object.freeze(['audio'] as const),
    previewLines: Object.freeze(['♪ Track title', 'Artist — Album', '◀◀  ▌▌  ▶▶'] as const),
  }),
]);

export function findCarPlayTemplate(kind: string): CarPlayTemplate | undefined {
  return CARPLAY_TEMPLATES.find((t) => t.kind === kind);
}

/** Returns true if the template is permitted for the given category. */
export function isTemplateAllowedForCategory(
  template: CarPlayTemplate,
  category: CarPlayCategory,
): boolean {
  return template.categories.includes(category);
}
