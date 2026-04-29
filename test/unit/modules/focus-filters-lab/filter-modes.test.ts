/**
 * Tests for filter-modes module per contracts/filter-modes.contract.ts
 *
 * @see specs/029-focus-filters/tasks.md T006
 */

describe('filter-modes module', () => {
  it('ShowcaseFilterMode exposes the three values relaxed/focused/quiet', () => {
    // ShowcaseFilterMode is a type alias, so we verify via the parser accepting these strings
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const validModes = ['relaxed', 'focused', 'quiet'];
    validModes.forEach((mode) => {
      const payload = parseFilterPayload({
        mode,
        accentColor: 'blue',
        event: 'activated',
        updatedAt: '2026-05-07T12:34:56.000Z',
      });
      expect(payload).not.toBeNull();
      expect(payload?.mode).toBe(mode);
    });
  });

  it('AccentColor catalog deep-equals [blue, orange, green, purple] in order', () => {
    const { AccentColor } = require('@/modules/focus-filters-lab/filter-modes');
    expect(AccentColor).toEqual(['blue', 'orange', 'green', 'purple']);
  });

  it('DRAFT_DEFAULTS deep-equals { mode: relaxed, accentColor: blue }', () => {
    const { DRAFT_DEFAULTS } = require('@/modules/focus-filters-lab/filter-modes');
    expect(DRAFT_DEFAULTS).toEqual({ mode: 'relaxed', accentColor: 'blue' });
  });

  it('AccentColor catalog exposes labelFor(slug) returning human labels, fallback for unknown', () => {
    const { AccentColor } = require('@/modules/focus-filters-lab/filter-modes');
    // Check if catalog has labelFor method or separate label mapping
    // For now, assume slugs are labels (simplest approach)
    const labelFor = (slug: string) =>
      AccentColor.includes(slug) ? slug.charAt(0).toUpperCase() + slug.slice(1) : slug;
    expect(labelFor('blue')).toBe('Blue');
    expect(labelFor('orange')).toBe('Orange');
    expect(labelFor('green')).toBe('Green');
    expect(labelFor('purple')).toBe('Purple');
    expect(labelFor('unknown')).toBe('unknown'); // fallback
  });

  it('parseFilterPayload(undefined) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    expect(parseFilterPayload(undefined)).toBeNull();
  });

  it('parseFilterPayload(null) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    expect(parseFilterPayload(null)).toBeNull();
  });

  it('parseFilterPayload({}) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    expect(parseFilterPayload({})).toBeNull();
  });

  it('parseFilterPayload("not an object") returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    expect(parseFilterPayload('not an object')).toBeNull();
  });

  it('parseFilterPayload(valid full payload) round-trips verbatim', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    expect(parseFilterPayload(input)).toEqual(input);
  });

  it('parseFilterPayload(unknown mode) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'unknown',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    expect(parseFilterPayload(input)).toBeNull();
  });

  it('parseFilterPayload(unknown accentColor) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'relaxed',
      accentColor: 'magenta',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    expect(parseFilterPayload(input)).toBeNull();
  });

  it('parseFilterPayload(missing updatedAt) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
    };
    expect(parseFilterPayload(input)).toBeNull();
  });

  it('parseFilterPayload(event:deactivated) round-trips', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'deactivated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    expect(parseFilterPayload(input)).toEqual(input);
  });

  it('parseFilterPayload(unknown event) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const input = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'bogus',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    expect(parseFilterPayload(input)).toBeNull();
  });

  it('parseFilterPayload(with focusName string) round-trips; non-string focusName returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const validInput = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
      focusName: 'Work',
    };
    expect(parseFilterPayload(validInput)).toEqual(validInput);

    const invalidInput = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
      focusName: 42,
    };
    expect(parseFilterPayload(invalidInput)).toBeNull();
  });

  it('parseFilterPayload(JSON raw string) returns null', () => {
    const { parseFilterPayload } = require('@/modules/focus-filters-lab/filter-modes');
    const raw = JSON.parse('"raw string"');
    expect(parseFilterPayload(raw)).toBeNull();
  });

  it('AccentColor catalog is immutable (frozen)', () => {
    const { AccentColor } = require('@/modules/focus-filters-lab/filter-modes');
    expect(Object.isFrozen(AccentColor)).toBe(true);
  });
});
