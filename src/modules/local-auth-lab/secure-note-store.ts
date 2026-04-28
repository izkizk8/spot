/**
 * secure-note-store — Keychain-backed CRUD for the LocalAuth Secure Note demo.
 *
 * Persists a single string value via `expo-secure-store` (Keychain on iOS,
 * EncryptedSharedPreferences on Android, in-memory on Web). All operations
 * are tolerant: SecureStore failures emit a `console.warn` and resolve
 * without rethrowing (read returns `null`, write/delete are no-ops).
 *
 * Single key: `spot.localauth.note`
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'spot.localauth.note';

export async function getStoredNote(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ?? null;
  } catch (err) {
    console.warn('[local-auth-lab] Failed to read note from SecureStore', err);
    return null;
  }
}

export async function setStoredNote(value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch (err) {
    console.warn('[local-auth-lab] Failed to write note to SecureStore', err);
  }
}

export async function clearStoredNote(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (err) {
    console.warn('[local-auth-lab] Failed to delete note from SecureStore', err);
  }
}
