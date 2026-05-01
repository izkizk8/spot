/**
 * @jest-environment node
 */

import {
  AUTH_STATUSES,
  CHARACTERISTIC_KINDS,
  PERCENT_SEGMENTS,
  coerceForKind,
  formatValue,
  labelForAuthStatus,
  labelForKind,
  snapPercent,
} from '@/modules/homekit-lab/characteristic-types';

describe('characteristic-types — frozen catalogues', () => {
  it('AUTH_STATUSES is frozen and contains the four states', () => {
    expect(Object.isFrozen(AUTH_STATUSES)).toBe(true);
    expect(AUTH_STATUSES).toEqual(['notDetermined', 'authorized', 'denied', 'restricted']);
  });

  it('CHARACTERISTIC_KINDS is frozen and contains the four kinds', () => {
    expect(Object.isFrozen(CHARACTERISTIC_KINDS)).toBe(true);
    expect(CHARACTERISTIC_KINDS).toEqual(['bool', 'percent', 'enum', 'readonly']);
  });

  it('PERCENT_SEGMENTS is frozen and contains 0/25/50/75/100', () => {
    expect(Object.isFrozen(PERCENT_SEGMENTS)).toBe(true);
    expect(PERCENT_SEGMENTS).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('labelForAuthStatus', () => {
  it('renders human labels for each status', () => {
    expect(labelForAuthStatus('notDetermined')).toBe('Not determined');
    expect(labelForAuthStatus('authorized')).toBe('Authorized');
    expect(labelForAuthStatus('denied')).toBe('Denied');
    expect(labelForAuthStatus('restricted')).toBe('Restricted');
  });
});

describe('labelForKind', () => {
  it('renders human labels for each kind', () => {
    expect(labelForKind('bool')).toBe('Toggle');
    expect(labelForKind('percent')).toBe('Percent');
    expect(labelForKind('enum')).toBe('Picker');
    expect(labelForKind('readonly')).toBe('Read-only');
  });
});

describe('snapPercent', () => {
  it('snaps arbitrary inputs to the nearest 25-step segment', () => {
    expect(snapPercent(0)).toBe(0);
    expect(snapPercent(10)).toBe(0);
    expect(snapPercent(13)).toBe(25);
    expect(snapPercent(40)).toBe(50);
    expect(snapPercent(74)).toBe(75);
    expect(snapPercent(100)).toBe(100);
  });

  it('clamps out-of-range inputs', () => {
    expect(snapPercent(-50)).toBe(0);
    expect(snapPercent(9999)).toBe(100);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(snapPercent(NaN)).toBe(0);
    expect(snapPercent(Infinity)).toBe(0);
  });
});

describe('coerceForKind', () => {
  it('coerces booleans for kind=bool', () => {
    expect(coerceForKind('bool', true)).toBe(true);
    expect(coerceForKind('bool', false)).toBe(false);
    expect(coerceForKind('bool', 1)).toBe(true);
    expect(coerceForKind('bool', 0)).toBe(false);
    expect(coerceForKind('bool', 'true')).toBe(true);
    expect(coerceForKind('bool', '1')).toBe(true);
    expect(coerceForKind('bool', 'no')).toBe(false);
    expect(coerceForKind('bool', null)).toBeNull();
  });

  it('coerces & snaps numbers for kind=percent', () => {
    expect(coerceForKind('percent', 60)).toBe(50);
    expect(coerceForKind('percent', '50')).toBe(50);
    expect(coerceForKind('percent', 'abc')).toBeNull();
  });

  it('validates enum membership', () => {
    const options = [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ];
    expect(coerceForKind('enum', 1, options)).toBe(1);
    expect(coerceForKind('enum', 2, options)).toBeNull();
    expect(coerceForKind('enum', 'abc', options)).toBeNull();
    expect(coerceForKind('enum', 1, [])).toBeNull();
    expect(coerceForKind('enum', 1)).toBeNull();
  });

  it('rejects all writes when kind=readonly', () => {
    expect(coerceForKind('readonly', 1)).toBeNull();
    expect(coerceForKind('readonly', true)).toBeNull();
  });
});

describe('formatValue', () => {
  it('formats null/undefined as em-dash', () => {
    expect(formatValue('bool', null)).toBe('—');
    expect(formatValue('percent', undefined)).toBe('—');
  });

  it('formats booleans as On/Off', () => {
    expect(formatValue('bool', true)).toBe('On');
    expect(formatValue('bool', false)).toBe('Off');
  });

  it('formats percent values with %', () => {
    expect(formatValue('percent', 50)).toBe('50%');
    expect(formatValue('percent', 33.6)).toBe('34%');
  });

  it('formats enum values via options when known', () => {
    const options = [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ];
    expect(formatValue('enum', 1, options)).toBe('On');
    expect(formatValue('enum', 9, options)).toBe('9');
    expect(formatValue('enum', 'x', options)).toBe('x');
  });

  it('formats readonly as toString', () => {
    expect(formatValue('readonly', 42)).toBe('42');
    expect(formatValue('readonly', 'abc')).toBe('abc');
  });
});
