// src/modules/focus-filters-lab/filter-modes.ts
//
// ShowcaseFilterMode catalog, AccentColor catalog, draft defaults, and
// persisted payload parser for the Focus Filter showcase (FR-FF-007,
// FR-FF-008, FR-FF-022, FR-FF-024, FR-FF-046).
//
// @see specs/029-focus-filters/contracts/filter-modes.contract.ts
// @see specs/029-focus-filters/data-model.md

/**
 * The three showcase modes exposed to the Focus Filter binding UI
 * (Settings → Focus → Add Filter → Showcase Mode). Mirrors the
 * ShowcaseFilterMode AppEnum cases in ShowcaseModeFilter.swift.
 */
export type ShowcaseFilterMode = 'relaxed' | 'focused' | 'quiet';

/**
 * The four accent color slugs. Locally declared per R-C (do NOT import
 * from @/modules/widgets-lab/widget-config). Order matters for UI
 * rendering (FR-FF-022 (d)).
 */
export const AccentColor: readonly string[] = Object.freeze(['blue', 'orange', 'green', 'purple']);

/**
 * Draft defaults: the initial state for the filter definition card
 * editor on every screen mount (FR-FF-024 / DECISION 11).
 */
export const DRAFT_DEFAULTS = {
  mode: 'relaxed' as ShowcaseFilterMode,
  accentColor: 'blue',
};

/**
 * The event type emitted by the focus filter intent. Either 'activated'
 * (focus turned on) or 'deactivated' (focus turned off, payload
 * retained per FR-FF-014 Edge Case "Retain payload, flip event").
 */
export type ShowcaseFilterEvent = 'activated' | 'deactivated';

/**
 * The persisted payload shape: the Swift layer writes this JSON to
 * App Group UserDefaults under `spot.focus.filterValues` (FR-FF-011,
 * FR-FF-012).
 */
export interface ShowcaseFilterPersistedPayload {
  mode: ShowcaseFilterMode;
  accentColor: string;
  event: ShowcaseFilterEvent;
  updatedAt: string; // ISO 8601
  focusName?: string; // optional system-supplied focus name
}

const VALID_MODES: readonly ShowcaseFilterMode[] = ['relaxed', 'focused', 'quiet'];
const VALID_EVENTS: readonly ShowcaseFilterEvent[] = ['activated', 'deactivated'];
const VALID_ACCENT_COLORS = AccentColor;

/**
 * Strict parser. Returns the typed payload if all required fields are
 * present and valid, otherwise returns null (FR-FF-046 / DECISION 12).
 * Bridge parse failures emit at most one dedup-warn per session
 * (R-D — warn logic lives in focus-filters.ts, not here).
 */
export function parseFilterPayload(input: unknown): ShowcaseFilterPersistedPayload | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const partial = input as Partial<ShowcaseFilterPersistedPayload>;

  // Required fields with strict validation
  if (!VALID_MODES.includes(partial.mode as ShowcaseFilterMode)) {
    return null;
  }
  if (!VALID_ACCENT_COLORS.includes(partial.accentColor as string)) {
    return null;
  }
  if (!VALID_EVENTS.includes(partial.event as ShowcaseFilterEvent)) {
    return null;
  }
  if (typeof partial.updatedAt !== 'string' || partial.updatedAt.length === 0) {
    return null;
  }

  // Optional focusName: if present, must be a string
  if (partial.focusName !== undefined && typeof partial.focusName !== 'string') {
    return null;
  }

  return {
    mode: partial.mode as ShowcaseFilterMode,
    accentColor: partial.accentColor as string,
    event: partial.event as ShowcaseFilterEvent,
    updatedAt: partial.updatedAt,
    ...(partial.focusName !== undefined ? { focusName: partial.focusName } : {}),
  };
}
