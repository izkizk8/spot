/**
 * Tests for useSpotlightIndex hook — feature 031 / T018.
 *
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { SearchableItem } from '@/native/spotlight.types';
import { DOMAIN_IDENTIFIER } from '@/native/spotlight.types';

// Mock the bridge module with proper function exports
const mockIsAvailable = jest.fn(() => true);
const mockIndex = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockDeleteAll = jest.fn().mockResolvedValue(undefined);
const mockSearch = jest.fn().mockResolvedValue([]);
const mockMarkCurrentActivity = jest.fn().mockResolvedValue(undefined);
const mockClearCurrentActivity = jest.fn().mockResolvedValue(undefined);

class MockSpotlightNotSupported extends Error {
  override name = 'SpotlightNotSupported';
  constructor(msg?: string) {
    super(msg ?? 'SpotlightNotSupported');
  }
}

jest.mock('@/native/spotlight', () => ({
  __esModule: true,
  isAvailable: () => mockIsAvailable(),
  index: (items: unknown) => mockIndex(items),
  delete: (ids: unknown) => mockDelete(ids),
  deleteAll: () => mockDeleteAll(),
  search: (query: string, limit: number) => mockSearch(query, limit),
  markCurrentActivity: (desc: unknown) => mockMarkCurrentActivity(desc),
  clearCurrentActivity: () => mockClearCurrentActivity(),
  SpotlightNotSupported: MockSpotlightNotSupported,
}));

// Mock the MODULES registry with array inline to avoid hoisting issue
jest.mock('@/modules/registry', () => ({
  __esModule: true,
  MODULES: [
    {
      id: 'haptics-playground',
      title: 'Haptics Playground',
      description: 'Explore haptic feedback',
      keywords: ['haptic', 'vibration'],
    },
    {
      id: 'sensors-lab',
      title: 'Sensors Lab',
      description: 'Sensor data',
      keywords: ['sensors'],
    },
    {
      id: 'audio-lab',
      title: 'Audio Lab',
      description: 'Audio recording',
      keywords: ['audio'],
    },
  ],
}));

import { useSpotlightIndex } from '@/modules/spotlight-lab/hooks/useSpotlightIndex';

function createItem(moduleId: string, title: string, desc: string): SearchableItem {
  return {
    id: `${DOMAIN_IDENTIFIER}.${moduleId}`,
    title,
    contentDescription: desc,
    keywords: [],
    domainIdentifier: DOMAIN_IDENTIFIER,
  };
}

describe('useSpotlightIndex: initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
  });

  it('on mount, items is initialised from mapRegistryToItems(MODULES); indexedIds is empty Set (FR-102)', () => {
    const { result } = renderHook(() => useSpotlightIndex());

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].id).toBe(`${DOMAIN_IDENTIFIER}.haptics-playground`);
    expect(result.current.indexedIds.size).toBe(0);
  });

  it('isAvailable reflects bridge.isAvailable()', () => {
    const { result } = renderHook(() => useSpotlightIndex());
    expect(result.current.isAvailable).toBe(true);

    mockIsAvailable.mockReturnValue(false);
    const { result: result2 } = renderHook(() => useSpotlightIndex());
    expect(result2.current.isAvailable).toBe(false);
  });
});

describe('useSpotlightIndex: toggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockIndex.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  it('toggleItem from not-indexed → indexed calls bridge.index([item]) exactly once and adds to indexedIds (FR-031)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    const itemId = `${DOMAIN_IDENTIFIER}.haptics-playground`;
    await act(async () => {
      await result.current.toggleItem(itemId);
    });

    expect(mockIndex).toHaveBeenCalledTimes(1);
    expect(mockIndex.mock.calls[0][0]).toHaveLength(1);
    expect(mockIndex.mock.calls[0][0][0].id).toBe(itemId);
    expect(result.current.indexedIds.has(itemId)).toBe(true);
  });

  it('toggleItem from indexed → not-indexed calls bridge.delete([id]) exactly once and removes from indexedIds', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    const itemId = `${DOMAIN_IDENTIFIER}.haptics-playground`;

    // First, index the item
    await act(async () => {
      await result.current.toggleItem(itemId);
    });
    expect(result.current.indexedIds.has(itemId)).toBe(true);

    // Now toggle off
    await act(async () => {
      await result.current.toggleItem(itemId);
    });

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith([itemId]);
    expect(result.current.indexedIds.has(itemId)).toBe(false);
  });

  it('per-row toggle rejection: reverts state and surfaces error on error channel (FR-033/FR-104)', async () => {
    mockIndex.mockRejectedValueOnce(new Error('Index failed'));
    const { result } = renderHook(() => useSpotlightIndex());

    const itemId = `${DOMAIN_IDENTIFIER}.haptics-playground`;
    await act(async () => {
      await result.current.toggleItem(itemId);
    });

    expect(result.current.indexedIds.has(itemId)).toBe(false); // reverted
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Index failed');
  });
});

describe('useSpotlightIndex: bulk operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockIndex.mockResolvedValue(undefined);
    mockDeleteAll.mockResolvedValue(undefined);
  });

  it('indexAll() calls bridge.index(items) with full mapped item set, exactly once; indexedIds contains every id (FR-041)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.indexAll();
    });

    expect(mockIndex).toHaveBeenCalledTimes(1);
    expect(mockIndex.mock.calls[0][0]).toHaveLength(3);
    expect(result.current.indexedIds.size).toBe(3);
  });

  it('removeAll() calls bridge.deleteAll() exactly once; indexedIds is empty (FR-042)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    // First index all
    await act(async () => {
      await result.current.indexAll();
    });
    expect(result.current.indexedIds.size).toBe(3);

    // Now remove all
    await act(async () => {
      await result.current.removeAll();
    });

    expect(mockDeleteAll).toHaveBeenCalledTimes(1);
    expect(result.current.indexedIds.size).toBe(0);
  });

  it('while bulk action is in flight, isBusy === true (FR-032/FR-043)', async () => {
    // Use a deferred pattern that captures resolve in the mock
    const deferred: { resolve: () => void } = { resolve: () => {} };
    mockIndex.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    const { result } = renderHook(() => useSpotlightIndex());

    let indexPromise: Promise<void>;
    act(() => {
      indexPromise = result.current.indexAll();
    });

    // Should be busy while in flight
    expect(result.current.isBusy).toBe(true);

    // Resolve and wait
    await act(async () => {
      deferred.resolve();
      await indexPromise;
    });

    expect(result.current.isBusy).toBe(false);
  });
});

describe('useSpotlightIndex: search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockSearch.mockResolvedValue([]);
  });

  it('search(term) calls bridge.search(term, 25) with default limit; resolves into results (FR-052)', async () => {
    const mockResults = [createItem('haptics-playground', 'Haptics', 'desc')];
    mockSearch.mockResolvedValueOnce(mockResults);

    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.search('haptics');
    });

    expect(mockSearch).toHaveBeenCalledWith('haptics', 25);
    expect(result.current.results).toEqual(mockResults);
  });

  it('search("") does NOT call the bridge (FR-051/EC-005)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.search('');
    });

    expect(mockSearch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it('search whitespace-only does NOT call the bridge', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.search('   ');
    });

    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('bridge.search rejection: results cleared to [], error surfaced (FR-054)', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Search failed'));
    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.search('term');
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.error?.message).toBe('Search failed');
  });
});

describe('useSpotlightIndex: user activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockMarkCurrentActivity.mockResolvedValue(undefined);
    mockClearCurrentActivity.mockResolvedValue(undefined);
  });

  it('markActivity calls bridge.markCurrentActivity with descriptor; activityActive flips to "active" (FR-061/FR-063)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    await act(async () => {
      await result.current.markActivity({ title: 'Spotlight Demo', keywords: ['spotlight'] });
    });

    expect(mockMarkCurrentActivity).toHaveBeenCalledTimes(1);
    expect(mockMarkCurrentActivity.mock.calls[0][0]).toMatchObject({
      title: 'Spotlight Demo',
      keywords: ['spotlight'],
      userInfo: { source: 'spotlight-lab' },
    });
    expect(result.current.activityActive).toBe('active');
  });

  it('clearActivity calls bridge.clearCurrentActivity; activityActive flips to "inactive" (FR-063)', async () => {
    const { result } = renderHook(() => useSpotlightIndex());

    // First mark active
    await act(async () => {
      await result.current.markActivity({ title: 'Test', keywords: [] });
    });
    expect(result.current.activityActive).toBe('active');

    // Now clear
    await act(async () => {
      await result.current.clearActivity();
    });

    expect(mockClearCurrentActivity).toHaveBeenCalledTimes(1);
    expect(result.current.activityActive).toBe('inactive');
  });
});

describe('useSpotlightIndex: degraded state', () => {
  it('when bridge.isAvailable() returns false, isAvailable === false; mutating calls are no-ops (EC-002)', async () => {
    mockIsAvailable.mockReturnValue(false);
    const { result } = renderHook(() => useSpotlightIndex());

    expect(result.current.isAvailable).toBe(false);

    // Mutating calls should be no-ops, no error
    await act(async () => {
      await result.current.toggleItem(`${DOMAIN_IDENTIFIER}.haptics-playground`);
    });

    expect(mockIndex).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

describe('useSpotlightIndex: unmount cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockMarkCurrentActivity.mockResolvedValue(undefined);
    mockClearCurrentActivity.mockResolvedValue(undefined);
  });

  it('unmount with activityActive === "active" invokes bridge.clearCurrentActivity exactly once (FR-064/FR-106/SC-009)', async () => {
    const { result, unmount } = renderHook(() => useSpotlightIndex());

    // Mark active
    await act(async () => {
      await result.current.markActivity({ title: 'Test', keywords: [] });
    });
    expect(result.current.activityActive).toBe('active');
    expect(mockClearCurrentActivity).toHaveBeenCalledTimes(0);

    // Unmount
    unmount();

    // Should have called clearCurrentActivity on cleanup
    await waitFor(() => {
      expect(mockClearCurrentActivity).toHaveBeenCalledTimes(1);
    });
  });

  it('unmount with activityActive === "inactive" does NOT call bridge.clearCurrentActivity', async () => {
    const { result, unmount } = renderHook(() => useSpotlightIndex());

    expect(result.current.activityActive).toBe('inactive');

    unmount();

    // Should not have called clearCurrentActivity
    expect(mockClearCurrentActivity).not.toHaveBeenCalled();
  });
});

describe('useSpotlightIndex: rapid toggle serialisation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
    mockIndex.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  it('two rapid toggleItem calls produce ordered native invocations (FR-103/R-A)', async () => {
    const calls: string[] = [];
    mockIndex.mockImplementation((items: SearchableItem[]) => {
      calls.push(`index:${items[0].id}`);
      return Promise.resolve();
    });

    const { result } = renderHook(() => useSpotlightIndex());

    const id1 = `${DOMAIN_IDENTIFIER}.haptics-playground`;
    const id2 = `${DOMAIN_IDENTIFIER}.sensors-lab`;

    await act(async () => {
      const p1 = result.current.toggleItem(id1);
      const p2 = result.current.toggleItem(id2);
      await Promise.all([p1, p2]);
    });

    expect(calls).toEqual([`index:${id1}`, `index:${id2}`]);
  });
});
