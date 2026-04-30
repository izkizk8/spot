/**
 * useNotesStore Hook
 * Feature: 052-core-data-cloudkit
 *
 * State machine for the Core Data + CloudKit lab. Tracks the current
 * CloudKit account status, the in-flight sync state surfaced by the
 * `NSPersistentStoreRemoteChange` observer, the Note list, and the
 * last error. The native bridge is replaceable at the import boundary
 * via `__setCoreDataCloudKitBridgeForTests` for unit tests.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import coredataCloudKitDefault from '@/native/coredata-cloudkit';
import type {
  AccountStatus,
  CoreDataCloudKitBridge,
  Note,
  NoteDraft,
  SyncState,
} from '@/native/coredata-cloudkit.types';

let mockBridge: CoreDataCloudKitBridge | null = null;

export function __setCoreDataCloudKitBridgeForTests(bridge: CoreDataCloudKitBridge | null) {
  mockBridge = bridge;
}

function getBridge(): CoreDataCloudKitBridge {
  if (mockBridge) return mockBridge;
  return coredataCloudKitDefault;
}

interface NotesStoreState {
  accountStatus: AccountStatus | null;
  syncState: SyncState;
  notes: readonly Note[];
  loading: boolean;
  lastError: Error | null;
}

interface NotesStoreActions {
  refreshAccount: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  createNote: (draft: NoteDraft) => Promise<Note | null>;
  updateNote: (id: string, patch: Partial<NoteDraft>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;
  simulateConflict: (id: string) => Promise<Note | null>;
}

export function useNotesStore(): NotesStoreState & NotesStoreActions {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [notes, setNotes] = useState<readonly Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshAccount = useCallback(async () => {
    try {
      const bridge = getBridge();
      const status = await bridge.getAccountStatus();
      setAccountStatus(status);
    } catch (err) {
      setLastError(err as Error);
      setAccountStatus(null);
    }
  }, []);

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const list = await bridge.fetchNotes();
      setNotes(list);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (draft: NoteDraft): Promise<Note | null> => {
    setLastError(null);
    setSyncState('syncing');
    try {
      const bridge = getBridge();
      const note = await bridge.createNote(draft);
      setNotes((prev) => [note, ...prev]);
      setSyncState('synced');
      return note;
    } catch (err) {
      setLastError(err as Error);
      setSyncState('error');
      return null;
    }
  }, []);

  const updateNote = useCallback(
    async (id: string, patch: Partial<NoteDraft>): Promise<Note | null> => {
      setLastError(null);
      setSyncState('syncing');
      try {
        const bridge = getBridge();
        const note = await bridge.updateNote(id, patch);
        setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
        setSyncState('synced');
        return note;
      } catch (err) {
        setLastError(err as Error);
        setSyncState('error');
        return null;
      }
    },
    [],
  );

  const deleteNote = useCallback(async (id: string) => {
    setLastError(null);
    setSyncState('syncing');
    try {
      const bridge = getBridge();
      await bridge.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setSyncState('synced');
    } catch (err) {
      setLastError(err as Error);
      setSyncState('error');
    }
  }, []);

  const simulateConflict = useCallback(async (id: string): Promise<Note | null> => {
    setLastError(null);
    setSyncState('syncing');
    try {
      const bridge = getBridge();
      const note = await bridge.simulateConflict(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
      setSyncState('synced');
      return note;
    } catch (err) {
      setLastError(err as Error);
      setSyncState('error');
      return null;
    }
  }, []);

  // Subscribe once; unsubscribe on unmount.
  useEffect(() => {
    const bridge = getBridge();
    const unsub = bridge.subscribe((next) => {
      setSyncState(next);
    });
    unsubscribeRef.current = unsub;
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  return {
    accountStatus,
    syncState,
    notes,
    loading,
    lastError,
    refreshAccount,
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    simulateConflict,
  };
}
