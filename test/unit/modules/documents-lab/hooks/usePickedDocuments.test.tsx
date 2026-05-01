/**
 * Tests for usePickedDocuments hook — feature 032 / T023.
 *
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockLoad = jest.fn();
const mockSave = jest.fn();

jest.mock('@/modules/documents-lab/documents-store', () => ({
  __esModule: true,
  load: (opts?: unknown) => mockLoad(opts),
  save: (state: unknown) => mockSave(state),
  STORAGE_KEY: 'spot.documents.list',
  DEFAULT_STATE: { files: [], filter: 'all' },
}));

import { usePickedDocuments } from '@/modules/documents-lab/hooks/usePickedDocuments';
import type { DocumentEntry } from '@/modules/documents-lab/documents-store';

function makeEntry(overrides: Partial<DocumentEntry> = {}): DocumentEntry {
  return {
    id: overrides.id ?? `id-${Math.random()}`,
    name: overrides.name ?? 'doc.txt',
    uri: overrides.uri ?? 'file://doc',
    mimeType: overrides.mimeType ?? 'text/plain',
    size: overrides.size ?? 100,
    addedAt: overrides.addedAt ?? '2026-04-29T00:00:00Z',
    source: overrides.source ?? 'picker',
  };
}

describe('usePickedDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoad.mockResolvedValue({ files: [], filter: 'all' });
    mockSave.mockResolvedValue(undefined);
  });

  it('calls load exactly once on mount and rehydrates files / filter', async () => {
    const persisted = {
      files: [makeEntry({ id: 'a' })],
      filter: 'images' as const,
    };
    mockLoad.mockResolvedValue(persisted);

    const { result } = renderHook(() => usePickedDocuments());

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
    });
    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(result.current.filter).toBe('images');
  });

  it('add(entry) appends, persists, and exposes new entry on next render', async () => {
    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    const entry = makeEntry({ id: 'new-1', mimeType: 'text/plain' });
    await act(async () => {
      result.current.add(entry);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('new-1');
    expect(mockSave).toHaveBeenCalled();
  });

  it('add with filter=images and a text entry stores but hides until filter changes (FR-004 + FR-010)', async () => {
    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    await act(async () => {
      result.current.setFilter('images');
    });

    const textEntry = makeEntry({ id: 'txt-1', mimeType: 'text/markdown' });
    await act(async () => {
      result.current.add(textEntry);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.visibleFiles).toHaveLength(0);

    await act(async () => {
      result.current.setFilter('text');
    });
    expect(result.current.visibleFiles).toHaveLength(1);
  });

  it('remove(id) removes only that id; persists; no FS delete', async () => {
    const e1 = makeEntry({ id: 'a' });
    const e2 = makeEntry({ id: 'b' });
    mockLoad.mockResolvedValue({ files: [e1, e2], filter: 'all' });

    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(result.current.files).toHaveLength(2));

    await act(async () => {
      result.current.remove('a');
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('b');
    expect(mockSave).toHaveBeenCalled();
  });

  it('clear() empties files and persists; filter retained', async () => {
    const e1 = makeEntry({ id: 'a' });
    mockLoad.mockResolvedValue({ files: [e1], filter: 'pdf' });

    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(result.current.files).toHaveLength(1));

    await act(async () => {
      result.current.clear();
    });

    expect(result.current.files).toHaveLength(0);
    expect(result.current.filter).toBe('pdf');
    const lastCall = mockSave.mock.calls[mockSave.mock.calls.length - 1][0];
    expect(lastCall).toEqual({ files: [], filter: 'pdf' });
  });

  it('setFilter updates filter, persists, and recomputes visibleFiles', async () => {
    const img = makeEntry({ id: 'i', mimeType: 'image/png' });
    const txt = makeEntry({ id: 't', mimeType: 'text/plain' });
    mockLoad.mockResolvedValue({ files: [img, txt], filter: 'all' });

    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(result.current.files).toHaveLength(2));

    expect(result.current.visibleFiles).toHaveLength(2);

    await act(async () => {
      result.current.setFilter('images');
    });
    expect(result.current.visibleFiles).toHaveLength(1);
    expect(result.current.visibleFiles[0].id).toBe('i');
  });

  it('AsyncStorage load rejection -> empty list, no crash, error surfaced', async () => {
    mockLoad.mockImplementation(async (opts: { onError?: (e: unknown) => void } | undefined) => {
      opts?.onError?.({ kind: 'parse', cause: new Error('boom') });
      return { files: [], filter: 'all' };
    });

    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    expect(result.current.files).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('AsyncStorage save rejection -> mutation reverts; error surfaced', async () => {
    mockSave.mockRejectedValue(new Error('save failed'));
    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    await act(async () => {
      result.current.add(makeEntry({ id: 'x' }));
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
    expect(result.current.files).toHaveLength(0);
  });

  it('two synchronous add() calls produce two distinct entries in submission order', async () => {
    const { result } = renderHook(() => usePickedDocuments());
    await waitFor(() => expect(mockLoad).toHaveBeenCalled());

    const a = makeEntry({ id: 'first' });
    const b = makeEntry({ id: 'second' });

    await act(async () => {
      result.current.add(a);
      result.current.add(b);
    });

    expect(result.current.files).toHaveLength(2);
    expect(result.current.files.map((f) => f.id)).toEqual(['first', 'second']);
  });
});
