/**
 * Core Data + CloudKit Bridge — Android stub (feature 052).
 *
 * Core Data + CloudKit is iOS-only. All methods reject with
 * `CoreDataCloudKitNotSupported`. MUST NOT import the iOS variant.
 */

import {
  CoreDataCloudKitNotSupported,
  type AccountStatus,
  type CoreDataCloudKitBridge,
  type Note,
  type NoteDraft,
  type SyncState,
} from './coredata-cloudkit.types';

export { CoreDataCloudKitNotSupported };

const ERR = (): CoreDataCloudKitNotSupported =>
  new CoreDataCloudKitNotSupported('Core Data + CloudKit is not available on Android');

export function getAccountStatus(): Promise<AccountStatus> {
  return Promise.reject(ERR());
}

export function fetchNotes(): Promise<readonly Note[]> {
  return Promise.reject(ERR());
}

export function createNote(_draft: NoteDraft): Promise<Note> {
  return Promise.reject(ERR());
}

export function updateNote(_id: string, _patch: Partial<NoteDraft>): Promise<Note> {
  return Promise.reject(ERR());
}

export function deleteNote(_id: string): Promise<void> {
  return Promise.reject(ERR());
}

export function simulateConflict(_id: string): Promise<Note> {
  return Promise.reject(ERR());
}

export function subscribe(_listener: (state: SyncState) => void): () => void {
  return () => {};
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
