/**
 * siwa-store — Keychain-backed CRUD for Sign in with Apple user records.
 *
 * Persists the last-known user credential via `expo-secure-store` (Keychain on
 * iOS, EncryptedSharedPreferences on Android, in-memory on Web). All operations
 * are tolerant: SecureStore failures emit a `console.warn` and resolve without
 * rethrowing (read returns `null`, write/delete are no-ops).
 *
 * Single key: `spot.siwa.user`
 * Format: `JSON.stringify(StoredUser)`
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'spot.siwa.user';

export interface StoredUser {
  id: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  credentialState?: 'authorized' | 'revoked' | 'notFound' | 'transferred';
}

export async function getStoredUser(): Promise<StoredUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      console.warn('[sign-in-with-apple] Failed to parse stored user; returning null');
      return null;
    }
  } catch (err) {
    console.warn('[sign-in-with-apple] Failed to read from SecureStore', err);
    return null;
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('[sign-in-with-apple] Failed to write to SecureStore', err);
  }
}

export async function clearStoredUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (err) {
    console.warn('[sign-in-with-apple] Failed to delete from SecureStore', err);
  }
}
