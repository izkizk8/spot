/**
 * Test suite for secure-note-store (feature 022).
 *
 * Covers: round-trip storage, missing key returns null, SecureStore failure
 * tolerance for read/write/delete.
 */

import {
  getStoredNote,
  setStoredNote,
  clearStoredNote,
} from '@/modules/local-auth-lab/secure-note-store';

jest.mock('expo-secure-store');

const mockSecureStore =
  require('expo-secure-store') as typeof import('../../../__mocks__/expo-secure-store');

describe('secure-note-store', () => {
  beforeEach(() => {
    mockSecureStore.__reset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('round-trip', () => {
    it('sets and retrieves a stored note', async () => {
      await setStoredNote('hello-world');
      const retrieved = await getStoredNote();
      expect(retrieved).toBe('hello-world');
    });

    it('returns null when no note is stored', async () => {
      const retrieved = await getStoredNote();
      expect(retrieved).toBeNull();
    });

    it('clears a stored note', async () => {
      await setStoredNote('to-be-cleared');
      await clearStoredNote();
      const retrieved = await getStoredNote();
      expect(retrieved).toBeNull();
    });
  });

  describe('failure tolerance', () => {
    it('returns null and warns when getItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('get');
      const retrieved = await getStoredNote();
      expect(retrieved).toBeNull();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[local-auth-lab] Failed to read note from SecureStore',
      );
    });

    it('warns but resolves when setItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('set');
      await expect(setStoredNote('x')).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[local-auth-lab] Failed to write note to SecureStore',
      );
    });

    it('warns but resolves when deleteItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('delete');
      await expect(clearStoredNote()).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[local-auth-lab] Failed to delete note from SecureStore',
      );
    });
  });
});
