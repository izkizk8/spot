/**
 * useGroupActivity hook tests.
 * Feature: 047-shareplay
 *
 * The native SharePlay bridge is mocked at the import boundary
 * via `__setSharePlayBridgeForTests`. The hook never touches a
 * real native module. Tests cover: initial state, capability
 * snapshot, activity-type / title editing, full start → end
 * lifecycle, error path, sendCounter, subscribe wiring, reset,
 * unmount safety.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import {
  __setSharePlayBridgeForTests,
  useGroupActivity,
  type UseGroupActivityReturn,
} from '@/modules/shareplay-lab/hooks/useGroupActivity';
import {
  type SessionState,
  type SessionStateListener,
  type SharePlayBridge,
} from '@/native/shareplay.types';

interface MockBridge extends SharePlayBridge {
  isAvailable: jest.Mock;
  getState: jest.Mock;
  startActivity: jest.Mock;
  endActivity: jest.Mock;
  sendCounter: jest.Mock;
  subscribe: jest.Mock;
  __emit(state: SessionState): void;
}

function makeBridge(): MockBridge {
  let listener: SessionStateListener | null = null;
  const subscribe = jest.fn((cb: SessionStateListener) => {
    listener = cb;
    return () => {
      listener = null;
    };
  });
  const bridge: Partial<MockBridge> = {
    isAvailable: jest.fn(() => true),
    getState: jest.fn(() => ({
      status: 'none',
      activity: null,
      participants: [],
      counter: 0,
    })),
    startActivity: jest.fn(async () => undefined),
    endActivity: jest.fn(async () => undefined),
    sendCounter: jest.fn(async () => undefined),
    subscribe,
    __emit(state: SessionState) {
      listener?.(state);
    },
  };
  return bridge as MockBridge;
}

interface Handle {
  current: UseGroupActivityReturn | null;
}

const handle: Handle = { current: null };

function Harness() {
  const g = useGroupActivity();
  React.useEffect(() => {
    handle.current = g;
  });
  return null;
}

let bridge: MockBridge;

beforeEach(() => {
  bridge = makeBridge();
  __setSharePlayBridgeForTests(bridge);
  handle.current = null;
});

afterEach(() => {
  __setSharePlayBridgeForTests(null);
  jest.clearAllMocks();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useGroupActivity', () => {
  it('initial state mirrors the catalog defaults and capability snapshot', async () => {
    render(<Harness />);
    await flush();
    const g = handle.current!;
    expect(g.activityType).toBe('counter');
    expect(g.title).toBe('Showcase Counter');
    expect(g.state.status).toBe('none');
    expect(g.state.counter).toBe(0);
    expect(g.available).toBe(true);
    expect(g.loading).toBe(false);
    expect(g.lastError).toBeNull();
    expect(bridge.subscribe).toHaveBeenCalledTimes(1);
  });

  it('selectActivityType updates type and resets the title to the catalog default', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.selectActivityType('quiz');
    });
    await flush();
    expect(handle.current!.activityType).toBe('quiz');
    expect(handle.current!.title).toBe('Showcase Quiz');
  });

  it('setTitle updates the title verbatim', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.setTitle('Family Counter');
    });
    await flush();
    expect(handle.current!.title).toBe('Family Counter');
  });

  it('startActivity passes the composed config to the bridge', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      handle.current!.setTitle('Quizzy');
      handle.current!.selectActivityType('quiz');
    });
    await flush();
    await act(async () => {
      await handle.current!.startActivity();
    });
    expect(bridge.startActivity).toHaveBeenCalledWith({
      type: 'quiz',
      title: 'Showcase Quiz',
    });
  });

  it('startActivity records lastError when the bridge rejects', async () => {
    bridge.startActivity.mockRejectedValueOnce(new Error('FaceTime offline'));
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startActivity();
    });
    expect(handle.current!.lastError).toBe('FaceTime offline');
    expect(handle.current!.loading).toBe(false);
  });

  it('endActivity delegates to the native module', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.endActivity();
    });
    expect(bridge.endActivity).toHaveBeenCalledTimes(1);
  });

  it('sendCounter delegates to the native module and forwards the value', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.sendCounter(42);
    });
    expect(bridge.sendCounter).toHaveBeenCalledWith(42);
  });

  it('subscribe pushes native state into the React state', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      bridge.__emit({
        status: 'active',
        activity: { type: 'counter', title: 'X' },
        participants: [{ id: 'p1', displayName: 'Alice' }],
        counter: 5,
      });
    });
    await flush();
    expect(handle.current!.state.status).toBe('active');
    expect(handle.current!.state.counter).toBe(5);
    expect(handle.current!.state.participants).toHaveLength(1);
  });

  it('reset clears state and lastError', async () => {
    bridge.startActivity.mockRejectedValueOnce(new Error('boom'));
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startActivity();
    });
    expect(handle.current!.lastError).toBe('boom');
    act(() => {
      handle.current!.reset();
    });
    await flush();
    expect(handle.current!.lastError).toBeNull();
    expect(handle.current!.state.status).toBe('none');
  });

  it('survives bridge.isAvailable throwing on mount', async () => {
    bridge.isAvailable.mockImplementationOnce(() => {
      throw new Error('not loaded');
    });
    render(<Harness />);
    await flush();
    expect(handle.current!.available).toBe(false);
  });

  it('unsubscribes on unmount', async () => {
    const remove = jest.fn();
    bridge.subscribe.mockImplementationOnce(() => remove);
    const { unmount } = render(<Harness />);
    await flush();
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
