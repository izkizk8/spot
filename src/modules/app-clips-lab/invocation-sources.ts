/**
 * App Clips Lab — invocation source catalog (feature 042).
 *
 * App Clips can be invoked via several discrete surfaces. This file is
 * the single source of truth for the labels and identifiers shown in
 * the simulator's source-toggle row and used to construct simulated
 * `_XCAppClipURL` payloads.
 *
 * IDs are stable, lowercase kebab-case strings; the catalog is frozen
 * at module load to prevent runtime mutation. Tests validate uniqueness
 * and shape.
 */

export type InvocationSourceId = 'nfc' | 'qr' | 'maps' | 'safari' | 'messages' | 'default';

export interface InvocationSource {
  readonly id: InvocationSourceId;
  readonly label: string;
  readonly description: string;
  /**
   * A short human-friendly hint shown beneath the source toggles.
   * Describes what payload metadata Apple would surface for this surface.
   */
  readonly hint: string;
}

export const INVOCATION_SOURCES: readonly InvocationSource[] = Object.freeze([
  Object.freeze({
    id: 'nfc',
    label: 'NFC',
    description: 'Tag-tapped App Clip Code (NDEF NFC URI record).',
    hint: 'Payload includes the tag URL; metadata may carry a short identifier.',
  }),
  Object.freeze({
    id: 'qr',
    label: 'QR / App Clip Code',
    description: 'Camera-scanned QR or App Clip Code.',
    hint: 'Payload is the encoded URL; visual ring identifies it as an App Clip Code.',
  }),
  Object.freeze({
    id: 'maps',
    label: 'Maps',
    description: 'Place card "Order" / "App Clip" button in Apple Maps.',
    hint: 'URL host must match an App Clip Experience configured for the place.',
  }),
  Object.freeze({
    id: 'safari',
    label: 'Safari Smart App Banner',
    description: 'Smart App Banner / website App Clip badge in Safari.',
    hint: 'URL provided by the host page meta-tag; user taps "Open" in the banner.',
  }),
  Object.freeze({
    id: 'messages',
    label: 'Messages',
    description: 'Shared link in Messages with App Clip preview.',
    hint: 'URL pre-validated against advertised App Clip Experience domains.',
  }),
  Object.freeze({
    id: 'default',
    label: 'Default / Unknown',
    description: 'Fallback when source metadata is missing.',
    hint: 'Use this when testing the App Clip without a specific surface.',
  }),
]);

/**
 * Lookup helper. Returns `undefined` if the id is not recognised.
 */
export function findInvocationSource(id: string): InvocationSource | undefined {
  return INVOCATION_SOURCES.find((s) => s.id === id);
}
