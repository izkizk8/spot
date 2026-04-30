/**
 * useNotesStore Hook Test
 * Feature: 052-core-data-cloudkit
 *
 * Exercises CRUD, sync state transitions, observer
 * subscribe/unsubscribe, and error paths.
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

import {
  __setCoreDataCloudKitBridgeForTests,
  useNotesStore,
} from '@/modules/coredata-cloudkit-lab/hooks/useNotesStore';
import type {
  CoreDataCloudKitBridge,
  Note,
  NoteDraft,
  SyncState,
} from '@/native/coredata-cloudkit.types';

const sample = (id: string, ts = 1): Note => ({
  id,
  title: `t-${id}`,
  body: `b-${id}`,
  createdAt: ts,
  updatedAt: ts,
});

describe('useNotesStore', () => {
  let bridge: CoreDataCloudKitBridge;
  let listeners: ((s: SyncState) => void)[];
  let unsubscribeSpy: jest.Mock<() => void>;

  beforeEach(() => {
    listeners = [];
    unsubscribeSpy = jest.fn<() => void>();
    bridge = {
      getAccountStatus: jest.fn(async (): Promise<'available'> => 'available'),
      fetchNotes: jest.fn(async (): Promise<readonly Note[]> => [sample('a'), sample('b')]),
      createNote: jest.fn(
        async (draft: NoteDraft): Promise<Note> => ({
          id: 'new',
          title: draft.title,
          body: draft.body,
          createdAt: 100,
          updatedAt: 100,
        }),
      ),
      updateNote: jest.fn(
        async (id: string, patch: Partial<NoteDraft>): Promise<Note> => ({
          id,
          title: patch.title ?? 't',
          body: patch.body ?? 'b',
          createdAt: 1,
          updatedAt: 200,
        }),
      ),
      deleteNote: jest.fn(async (_id: string): Promise<void> => {}),
      simulateConflict: jest.fn(
        async (id: string): Promise<Note> => ({
          id,
          title: 'conflict-resolved',
          body: 'last-write-wins',
          createdAt: 1,
          updatedAt: 300,
        }),
      ),
      subscribe: jest.fn((listener: (s: SyncState) => void): (() => void) => {
        listeners.push(listener);
        return unsubscribeSpy;
      }),
    };
    __setCoreDataCloudKitBridgeForTests(bridge);
  });

  afterEach(() => {
    __setCoreDataCloudKitBridgeForTests(null);
  });

  it('initial state', () => {
    const { result } = renderHook(() => useNotesStore());
    expect(result.current.accountStatus).toBeNull();
    expect(result.current.syncState).toBe('idle');
    expect(result.current.notes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('subscribes on mount and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useNotesStore());
    expect(bridge.subscribe).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('observer pushes sync state into the hook', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      listeners[0]('offline');
    });
    expect(result.current.syncState).toBe('offline');
    await act(async () => {
      listeners[0]('synced');
    });
    expect(result.current.syncState).toBe('synced');
  });

  it('refreshAccount populates accountStatus', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshAccount();
    });
    expect(result.current.accountStatus).toBe('available');
  });

  it('refreshAccount records errors and clears status', async () => {
    bridge.getAccountStatus = jest.fn(async () => {
      throw new Error('account-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshAccount();
    });
    expect(result.current.accountStatus).toBeNull();
    expect(result.current.lastError?.message).toBe('account-failed');
  });

  it('refreshNotes loads the list and toggles loading', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshNotes();
    });
    expect(result.current.notes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refreshNotes records error and resets loading', async () => {
    bridge.fetchNotes = jest.fn(async () => {
      throw new Error('fetch-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshNotes();
    });
    expect(result.current.lastError?.message).toBe('fetch-failed');
    expect(result.current.loading).toBe(false);
  });

  it('createNote prepends the new note and lands in synced', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.createNote({ title: 'n', body: 'd' });
    });
    expect(result.current.notes[0]?.id).toBe('new');
    expect(result.current.syncState).toBe('synced');
  });

  it('createNote records error and lands in error state', async () => {
    bridge.createNote = jest.fn(async () => {
      throw new Error('create-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    let returned: Note | null = sample('placeholder');
    await act(async () => {
      returned = await result.current.createNote({ title: 'n', body: 'd' });
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('create-failed');
    expect(result.current.syncState).toBe('error');
  });

  it('updateNote replaces the existing note', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshNotes();
    });
    await act(async () => {
      await result.current.updateNote('a', { title: 'changed' });
    });
    const a = result.current.notes.find((n) => n.id === 'a');
    expect(a?.title).toBe('changed');
    expect(result.current.syncState).toBe('synced');
  });

  it('updateNote error path', async () => {
    bridge.updateNote = jest.fn(async () => {
      throw new Error('update-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.updateNote('a', { title: 'x' });
    });
    expect(result.current.syncState).toBe('error');
    expect(result.current.lastError?.message).toBe('update-failed');
  });

  it('deleteNote removes the note', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshNotes();
    });
    await act(async () => {
      await result.current.deleteNote('a');
    });
    expect(result.current.notes.map((n) => n.id)).toEqual(['b']);
    expect(result.current.syncState).toBe('synced');
  });

  it('deleteNote error path', async () => {
    bridge.deleteNote = jest.fn(async () => {
      throw new Error('delete-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.deleteNote('a');
    });
    expect(result.current.syncState).toBe('error');
    expect(result.current.lastError?.message).toBe('delete-failed');
  });

  it('simulateConflict swaps the matching note in', async () => {
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.refreshNotes();
    });
    await act(async () => {
      await result.current.simulateConflict('a');
    });
    const a = result.current.notes.find((n) => n.id === 'a');
    expect(a?.title).toBe('conflict-resolved');
  });

  it('simulateConflict error path', async () => {
    bridge.simulateConflict = jest.fn(async () => {
      throw new Error('conflict-failed');
    });
    __setCoreDataCloudKitBridgeForTests(bridge);
    const { result } = renderHook(() => useNotesStore());
    await act(async () => {
      await result.current.simulateConflict('a');
    });
    expect(result.current.syncState).toBe('error');
    expect(result.current.lastError?.message).toBe('conflict-failed');
  });
});
