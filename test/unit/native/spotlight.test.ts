/**
 * Tests for the iOS Spotlight JS bridge — feature 031 / T015.
 *
 * Uses jest.isolateModules + jest.doMock so each test pins its own
 * Platform / native-module return.
 */

interface PlatformShape {
  OS: 'ios' | 'android' | 'web';
  Version: string | number;
  select: (specifics: Record<string, unknown>) => unknown;
}

type NativeMock = {
  index: jest.Mock;
  delete: jest.Mock;
  deleteAll: jest.Mock;
  search: jest.Mock;
  markCurrentActivity: jest.Mock;
  clearCurrentActivity: jest.Mock;
};

type BridgeModule = typeof import('@/native/spotlight');

let requireOptionalNativeModuleArg: string | undefined;

function loadBridge(opts: {
  os: 'ios' | 'android' | 'web';
  version?: string | number;
  native?: NativeMock | null;
}): BridgeModule {
  requireOptionalNativeModuleArg = undefined;
  const platform: PlatformShape = {
    OS: opts.os,
    Version: opts.version ?? '17.0',
    select: (s) => s[opts.os] ?? s.default ?? undefined,
  };
  const native = opts.native ?? null;

  let mod: BridgeModule | undefined;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      __esModule: true,
      Platform: platform,
    }));
    jest.doMock('expo-modules-core', () => ({
      __esModule: true,
      requireOptionalNativeModule: (name: string) => {
        requireOptionalNativeModuleArg = name;
        return native;
      },
    }));
    mod = require('@/native/spotlight') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load bridge module');
  return mod;
}

function freshNativeMock(): NativeMock {
  return {
    index: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteAll: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
    markCurrentActivity: jest.fn().mockResolvedValue(undefined),
    clearCurrentActivity: jest.fn().mockResolvedValue(undefined),
  };
}

describe('spotlight bridge: iOS happy path', () => {
  it('isAvailable() === true with native present and Platform.OS === "ios"', () => {
    const b = loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(b.isAvailable()).toBe(true);
  });

  it('index([item1, item2]) calls the mocked native index with the two items verbatim (FR-090)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    const items = [
      {
        id: 'item1',
        title: 'Item 1',
        contentDescription: 'Desc 1',
        keywords: ['a'],
        domainIdentifier: 'com.izkizk8.spot.modules' as const,
      },
      {
        id: 'item2',
        title: 'Item 2',
        contentDescription: 'Desc 2',
        keywords: ['b'],
        domainIdentifier: 'com.izkizk8.spot.modules' as const,
      },
    ];
    await b.index(items);
    expect(native.index).toHaveBeenCalledTimes(1);
    expect(native.index).toHaveBeenCalledWith(items);
  });

  it('delete([id1, id2]) forwards both ids to the mocked native delete (FR-090)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.delete(['id1', 'id2']);
    expect(native.delete).toHaveBeenCalledTimes(1);
    expect(native.delete).toHaveBeenCalledWith(['id1', 'id2']);
  });

  it('deleteAll() delegates to the mocked native deleteAll', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.deleteAll();
    expect(native.deleteAll).toHaveBeenCalledTimes(1);
  });

  it('search(term, 25) resolves with whatever the mocked native returns (FR-090)', async () => {
    const native = freshNativeMock();
    const mockResults = [
      {
        id: 'result1',
        title: 'Result',
        contentDescription: 'Desc',
        keywords: [],
        domainIdentifier: 'com.izkizk8.spot.modules' as const,
      },
    ];
    native.search.mockResolvedValueOnce(mockResults);
    const b = loadBridge({ os: 'ios', native });
    const result = await b.search('term', 25);
    expect(result).toEqual(mockResults);
    expect(native.search).toHaveBeenCalledWith('term', 25);
  });

  it('markCurrentActivity forwards the descriptor verbatim (FR-061)', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    const desc = {
      title: 'Test Activity',
      keywords: ['key1'],
      userInfo: { source: 'spotlight-lab' },
    };
    await b.markCurrentActivity(desc);
    expect(native.markCurrentActivity).toHaveBeenCalledTimes(1);
    expect(native.markCurrentActivity).toHaveBeenCalledWith(desc);
  });

  it('clearCurrentActivity delegates to the mocked native clearCurrentActivity', async () => {
    const native = freshNativeMock();
    const b = loadBridge({ os: 'ios', native });
    await b.clearCurrentActivity();
    expect(native.clearCurrentActivity).toHaveBeenCalledTimes(1);
  });

  it('requireOptionalNativeModule called with the literal "Spotlight" (B1)', () => {
    loadBridge({ os: 'ios', native: freshNativeMock() });
    expect(requireOptionalNativeModuleArg).toBe('Spotlight');
  });
});

