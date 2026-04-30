/**
 * Core Data + CloudKit Bridge — iOS variant (feature 052).
 *
 * Single seam where the `CoreDataCloudKit` Expo Module is touched.
 * Resolved via `requireOptionalNativeModule` so the surface is
 * null-safe in unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  CoreDataCloudKitNotSupported,
  NATIVE_MODULE_NAME,
  type AccountStatus,
  type CoreDataCloudKitBridge,
  type Note,
  type NoteDraft,
  type SyncState,
} from './coredata-cloudkit.types';

export { CoreDataCloudKitNotSupported };

interface NativeCoreDataCloudKit {
  getAccountStatus(): Promise<AccountStatus>;
  fetchNotes(): Promise<readonly Note[]>;
  createNote(draft: NoteDraft): Promise<Note>;
  updateNote(id: string, patch: Partial<NoteDraft>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  simulateConflict(id: string): Promise<Note>;
  addListener?(eventName: string): void;
  removeListeners?(count: number): void;
  __observe?(listener: (state: SyncState) => void): () => void;
}

function getNative(): NativeCoreDataCloudKit | null {
  return requireOptionalNativeModule<NativeCoreDataCloudKit>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeCoreDataCloudKit {
  if (Platform.OS !== 'ios') {
    throw new CoreDataCloudKitNotSupported(
      `Core Data + CloudKit is not available on ${Platform.OS}`,
    );
  }
  const native = getNative();
  if (!native) {
    throw new CoreDataCloudKitNotSupported('CoreDataCloudKit native module is not registered');
  }
  return native;
}

export function getAccountStatus(): Promise<AccountStatus> {
  try {
    return ensureNative().getAccountStatus();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function fetchNotes(): Promise<readonly Note[]> {
  try {
    return ensureNative().fetchNotes();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createNote(draft: NoteDraft): Promise<Note> {
  try {
    return ensureNative().createNote(draft);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function updateNote(id: string, patch: Partial<NoteDraft>): Promise<Note> {
  try {
    return ensureNative().updateNote(id, patch);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function deleteNote(id: string): Promise<void> {
  try {
    return ensureNative().deleteNote(id);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function simulateConflict(id: string): Promise<Note> {
  try {
    return ensureNative().simulateConflict(id);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function subscribe(listener: (state: SyncState) => void): () => void {
  try {
    const native = ensureNative();
    if (typeof native.__observe === 'function') {
      return native.__observe(listener);
    }
    return () => {};
  } catch {
    return () => {};
  }
}

export const coredataCloudKit: CoreDataCloudKitBridge = {
  getAccountStatus,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  simulateConflict,
  subscribe,
};

export default coredataCloudKit;
