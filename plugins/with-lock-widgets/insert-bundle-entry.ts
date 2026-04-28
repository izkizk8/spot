/**
 * insert-bundle-entry.ts — inserts LockScreenAccessoryWidget() into 014's bundle.
 *
 * Region-replacement between start/end markers (idempotent).
 * Fail-loud if markers missing.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T043, T046
 * @see specs/027-lock-screen-widgets/research.md §3
 */

const START_MARKER = '// MARK: spot-widgets:bundle:additional-widgets:start';
const END_MARKER = '// MARK: spot-widgets:bundle:additional-widgets:end';

const LOCK_WIDGET_ENTRY = `        if #available(iOS 16.0, *) {
            LockScreenAccessoryWidget()
        }`;

export function insertBundleEntry(source: string): string {
  const startIdx = source.indexOf(START_MARKER);
  const endIdx = source.indexOf(END_MARKER);

  if (startIdx === -1) {
    throw new Error(
      `with-lock-widgets: Missing '${START_MARKER}' in SpotWidgetBundle.swift. ` +
        `See specs/027-lock-screen-widgets/research.md §3`,
    );
  }

  if (endIdx === -1) {
    throw new Error(
      `with-lock-widgets: Missing '${END_MARKER}' in SpotWidgetBundle.swift. ` +
        `See specs/027-lock-screen-widgets/research.md §3`,
    );
  }

  if (endIdx < startIdx) {
    throw new Error(`with-lock-widgets: Marker order invalid (end before start)`);
  }

  // Region replacement: everything from after startMarker line to before endMarker line
  const before = source.substring(0, startIdx + START_MARKER.length);
  const after = source.substring(endIdx);

  return `${before}\n${LOCK_WIDGET_ENTRY}\n        ${after}`;
}
