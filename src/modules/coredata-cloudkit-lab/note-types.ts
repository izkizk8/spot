/**
 * Note types for the Core Data + CloudKit Lab module
 * Feature: 052-core-data-cloudkit
 *
 * Mirrors the bridge contract but adds JS-side helpers (`createDraft`)
 * used by the editor and the conflict demo to assemble payloads
 * before they hit the native module.
 */

import type { Note, NoteDraft } from '@/native/coredata-cloudkit.types';

export type { Note, NoteDraft };

export const EMPTY_TITLE = 'Untitled note' as const;

/**
 * Build a `NoteDraft` from an optional partial. Empty fields fall
 * back to safe defaults so the draft is always valid for `createNote`.
 */
export function createDraft(partial?: Partial<NoteDraft>): NoteDraft {
  return {
    title: partial?.title?.trim() || EMPTY_TITLE,
    body: partial?.body ?? '',
  };
}

/**
 * Type guard — narrow an unknown value to a `Note`.
 */
export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.body === 'string' &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number'
  );
}
