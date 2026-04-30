/**
 * Unit tests: useHandoffActivity hook (T023).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

let __continuationCallback: ((event: unknown) => void) | null = null;

const mockSetCurrent = jest.fn().mockResolvedValue(undefined);
const mockResignCurrent = jest.fn().mockResolvedValue(undefined);
const mockGetCurrent = jest.fn().mockResolvedValue(null);
const mockUnsubscribe = jest.fn();
const mockAddListener = jest.fn((cb: (event: unknown) => void) => {
  __continuationCallback = cb;
  return mockUnsubscribe;
});

jest.mock('@/native/handoff', () => ({
  isAvailable: true,
  setCurrent: (...args: unknown[]) => mockSetCurrent(...args),
  resignCurrent: () => mockResignCurrent(),
  getCurrent: () => mockGetCurrent(),
  addContinuationListener: (cb: (event: unknown) => void) => mockAddListener(cb),
}));

import { useHandoffActivity } from '@/modules/handoff-lab/hooks/useHandoffActivity';
import type { ActivityDefinition } from '@/modules/handoff-lab/types';

interface HarnessHandle {
  hook: ReturnType<typeof useHandoffActivity> | null;
}

const harnessHandle: HarnessHandle = { hook: null };

function Harness() {
  const hook = useHandoffActivity();
  React.useEffect(() => {
    harnessHandle.hook = hook;
  });
  return null;
}

function makeDef(overrides: Partial<ActivityDefinition> = {}): ActivityDefinition {
  return {
    activityType: 'com.example.test',
    title: 'Test Activity',
    userInfo: { foo: 'bar' },
    requiredUserInfoKeys: [],
    isEligibleForHandoff: true,
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
    ...overrides,
  };
}

describe('useHandoffActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __continuationCallback = null;
    harnessHandle.hook = null;
  });

  it('initial state: currentActivity null, log empty, isAvailable true', () => {
    render(<Harness />);
    expect(harnessHandle.hook?.currentActivity).toBeNull();
    expect(harnessHandle.hook?.log).toEqual([]);
    expect(harnessHandle.hook?.isAvailable).toBe(true);
  });

  it('setCurrent forwards to bridge and mirrors currentActivity on resolve', async () => {
    render(<Harness />);
    const def = makeDef();
    await act(async () => {
      await harnessHandle.hook!.setCurrent(def);
    });
    expect(mockSetCurrent).toHaveBeenCalledWith(def);
    expect(harnessHandle.hook?.currentActivity).toEqual(def);
  });

  it('resignCurrent forwards to bridge and clears currentActivity', async () => {
    render(<Harness />);
    await act(async () => {
      await harnessHandle.hook!.setCurrent(makeDef());
    });
    await act(async () => {
      await harnessHandle.hook!.resignCurrent();
    });
    expect(mockResignCurrent).toHaveBeenCalled();
    expect(harnessHandle.hook?.currentActivity).toBeNull();
  });

  it('getCurrent forwards to bridge and does not mutate currentActivity', async () => {
    render(<Harness />);
    mockGetCurrent.mockResolvedValueOnce(makeDef({ title: 'fromBridge' }));
    let result: ActivityDefinition | null | undefined;
    await act(async () => {
      result = (await harnessHandle.hook!.getCurrent()) as ActivityDefinition | null;
    });
    expect(mockGetCurrent).toHaveBeenCalled();
    expect(result?.title).toBe('fromBridge');
    expect(harnessHandle.hook?.currentActivity).toBeNull();
  });

  it('subscribes on mount and prepends valid continuation events', () => {
    render(<Harness />);
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    act(() => {
      __continuationCallback?.({
        activityType: 'com.example.test',
        title: 'Hello',
        userInfo: { a: 1 },
        requiredUserInfoKeys: ['a'],
      });
    });
    expect(harnessHandle.hook?.log.length).toBe(1);
    expect(harnessHandle.hook?.log[0].activityType).toBe('com.example.test');
    expect(harnessHandle.hook?.log[0].title).toBe('Hello');
    expect(typeof harnessHandle.hook?.log[0].receivedAt).toBe('string');
    expect(() => new Date(harnessHandle.hook!.log[0].receivedAt).toISOString()).not.toThrow();
  });

  it('truncates log to 10 entries (FR-014), most-recent first', () => {
    render(<Harness />);
    act(() => {
      for (let i = 0; i < 12; i += 1) {
        __continuationCallback?.({
          activityType: `com.example.t${i}`,
          title: `Title ${i}`,
          userInfo: {},
          requiredUserInfoKeys: [],
        });
      }
    });
    expect(harnessHandle.hook?.log.length).toBe(10);
    expect(harnessHandle.hook?.log[0].activityType).toBe('com.example.t11');
    expect(harnessHandle.hook?.log[9].activityType).toBe('com.example.t2');
  });

  it('discards events with missing or non-string activityType (FR-015)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Harness />);
    act(() => {
      __continuationCallback?.({ activityType: 123, title: 'no' });
      __continuationCallback?.({ title: 'missing' });
      __continuationCallback?.({ activityType: '', title: 'empty' });
    });
    expect(harnessHandle.hook?.log.length).toBe(0);
    warn.mockRestore();
  });

  it('normalises null userInfo to {} and non-array requiredUserInfoKeys to []', () => {
    render(<Harness />);
    act(() => {
      __continuationCallback?.({
        activityType: 'com.example.x',
        title: 'X',
        userInfo: null,
        requiredUserInfoKeys: 'not-an-array',
      });
    });
    expect(harnessHandle.hook?.log[0].userInfo).toEqual({});
    expect(harnessHandle.hook?.log[0].requiredUserInfoKeys).toEqual([]);
  });

  it('sorts and dedupes requiredUserInfoKeys, dropping non-strings', () => {
    render(<Harness />);
    act(() => {
      __continuationCallback?.({
        activityType: 'com.example.y',
        title: 'Y',
        userInfo: {},
        requiredUserInfoKeys: ['b', 'a', 'a', 42, null, 'c'],
      });
    });
    expect(harnessHandle.hook?.log[0].requiredUserInfoKeys).toEqual(['a', 'b', 'c']);
  });

  it('setCurrent rejection leaves currentActivity unchanged', async () => {
    render(<Harness />);
    mockSetCurrent.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await expect(harnessHandle.hook!.setCurrent(makeDef())).rejects.toThrow('boom');
    });
    expect(harnessHandle.hook?.currentActivity).toBeNull();
  });

  it('resignCurrent rejection leaves currentActivity unchanged', async () => {
    render(<Harness />);
    await act(async () => {
      await harnessHandle.hook!.setCurrent(makeDef());
    });
    mockResignCurrent.mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await expect(harnessHandle.hook!.resignCurrent()).rejects.toThrow('nope');
    });
    expect(harnessHandle.hook?.currentActivity).not.toBeNull();
  });

  it('unmount cleanup invokes the unsubscribe function', () => {
    const { unmount } = render(<Harness />);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
