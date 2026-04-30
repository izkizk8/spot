/**
 * Unit tests: invocation-sources catalog (feature 042).
 *
 * @jest-environment node
 */

import {
  INVOCATION_SOURCES,
  findInvocationSource,
  type InvocationSourceId,
} from '@/modules/app-clips-lab/invocation-sources';

describe('invocation-sources catalog', () => {
  it('contains at least the 6 documented surfaces (NFC, QR, Maps, Safari, Messages, Default)', () => {
    const ids = INVOCATION_SOURCES.map((s) => s.id);
    const expected: InvocationSourceId[] = ['nfc', 'qr', 'maps', 'safari', 'messages', 'default'];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });

  it('has no duplicate ids', () => {
    const ids = INVOCATION_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a non-empty label, description, and hint', () => {
    for (const s of INVOCATION_SOURCES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
    }
  });

  it('catalog is frozen at module load (cannot push)', () => {
    expect(Object.isFrozen(INVOCATION_SOURCES)).toBe(true);
    const fn = () => {
      const arr = INVOCATION_SOURCES as unknown as InvocationSourceId[];
      arr.push('safari');
    };
    expect(fn).toThrow(/object is not extensible|read only|frozen/i);
  });

  it('individual entries are frozen', () => {
    for (const s of INVOCATION_SOURCES) {
      expect(Object.isFrozen(s)).toBe(true);
    }
  });

  it('findInvocationSource resolves known ids and returns undefined for unknown', () => {
    expect(findInvocationSource('nfc')?.id).toBe('nfc');
    expect(findInvocationSource('qr')?.id).toBe('qr');
    expect(findInvocationSource('unknown-thing')).toBeUndefined();
  });
});
