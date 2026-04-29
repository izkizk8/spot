/**
 * Bytes utilities — unit tests (T009).
 * Feature: 035-core-bluetooth
 */

import {
  bytesToHex,
  hexToBytes,
  bytesToPrettyHex,
  base64ToBytes,
  bytesToBase64,
  InvalidHexError,
} from '@/modules/bluetooth-lab/utils/bytes-utils';

describe('bytes-utils', () => {
  describe('bytesToHex', () => {
    it('returns "" for empty input', () => {
      expect(bytesToHex(new Uint8Array(0))).toBe('');
    });

    it('encodes a single byte as 2 lowercase hex chars', () => {
      expect(bytesToHex(new Uint8Array([0xab]))).toBe('ab');
      expect(bytesToHex(new Uint8Array([0x00]))).toBe('00');
    });

    it('encodes 16 bytes with no separators (lowercase)', () => {
      const bytes = new Uint8Array([
        0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee,
        0xff,
      ]);
      expect(bytesToHex(bytes)).toBe('00112233445566778899aabbccddeeff');
    });
  });

  describe('hexToBytes', () => {
    it('round-trips with bytesToHex', () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
    });

    it('accepts upper- and lower-case input', () => {
      expect(hexToBytes('DeAdBeEf')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    });

    it('rejects odd-length input by throwing InvalidHexError', () => {
      expect(() => hexToBytes('abc')).toThrow(InvalidHexError);
    });

    it('rejects non-hex input by throwing InvalidHexError', () => {
      expect(() => hexToBytes('zz')).toThrow(InvalidHexError);
    });

    it('returns empty array for empty input', () => {
      expect(hexToBytes('')).toEqual(new Uint8Array(0));
    });
  });

  describe('bytesToPrettyHex', () => {
    it('returns "" for empty input', () => {
      expect(bytesToPrettyHex(new Uint8Array(0))).toBe('');
    });

    it('groups every 2 chars with a single space', () => {
      expect(bytesToPrettyHex(new Uint8Array([0xaa, 0xbb, 0xcc]))).toBe('aa bb cc');
    });
  });

  describe('base64 ↔ bytes round-trip', () => {
    it('round-trips arbitrary bytes', () => {
      const bytes = new Uint8Array([0, 1, 2, 254, 255]);
      const b64 = bytesToBase64(bytes);
      expect(base64ToBytes(b64)).toEqual(bytes);
    });

    it('returns "" / Uint8Array(0) for empty input', () => {
      expect(bytesToBase64(new Uint8Array(0))).toBe('');
      expect(base64ToBytes('')).toEqual(new Uint8Array(0));
    });
  });
});
