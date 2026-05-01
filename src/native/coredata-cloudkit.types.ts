/**
 * Core Data + CloudKit Bridge Types
 * Feature: 052-core-data-cloudkit
 *
 * Shared type definitions for the NSPersistentCloudKitContainer
 * bridge. iOS 13+ Core Data store mirrored to CloudKit's private
 * database.
 */

export const NATIVE_MODULE_NAME = 'CoreDataCloudKit' as const;

/**
 * CloudKit account state — mirrors `CKAccountStatus`.
 */
export type AccountStatus =
  | 'available'
  | 'noAccount'
  | 'restricted'
  | 'couldNotDetermine'
  | 'temporarilyUnavailable';

/**
 * Sync state surfaced from observers wired to
 * `NSPersistentStoreRemoteChange` notifications.
 */
export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

/**
 * Persisted Note entity. `createdAt` and `updatedAt` are epoch ms.
 */
export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Insert payload — id and timestamps assigned by the bridge.
 */
export interface NoteDraft {
  title: string;
  body: string;
}

export interface CoreDataCloudKitBridge {
  getAccountStatus(): Promise<AccountStatus>;
  fetchNotes(): Promise<readonly Note[]>;
  createNote(draft: NoteDraft): Promise<Note>;
  updateNote(id: string, patch: Partial<NoteDraft>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  simulateConflict(id: string): Promise<Note>;
  subscribe(listener: (state: SyncState) => void): () => void;
}

export class CoreDataCloudKitNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoreDataCloudKitNotSupported';
  }
}
