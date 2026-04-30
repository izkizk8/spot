/**
 * note-types Test
 * Feature: 052-core-data-cloudkit
 */

import { describe, expect, it } from '@jest/globals';

import { EMPTY_TITLE, createDraft, isNote } from '@/modules/coredata-cloudkit-lab/note-types';

describe('createDraft', () => {
  it('returns defaults when called with no argument', () => {
    expect(createDraft()).toEqual({ title: EMPTY_TITLE, body: '' });
  });

  it('trims the title', () => {
    expect(createDraft({ title: '  Hello  ' }).title).toBe('Hello');
  });

  it('falls back to EMPTY_TITLE for blank titles', () => {
    expect(createDraft({ title: '   ' }).title).toBe(EMPTY_TITLE);
    expect(createDraft({ title: '' }).title).toBe(EMPTY_TITLE);
  });

  it('passes the body through unchanged', () => {
    expect(createDraft({ body: '  multi line  ' }).body).toBe('  multi line  ');
  });

  it('produces a fresh object on every call', () => {
    const a = createDraft();
    const b = createDraft();
    expect(a).not.toBe(b);
  });
});

describe('isNote', () => {
  const validNote = {
    id: 'a',
    title: 't',
    body: 'b',
    createdAt: 1,
    updatedAt: 2,
  };

  it('accepts a fully-typed note', () => {
    expect(isNote(validNote)).toBe(true);
  });

  it('rejects a missing field', () => {
    const { id: _id, ...rest } = validNote;
    expect(isNote(rest)).toBe(false);
  });

  it('rejects a wrong-typed field', () => {
    expect(isNote({ ...validNote, createdAt: 'now' })).toBe(false);
  });

  it('rejects null and primitives', () => {
    expect(isNote(null)).toBe(false);
    expect(isNote(undefined)).toBe(false);
    expect(isNote('note')).toBe(false);
    expect(isNote(7)).toBe(false);
  });
});