describe('spotlight bridge: native module absent', () => {
  it('isAvailable() === false', () => {
    const b = loadBridge({ os: 'ios', native: null });
    expect(b.isAvailable()).toBe(false);
  });

  it('every mutating method rejects with SpotlightNotSupported (FR-091/FR-092/EC-002)', async () => {
    const b = loadBridge({ os: 'ios', native: null });
    await expect(b.index([])).rejects.toBeInstanceOf(b.SpotlightNotSupported);
    await expect(b.delete(['id'])).rejects.toBeInstanceOf(b.SpotlightNotSupported);
    await expect(b.deleteAll()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
    await expect(b.search('q', 25)).rejects.toBeInstanceOf(b.SpotlightNotSupported);
    await expect(b.markCurrentActivity({ title: 't', keywords: [] })).rejects.toBeInstanceOf(
      b.SpotlightNotSupported,
    );
    await expect(b.clearCurrentActivity()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });
});

describe('spotlight bridge: iOS < 9', () => {
  it('isAvailable() === false even with native present', () => {
    const b = loadBridge({ os: 'ios', version: '8.4', native: freshNativeMock() });
    expect(b.isAvailable()).toBe(false);
  });

  it('mutating methods reject with SpotlightNotSupported', async () => {
    const b = loadBridge({ os: 'ios', version: '8.4', native: freshNativeMock() });
    await expect(b.deleteAll()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });
});

describe('spotlight bridge: serialised promise chain (R-A / FR-103)', () => {
  it('two back-to-back index calls produce two native invocations in order', async () => {
    const native = freshNativeMock();
    const order: number[] = [];
    let resolveFirstHolder: { current: () => void } = { current: () => undefined };
    native.index
      .mockImplementationOnce(
        () =>
          new Promise<void>((res) => {
            resolveFirstHolder.current = () => {
              order.push(1);
              res();
            };
          }),
      )
      .mockImplementationOnce(() => {
        order.push(2);
        return Promise.resolve();
      });

    const b = loadBridge({ os: 'ios', native });
    const item1 = {
      id: 'a',
      title: 'A',
      contentDescription: '',
      keywords: [],
      domainIdentifier: 'com.izkizk8.spot.modules' as const,
    };
    const item2 = {
      id: 'b',
      title: 'B',
      contentDescription: '',
      keywords: [],
      domainIdentifier: 'com.izkizk8.spot.modules' as const,
    };
    const p1 = b.index([item1]);
    const p2 = b.index([item2]);

    // Flush microtasks so the first chained call begins
    await Promise.resolve();
    await Promise.resolve();
    expect(native.index).toHaveBeenCalledTimes(1);
    resolveFirstHolder.current();
    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
    expect(native.index).toHaveBeenCalledTimes(2);
  });

  it('first-call rejection does not poison the chain', async () => {
    const native = freshNativeMock();
    native.index.mockRejectedValueOnce(new Error('first failed')).mockResolvedValueOnce(undefined);

    const b = loadBridge({ os: 'ios', native });
    const item = {
      id: 'x',
      title: 'X',
      contentDescription: '',
      keywords: [],
      domainIdentifier: 'com.izkizk8.spot.modules' as const,
    };
    const p1 = b.index([item]);
    const p2 = b.index([item]);

    await expect(p1).rejects.toThrow('first failed');
    await expect(p2).resolves.toBeUndefined();
    expect(native.index).toHaveBeenCalledTimes(2);
  });

  it('search is NOT serialised through the mutation chain', async () => {
    const native = freshNativeMock();
    let resolveIndexHolder: { current: () => void } = { current: () => undefined };
    native.index.mockImplementationOnce(
      () =>
        new Promise<void>((res) => {
          resolveIndexHolder.current = res;
        }),
    );
    native.search.mockResolvedValueOnce([]);

    const b = loadBridge({ os: 'ios', native });
    const item = {
      id: 'x',
      title: 'X',
      contentDescription: '',
      keywords: [],
      domainIdentifier: 'com.izkizk8.spot.modules' as const,
    };

    // Start a long-running index
    const indexPromise = b.index([item]);
    await Promise.resolve();
    expect(native.index).toHaveBeenCalledTimes(1);

    // Search should resolve immediately (not blocked by index)
    const searchPromise = b.search('q', 25);
    const searchResult = await searchPromise;
    expect(searchResult).toEqual([]);
    expect(native.search).toHaveBeenCalledTimes(1);

    // Now resolve index
    resolveIndexHolder.current();
    await indexPromise;
  });
});

describe('spotlight bridge: error class identity', () => {
  it('SpotlightNotSupported thrown from non-iOS path is instanceof SpotlightNotSupported (FR-092)', async () => {
    const b = loadBridge({ os: 'web', native: null });
    let caught: unknown;
    try {
      await b.index([]);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(b.SpotlightNotSupported);
    expect(caught).toBeInstanceOf(Error);
  });
});

describe('spotlight bridge: typed surface', () => {
  it('bridge methods have the expected signatures', () => {
    const b = loadBridge({ os: 'ios', native: freshNativeMock() });
    // Type-level assertions via function calls
    expect(typeof b.isAvailable).toBe('function');
    expect(typeof b.index).toBe('function');
    expect(typeof b.delete).toBe('function');
    expect(typeof b.deleteAll).toBe('function');
    expect(typeof b.search).toBe('function');
    expect(typeof b.markCurrentActivity).toBe('function');
    expect(typeof b.clearCurrentActivity).toBe('function');
  });
});
