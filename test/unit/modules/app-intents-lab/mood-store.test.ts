/**
 * Tests for the mood-store contract.
 *
 * @see specs/013-app-intents/contracts/mood-store.md
 */

// Override the global AsyncStorage mock with a controllable in-memory backend.
jest.mock('@react-native-async-storage/async-storage', () => {
  let backing = new Map<string, string>();
  let throwGet = false;
  let throwSet = false;
  let throwRemove = false;
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => {
        if (throwGet) throw new Error('boom-get');
        return backing.get(k) ?? null;
      }),
      setItem: jest.fn(async (k: string, v: string) => {
        if (throwSet) throw new Error('boom-set');
        backing.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        if (throwRemove) throw new Error('boom-remove');
        backing.delete(k);
      }),
      clear: jest.fn(async () => {
        backing.clear();
      }),
    },
    __reset: () => {
      backing = new Map();
      throwGet = false;
      throwSet = false;
      throwRemove = false;
    },
    __setThrowGet: (b: boolean) => {
      throwGet = b;
    },
    __setThrowSet: (b: boolean) => {
      throwSet = b;
    },
    __setThrowRemove: (b: boolean) => {
      throwRemove = b;
    },
    __peek: (k: string) => backing.get(k) ?? null,
  };
});

import AsyncStorageRaw from '@react-native-async-storage/async-storage';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const asyncStorageModule = require('@react-native-async-storage/async-storage') as {
  __reset: () => void;
  __setThrowGet: (b: boolean) => void;
  __setThrowSet: (b: boolean) => void;
  __setThrowRemove: (b: boolean) => void;
  __peek: (k: string) => string | null;
};
import {
  DEFAULT_MOOD,
  MOOD_STORE_DEFAULT_LIST_CAP,
  MOOD_STORE_DISK_CAP,
  MOOD_STORE_KEY,
  MOODS,
  clear,
  list,
  push,
  type MoodRecord,
} from '@/modules/app-intents-lab/mood-store';

const mocked = asyncStorageModule;

beforeEach(() => {
  mocked.__reset();
});

describe('mood-store: constants', () => {
  it('MOOD_STORE_KEY is "spot.app-intents.moods"', () => {
    expect(MOOD_STORE_KEY).toBe('spot.app-intents.moods');
  });

  it('MOOD_STORE_DISK_CAP === 100', () => {
    expect(MOOD_STORE_DISK_CAP).toBe(100);
  });

  it('MOOD_STORE_DEFAULT_LIST_CAP === 100', () => {
    expect(MOOD_STORE_DEFAULT_LIST_CAP).toBe(100);
  });

  it('MOODS deep-equals ["happy","neutral","sad"]', () => {
    expect([...MOODS]).toEqual(['happy', 'neutral', 'sad']);
  });

  it('DEFAULT_MOOD === "neutral"', () => {
    expect(DEFAULT_MOOD).toBe('neutral');
  });
});

describe('mood-store: push', () => {
  it('round-trips a single record via list({ limit: 1 })', async () => {
    const r: MoodRecord = { mood: 'sad', timestamp: 1 };
    await push(r);
    const got = await list({ limit: 1 });
    expect(got).toEqual([r]);
  });

  it('N successive pushes (N <= 100) → list().length === N newest-first', async () => {
    for (let i = 0; i < 5; i++) {
      await push({ mood: 'neutral', timestamp: i });
    }
    const got = await list();
    expect(got).toHaveLength(5);
    expect(got[0].timestamp).toBe(4);
    expect(got[4].timestamp).toBe(0);
  });

  it('101 pushes → list().length === 100, oldest absent, newest at index 0', async () => {
    for (let i = 0; i < 101; i++) {
      await push({ mood: 'happy', timestamp: i });
    }
    const got = await list();
    expect(got).toHaveLength(100);
    expect(got[0].timestamp).toBe(100);
    expect(got[got.length - 1].timestamp).toBe(1);
    expect(got.find((r) => r.timestamp === 0)).toBeUndefined();
  });

  it('back-to-back pushes serialise to expected newest-first order', async () => {
    const a: MoodRecord = { mood: 'happy', timestamp: 1 };
    const b: MoodRecord = { mood: 'sad', timestamp: 2 };
    await push(a);
    await push(b);
    const got = await list();
    expect(got).toEqual([b, a]);
  });

  it('rejects when AsyncStorage.setItem rejects (FR-016)', async () => {
    mocked.__setThrowSet(true);
    await expect(push({ mood: 'happy', timestamp: 1 })).rejects.toThrow('boom-set');
  });
});

describe('mood-store: list', () => {
  it('empty store → []', async () => {
    const got = await list();
    expect(got).toEqual([]);
  });

  it('limit: 0 → []', async () => {
    await push({ mood: 'happy', timestamp: 1 });
    const got = await list({ limit: 0 });
    expect(got).toEqual([]);
  });

  it('limit: K < length returns K most recent', async () => {
    for (let i = 0; i < 5; i++) {
      await push({ mood: 'neutral', timestamp: i });
    }
    const got = await list({ limit: 2 });
    expect(got).toHaveLength(2);
    expect(got.map((r) => r.timestamp)).toEqual([4, 3]);
  });

  it('default limit applies cap of 100', async () => {
    for (let i = 0; i < 100; i++) {
      await push({ mood: 'happy', timestamp: i });
    }
    const got = await list();
    expect(got).toHaveLength(100);
  });

  it('AsyncStorage.getItem rejection resolves to [] (FR-016)', async () => {
    await push({ mood: 'happy', timestamp: 1 });
    mocked.__setThrowGet(true);
    const got = await list();
    expect(got).toEqual([]);
  });

  it('unparseable JSON resolves to [] (defence in depth)', async () => {
    // Use the mocked default's setItem to plant garbage directly.
    await AsyncStorageRaw.setItem(MOOD_STORE_KEY, 'not-json{[');
    const got = await list();
    expect(got).toEqual([]);
  });

  it('non-array JSON resolves to []', async () => {
    await AsyncStorageRaw.setItem(MOOD_STORE_KEY, '{"foo":"bar"}');
    const got = await list();
    expect(got).toEqual([]);
  });
});

describe('mood-store: clear', () => {
  it('post-clear, list() returns []', async () => {
    await push({ mood: 'happy', timestamp: 1 });
    await clear();
    const got = await list();
    expect(got).toEqual([]);
  });

  it('no-op on empty store', async () => {
    await expect(clear()).resolves.toBeUndefined();
  });

  it('rejects when AsyncStorage.removeItem rejects', async () => {
    mocked.__setThrowRemove(true);
    await expect(clear()).rejects.toThrow('boom-remove');
  });
});

describe('mood-store: round-trip', () => {
  it('on-disk JSON parses to expected MoodRecord[] shape', async () => {
    const r: MoodRecord = { mood: 'sad', timestamp: 12345 };
    await push(r);
    const raw = mocked.__peek(MOOD_STORE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as MoodRecord[];
    expect(parsed).toEqual([r]);
  });

  it('preserves timestamp precision', async () => {
    const ts = 1745800030123;
    await push({ mood: 'neutral', timestamp: ts });
    const got = await list({ limit: 1 });
    expect(got[0].timestamp).toBe(ts);
  });
});
