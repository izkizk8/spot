/**
 * T042 [US2]: format-utils boundary tests.
 */

import { bytesToHuman, formatDurationMs } from '@/modules/audio-lab/format-utils';

describe('bytesToHuman', () => {
  it('< 1024 → "NNN B"', () => {
    expect(bytesToHuman(0)).toBe('0 B');
    expect(bytesToHuman(512)).toBe('512 B');
    expect(bytesToHuman(1023)).toBe('1023 B');
  });

  it('1024 → "1.0 KB"; < 1024² → "N.N KB"', () => {
    expect(bytesToHuman(1024)).toBe('1.0 KB');
    expect(bytesToHuman(Math.round(12.5 * 1024))).toBe('12.5 KB');
  });

  it('1024² → "1.0 MB"; < 1024³ → "N.N MB"', () => {
    expect(bytesToHuman(1024 * 1024)).toBe('1.0 MB');
    expect(bytesToHuman(Math.round(4.2 * 1024 * 1024))).toBe('4.2 MB');
  });

  it('≥ 1024³ → "N.N GB"', () => {
    expect(bytesToHuman(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  it('clamps negative / non-finite inputs', () => {
    expect(bytesToHuman(-1)).toBe('0 B');
    expect(bytesToHuman(Number.NaN)).toBe('0 B');
  });
});

describe('formatDurationMs', () => {
  it('0 ms → "0:00"', () => {
    expect(formatDurationMs(0)).toBe('0:00');
  });

  it('65000 ms → "1:05"', () => {
    expect(formatDurationMs(65_000)).toBe('1:05');
  });

  it('3661000 ms → "1:01:01"', () => {
    expect(formatDurationMs(3_661_000)).toBe('1:01:01');
  });

  it('clamps negative inputs', () => {
    expect(formatDurationMs(-1000)).toBe('0:00');
  });
});
