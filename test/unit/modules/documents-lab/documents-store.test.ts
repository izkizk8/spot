/**
 * Test: documents-store.ts (AsyncStorage-backed persistence)
 * Feature: 032-document-picker-quicklook
 *
 * Tests the pure `parsePersisted` function and side-effectful
 * `load` / `save` / `dropMissingURIs` APIs.
 *
 * @see specs/032-document-picker-quicklook/contracts/documents-store.contract.ts
 * @see specs/032-document-picker-quicklook/spec.md FR-009, FR-011, FR-012
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_STATE,
  DocumentEntry,
  DocumentsStoreState,
  dropMissingURIs,
  load,
  parsePersisted,
  save,
  STORAGE_KEY,
} from '@/modules/documents-lab/documents-store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Resolvers hoisted to module scope (oxlint: consistent-function-scoping)
const acceptExistsResolver = async (uri: string) => uri === 'file://exists';
const rejectBadResolver = async (uri: string) => {
  if (uri === 'file://bad') {
    throw new Error('resolver error');
  }
  return true;
};

describe('documents-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('STORAGE_KEY', () => {
    it('equals "spot.documents.list"', () => {
      expect(STORAGE_KEY).toBe('spot.documents.list');
    });
  });

  describe('parsePersisted', () => {
    it('returns DEFAULT_STATE for null without calling onError (S3)', () => {
      const onError = jest.fn();
      const result = parsePersisted(null, { onError });
      expect(result).toEqual(DEFAULT_STATE);
      expect(onError).not.toHaveBeenCalled();
    });

    it('returns DEFAULT_STATE and calls onError for invalid JSON (S4)', () => {
      const onError = jest.fn();
      const result = parsePersisted('not valid json', { onError });
      expect(result).toEqual(DEFAULT_STATE);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'parse' }));
    });

    it('returns DEFAULT_STATE and calls onError for non-object root (S5)', () => {
      const onError = jest.fn();
      const result = parsePersisted(JSON.stringify(42), { onError });
      expect(result).toEqual(DEFAULT_STATE);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'shape' }));
    });

    it('drops rows missing required fields and calls onError once with kind: rows (S6)', () => {
      const onError = jest.fn();
      const state = {
        files: [
          {
            id: '1',
            name: 'valid.txt',
            uri: 'file://valid',
            mimeType: 'text/plain',
            size: 100,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
          {
            // Missing uri
            id: '2',
            name: 'invalid',
            mimeType: 'text/plain',
            size: 50,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
        ],
        filter: 'all',
      };

      const result = parsePersisted(JSON.stringify(state), { onError });
      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe('1');
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rows', dropped: 1 }));
    });

    it('falls back unrecognised filter to "all" without error (S7)', () => {
      const onError = jest.fn();
      const state = {
        files: [],
        filter: 'unknown-filter',
      };

      const result = parsePersisted(JSON.stringify(state), { onError });
      expect(result.filter).toBe('all');
      expect(onError).not.toHaveBeenCalled();
    });

    it('allows duplicate entries in files array (S9 / FR-005 AS3)', () => {
      const entry: DocumentEntry = {
        id: '1',
        name: 'doc.txt',
        uri: 'file://doc',
        mimeType: 'text/plain',
        size: 100,
        addedAt: '2026-04-29T00:00:00Z',
        source: 'picker',
      };

      const state = {
        files: [entry, entry], // Duplicate
        filter: 'all',
      };

      const onError = jest.fn();
      const result = parsePersisted(JSON.stringify(state), { onError });
      expect(result.files).toHaveLength(2);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('save and load round-trip', () => {
    it('saves to AsyncStorage and loads back structurally equal state', async () => {
      const state: DocumentsStoreState = {
        files: [
          {
            id: '1',
            name: 'test.txt',
            uri: 'file://test',
            mimeType: 'text/plain',
            size: 100,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
        ],
        filter: 'images',
      };

      let stored: string | null = null;
      (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
        stored = value;
      });
      (AsyncStorage.getItem as jest.Mock).mockImplementation(async () => stored);

      await save(state);
      const loaded = await load();

      expect(loaded).toEqual(state);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('load with AsyncStorage errors', () => {
    it('returns DEFAULT_STATE and surfaces error via onError when getItem throws', async () => {
      const onError = jest.fn();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage error'));

      const result = await load({ onError });

      expect(result).toEqual(DEFAULT_STATE);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('dropMissingURIs', () => {
    it('keeps only entries whose resolver returns true (S8)', async () => {
      const state: DocumentsStoreState = {
        files: [
          {
            id: '1',
            name: 'exists.txt',
            uri: 'file://exists',
            mimeType: 'text/plain',
            size: 100,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
          {
            id: '2',
            name: 'missing.txt',
            uri: 'file://missing',
            mimeType: 'text/plain',
            size: 50,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
        ],
        filter: 'all',
      };

      const result = await dropMissingURIs(state, acceptExistsResolver);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe('1');
    });

    it('treats resolver rejection as false and drops that entry', async () => {
      const state: DocumentsStoreState = {
        files: [
          {
            id: '1',
            name: 'good.txt',
            uri: 'file://good',
            mimeType: 'text/plain',
            size: 100,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
          {
            id: '2',
            name: 'bad.txt',
            uri: 'file://bad',
            mimeType: 'text/plain',
            size: 50,
            addedAt: '2026-04-29T00:00:00Z',
            source: 'picker',
          },
        ],
        filter: 'all',
      };

      const result = await dropMissingURIs(state, rejectBadResolver);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe('1');
    });
  });
});
