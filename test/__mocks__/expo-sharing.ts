/**
 * Jest mock for `expo-sharing` (feature 020).
 *
 * Provides a controllable `isAvailableAsync()` (toggle via `__setAvailable`)
 * and a `shareAsync()` jest.fn so tests can assert call shape without
 * exercising the native share sheet.
 */

let available = true;

export const isAvailableAsync = jest.fn(async () => available);
export const shareAsync = jest.fn(async (_uri: string, _options?: unknown) => undefined);

export function __setAvailable(b: boolean): void {
  available = b;
}

export function __reset(): void {
  available = true;
  isAvailableAsync.mockClear();
  shareAsync.mockClear();
}
