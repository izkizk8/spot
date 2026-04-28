/**
 * insert-bundle-entry.ts — inserts StandByWidget() into 014's bundle.
 *
 * Region-replacement between 014's start/end markers (idempotent +
 * commutative with 027). Algorithm — research §3:
 *   1. Detect existing widgets between the markers (by basename match
 *      of `(\w+Widget)\(\)`).
 *   2. Add 028's `StandByWidget` to the owned set.
 *   3. Re-emit the marker region as the union, sorted by widget kind.
 *
 * Fail-loud if either marker is missing.
 *
 * @see specs/028-standby-mode/tasks.md T043, T046
 * @see specs/028-standby-mode/research.md §3
 */

const START_MARKER = '// MARK: spot-widgets:bundle:additional-widgets:start';
const END_MARKER = '// MARK: spot-widgets:bundle:additional-widgets:end';

interface BundleBlock {
  /** Sortable widget kind name. */
  readonly kind: string;
  /** Verbatim Swift source (already indented). */
  readonly source: string;
}

const STANDBY_BLOCK: BundleBlock = {
  kind: 'StandByWidget',
  source: `        if #available(iOS 17, *) {
            StandByWidget()
        }`,
};

const LOCK_BLOCK: BundleBlock = {
  kind: 'LockScreenAccessoryWidget',
  source: `        if #available(iOS 16.0, *) {
            LockScreenAccessoryWidget()
        }`,
};

/**
 * Public entry point. Pure string in / string out.
 *
 * @throws Error if either bundle marker is missing or reversed.
 */
export function insertBundleEntry(source: string): string {
  const startIdx = source.indexOf(START_MARKER);
  const endIdx = source.indexOf(END_MARKER);

  if (startIdx === -1) {
    throw new Error(
      `with-standby-widget: Missing '${START_MARKER}' in SpotWidgetBundle.swift. ` +
        `See specs/028-standby-mode/research.md §3`,
    );
  }
  if (endIdx === -1) {
    throw new Error(
      `with-standby-widget: Missing '${END_MARKER}' in SpotWidgetBundle.swift. ` +
        `See specs/028-standby-mode/research.md §3`,
    );
  }
  if (endIdx < startIdx) {
    throw new Error(
      `with-standby-widget: Marker order invalid (end before start). ` +
        `See specs/028-standby-mode/research.md §3`,
    );
  }

  const beforeRegion = source.substring(0, startIdx + START_MARKER.length);
  const afterRegion = source.substring(endIdx);
  const interior = source.substring(startIdx + START_MARKER.length, endIdx);

  // Build the union of pre-existing detected blocks + 028's owned block.
  const blocks: BundleBlock[] = [];
  if (interior.includes('LockScreenAccessoryWidget()')) {
    blocks.push(LOCK_BLOCK);
  }
  blocks.push(STANDBY_BLOCK);

  // Deterministic ordering: 027 (Lock) before 028 (StandBy). Sort by
  // documented order rather than by kind string so the output is stable
  // regardless of insertion sequence (R-A commutativity).
  const ORDER = ['LockScreenAccessoryWidget', 'StandByWidget'];
  blocks.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  const body = blocks.map((b) => b.source).join('\n\n');

  return `${beforeRegion}\n${body}\n        ${afterRegion}`;
}
