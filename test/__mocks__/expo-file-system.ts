/**
 * Jest mock for `expo-file-system` (feature 020).
 *
 * Tracks an in-memory map of URI → { exists, size } so tests can stage
 * different on-disk states for the recordings-store cleanup pass and the
 * file-missing playback paths.
 */

interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
}

export const documentDirectory = 'file:///mock/documents/';

const fileMap = new Map<string, { exists: boolean; size?: number }>();

export const getInfoAsync = jest.fn(async (uri: string): Promise<FileInfo> => {
  const entry = fileMap.get(uri);
  if (!entry) {
    return { exists: false, uri };
  }
  return { exists: entry.exists, uri, size: entry.size };
});

export const makeDirectoryAsync = jest.fn(
  async (_uri: string, _options?: { intermediates?: boolean }) => undefined,
);

export const deleteAsync = jest.fn(async (uri: string, _options?: { idempotent?: boolean }) => {
  fileMap.delete(uri);
});

export const readDirectoryAsync = jest.fn(async (_uri: string): Promise<string[]> => []);

export const writeAsStringAsync = jest.fn(async (_uri: string, _data: string) => undefined);

export const readAsStringAsync = jest.fn(async (_uri: string) => '');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function __setExists(uri: string, exists: boolean, size?: number): void {
  fileMap.set(uri, { exists, size });
}

export function __reset(): void {
  fileMap.clear();
  getInfoAsync.mockClear();
  makeDirectoryAsync.mockClear();
  deleteAsync.mockClear();
  readDirectoryAsync.mockClear();
  writeAsStringAsync.mockClear();
  readAsStringAsync.mockClear();
}
