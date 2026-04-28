/**
 * Test suite for siwa-store (feature 021).
 *
 * Covers:
 *   - Round-trip storage with getStoredUser / setStoredUser
 *   - Missing key returns null
 *   - SecureStore throws are caught and tolerated (warn but no rethrow)
 *   - JSON parse failures return null + warn
 */

import * as SecureStore from 'expo-secure-store';

import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '@/modules/sign-in-with-apple/siwa-store';
import type { StoredUser } from '@/modules/sign-in-with-apple/siwa-store';

jest.mock('expo-secure-store');

const mockSecureStore =
  require('expo-secure-store') as typeof import('../../../__mocks__/expo-secure-store');

describe('siwa-store', () => {
  beforeEach(() => {
    mockSecureStore.__reset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('round-trip', () => {
    it('sets and retrieves a stored user', async () => {
      const user: StoredUser = {
        id: 'user-123',
        email: 'test@example.com',
        givenName: 'Test',
        familyName: 'User',
        credentialState: 'authorized',
      };

      await setStoredUser(user);
      const retrieved = await getStoredUser();
      expect(retrieved).toEqual(user);
    });

    it('returns null when no user is stored', async () => {
      const retrieved = await getStoredUser();
      expect(retrieved).toBeNull();
    });

    it('clears a stored user', async () => {
      const user: StoredUser = { id: 'user-456' };
      await setStoredUser(user);
      await clearStoredUser();
      const retrieved = await getStoredUser();
      expect(retrieved).toBeNull();
    });
  });

  describe('failure tolerance', () => {
    it('returns null and warns when getItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('get');
      const retrieved = await getStoredUser();
      expect(retrieved).toBeNull();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[sign-in-with-apple] Failed to read from SecureStore',
      );
    });

    it('warns but resolves when setItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('set');
      const user: StoredUser = { id: 'user-789' };
      await expect(setStoredUser(user)).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[sign-in-with-apple] Failed to write to SecureStore',
      );
    });

    it('warns but resolves when deleteItemAsync throws', async () => {
      mockSecureStore.__setShouldThrow('delete');
      await expect(clearStoredUser()).resolves.toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[sign-in-with-apple] Failed to delete from SecureStore',
      );
    });

    it('returns null and warns when JSON is invalid', async () => {
      await SecureStore.setItemAsync('spot.siwa.user', 'not-valid-json');
      const retrieved = await getStoredUser();
      expect(retrieved).toBeNull();
      expect(console.warn).toHaveBeenCalled();
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '[sign-in-with-apple] Failed to parse stored user',
      );
    });
  });
});
