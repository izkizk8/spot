/**
 * Bytes utilities — hex / base64 helpers.
 * Feature: 035-core-bluetooth
 *
 * Pure functions, no I/O. Consumed by the hook (read/write/notify event
 * formatting), the EventLog component, and the Write form in
 * CharacteristicRow.
 *
 * @see specs/035-core-bluetooth/data-model.md (Entity 10)
 */

const HEX_RE = /^[0-9a-fA-F]*$/;

export class InvalidHexError extends Error {
  public readonly code = 'INVALID_HEX' as const;
  constructor(message?: string) {
    super(message ?? 'Invalid hex input');
    this.name = 'InvalidHexError';
  }
}

/**
 * Encode bytes as a lower-case hex string with no separators.
 * Empty input returns ''.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Decode a hex string into a Uint8Array. Accepts upper/lower case.
 * Rejects odd-length or non-hex input by throwing InvalidHexError.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length === 0) return new Uint8Array(0);
  if (hex.length % 2 !== 0) {
    throw new InvalidHexError(`Hex input has odd length: ${hex.length}`);
  }
  if (!HEX_RE.test(hex)) {
    throw new InvalidHexError('Hex input contains non-hex characters');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Pretty-format bytes with a single space between each byte (lower-case).
 * Empty input returns ''.
 */
export function bytesToPrettyHex(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return parts.join(' ');
}

/**
 * Decode a base64 string into a Uint8Array. Empty input returns an empty array.
 */
export function base64ToBytes(b64: string): Uint8Array {
  if (b64.length === 0) return new Uint8Array(0);
  // atob is available in RN's Hermes runtime and the browser; for Node test
  // environments, fall back to Buffer.
  const decoder: ((s: string) => string) | undefined = (
    globalThis as unknown as { atob?: (s: string) => string }
  ).atob;
  let bin: string;
  if (typeof decoder === 'function') {
    bin = decoder(b64);
  } else {
    // Node fallback (jest)
    const BufferCtor = (
      globalThis as unknown as {
        Buffer?: { from(input: string, encoding: string): { toString(encoding: string): string } };
      }
    ).Buffer;
    if (!BufferCtor) {
      throw new Error('No base64 decoder available');
    }
    bin = BufferCtor.from(b64, 'base64').toString('binary');
  }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Encode bytes as base64. Empty input returns ''.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  const encoder: ((s: string) => string) | undefined = (
    globalThis as unknown as { btoa?: (s: string) => string }
  ).btoa;
  if (typeof encoder === 'function') {
    return encoder(bin);
  }
  const BufferCtor = (
    globalThis as unknown as {
      Buffer?: { from(input: string, encoding: string): { toString(encoding: string): string } };
    }
  ).Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bin, 'binary').toString('base64');
  }
  throw new Error('No base64 encoder available');
}
