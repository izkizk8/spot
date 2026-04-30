/**
 * Unit tests: useUniversalLinks hook (feature 041).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

let __urlCallback: ((event: unknown) => void) | null = null;

const mockRemove = jest.fn();
const mockAddEventListener = jest.fn((_event: string, cb: (e: unknown) => void) => {
  __urlCallback = cb;
  return { remove: mockRemove };
});
const mockGetInitialURL = jest.fn().mockResolvedValue(null);
const mockOpenURL = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-linking', () => ({
  addEventListener: (event: string, cb: (e: unknown) => void) => mockAddEventListener(event, cb),
  getInitialURL: () => mockGetInitialURL(),
  openURL: (url: string) => mockOpenURL(url),
}));

import { useUniversalLinks } from '@/modules/universal-links-lab/hooks/useUniversalLinks';

interface HarnessHandle {
  hook: ReturnType<typeof useUniversalLinks> | null;
}

const harness: HarnessHandle = { hook: null };

function Harness() {
  const hook = useUniversalLinks();
  React.useEffect(() => {
    harness.hook = hook;
  });
  return null;
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useUniversalLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __urlCallback = null;
    harness.hook = null;
    mockGetInitialURL.mockResolvedValue(null);
  });

  it('subscribes to "url" events on mount', () => {
    render(<Harness />);
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener.mock.calls[0][0]).toBe('url');
  });

  it('initial state: log empty', () => {
    render(<Harness />);
    expect(harness.hook?.log).toEqual([]);
  });

  it('appends a parsed event when a string URL is delivered', () => {
    render(<Harness />);
    act(() => {
      __urlCallback?.({ url: 'https://spot.example.com/lab/x' });
    });
    expect(harness.hook?.log).toHaveLength(1);
    expect(harness.hook?.log[0].url).toBe('https://spot.example.com/lab/x');
    expect(harness.hook?.log[0].host).toBe('spot.example.com');
    expect(harness.hook?.log[0].path).toBe('/lab/x');
    expect(typeof harness.hook?.log[0].receivedAt).toBe('string');
  });

  it('also accepts a bare string URL (some platforms emit that shape)', () => {
    render(<Harness />);
    act(() => {
      __urlCallback?.('https://spot.example.com/y');
    });
    expect(harness.hook?.log).toHaveLength(1);
    expect(harness.hook?.log[0].url).toBe('https://spot.example.com/y');
  });

  it('truncates log to 10 entries (FIFO, most-recent first)', () => {
    render(<Harness />);
    act(() => {
      for (let i = 0; i < 12; i += 1) {
        __urlCallback?.({ url: `https://spot.example.com/p${i}` });
      }
    });
    expect(harness.hook?.log).toHaveLength(10);
    expect(harness.hook?.log[0].path).toBe('/p11');
    expect(harness.hook?.log[9].path).toBe('/p2');
  });

  it('discards events with missing or empty URL (FR error handling)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Harness />);
    act(() => {
      __urlCallback?.({});
      __urlCallback?.({ url: '' });
      __urlCallback?.({ url: 42 });
      __urlCallback?.(null);
    });
    expect(harness.hook?.log).toHaveLength(0);
    warn.mockRestore();
  });

  it('handles non-URL strings without throwing (host="" path=raw)', () => {
    render(<Harness />);
    act(() => {
      __urlCallback?.({ url: 'not-a-url' });
    });
    expect(harness.hook?.log).toHaveLength(1);
    expect(harness.hook?.log[0].host).toBe('');
    expect(harness.hook?.log[0].path).toBe('not-a-url');
  });

  it('captures initial URL on mount when present', async () => {
    mockGetInitialURL.mockResolvedValueOnce('https://spot.example.com/initial');
    render(<Harness />);
    await flushMicrotasks();
    expect(harness.hook?.log).toHaveLength(1);
    expect(harness.hook?.log[0].url).toBe('https://spot.example.com/initial');
  });

  it('ignores initial URL rejection silently', async () => {
    mockGetInitialURL.mockRejectedValueOnce(new Error('boom'));
    render(<Harness />);
    await flushMicrotasks();
    expect(harness.hook?.log).toHaveLength(0);
  });

  it('clear() empties the log', () => {
    render(<Harness />);
    act(() => {
      __urlCallback?.({ url: 'https://spot.example.com/x' });
    });
    expect(harness.hook?.log).toHaveLength(1);
    act(() => {
      harness.hook!.clear();
    });
    expect(harness.hook?.log).toHaveLength(0);
  });

  it('dispatch() forwards to Linking.openURL', async () => {
    render(<Harness />);
    await act(async () => {
      await harness.hook!.dispatch('https://spot.example.com/dispatch');
    });
    expect(mockOpenURL).toHaveBeenCalledWith('https://spot.example.com/dispatch');
  });

  it('unmount cleanup invokes subscription.remove()', () => {
    const { unmount } = render(<Harness />);
    expect(mockRemove).not.toHaveBeenCalled();
    unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('events delivered after unmount do not throw or update state', () => {
    const { unmount } = render(<Harness />);
    unmount();
    expect(() => {
      __urlCallback?.({ url: 'https://spot.example.com/late' });
    }).not.toThrow();
  });
});
