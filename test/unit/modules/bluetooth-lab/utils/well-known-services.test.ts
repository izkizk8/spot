/**
 * Well-known services — unit tests (T011).
 * Feature: 035-core-bluetooth
 */

import { WELL_KNOWN_SERVICES, lookup } from '@/modules/bluetooth-lab/utils/well-known-services';

describe('well-known-services', () => {
  it('catalog includes standard SIG short-form UUIDs', () => {
    expect(lookup('180f')).toBe('Battery Service');
    expect(lookup('180a')).toBe('Device Information');
    expect(lookup('1800')).toBe('Generic Access');
    expect(lookup('1801')).toBe('Generic Attribute');
    expect(lookup('180d')).toBe('Heart Rate');
  });

  it('lookup is case-insensitive (short form)', () => {
    expect(lookup('180F')).toBe('Battery Service');
    expect(lookup('180f')).toBe('Battery Service');
  });

  it('lookup accepts 36-char full UUIDs', () => {
    expect(lookup('0000180f-0000-1000-8000-00805f9b34fb')).toBe('Battery Service');
    expect(lookup('0000180F-0000-1000-8000-00805F9B34FB')).toBe('Battery Service');
  });

  it('returns undefined for unknown UUIDs', () => {
    expect(lookup('beef')).toBeUndefined();
    expect(lookup('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBeUndefined();
    expect(lookup('')).toBeUndefined();
  });

  it('catalog is frozen', () => {
    expect(Object.isFrozen(WELL_KNOWN_SERVICES)).toBe(true);
  });
});
