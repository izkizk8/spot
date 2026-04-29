/**
 * useQuickActions native hook tests.
 * Feature: 039-quick-actions
 *
 * @see specs/039-quick-actions/contracts/bridge.md
 * @see specs/039-quick-actions/contracts/routing.md
 */

jest.mock('expo-quick-actions', () => {
  const handlerHolder: { current: ((a: unknown) => void) | null } = { current: null };
  return {
    __esModule: true,
    setItems: jest.fn().mockResolvedValue(undefined),
    getItems: jest.fn().mockResolvedValue([]),
    getInitial: jest.fn().mockResolvedValue(null),
    addListener: jest.fn((h: (a: unknown) => void) => {
      handlerHolder.current = h;
      return { remove: jest.fn() };
    }),
    clearItems: jest.fn().mockResolvedValue(undefined),
    __getHandler: () => handlerHolder.current,
  };
});

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    navigate: jest.fn(),
  },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as QA from 'expo-quick-actions';
import { router } from 'expo-router';

import { useQuickActions } from '@/modules/quick-actions-lab/hooks/useQuickActions';
import { clearMoodEntries, getMoodEntries } from '@/modules/quick-actions-lab/mood-log';

const qaMock = QA as unknown as {
  setItems: jest.Mock;
  getItems: jest.Mock;
  getInitial: jest.Mock;
  addListener: jest.Mock;
  clearItems: jest.Mock;
  __getHandler: () => ((a: unknown) => void) | null;
};

const routerMock = router as unknown as { replace: jest.Mock; navigate: jest.Mock };

describe('useQuickActions', () => {
  beforeEach(() => {
    qaMock.setItems.mockClear();
    qaMock.getItems.mockClear();
    qaMock.getInitial.mockReset().mockResolvedValue(null);
    qaMock.addListener.mockClear();
    qaMock.clearItems.mockClear();
    routerMock.replace.mockClear();
    routerMock.navigate.mockClear();
    clearMoodEntries();
  });

  it('setItems forwards to the bridge', async () => {
    const { result } = renderHook(() => useQuickActions());
    await act(async () => {
      await result.current.setItems([
        {
          type: 'foo',
          title: 'Foo',
          iconName: 'star',
          userInfo: { route: '/foo' },
        },
      ]);
    });
    expect(qaMock.setItems).toHaveBeenCalledTimes(1);
    const arg = qaMock.setItems.mock.calls[0][0];
    expect(arg).toHaveLength(1);
    expect(arg[0].id).toBe('foo');
  });

  it('setItems rejects when items.length > 4', async () => {
    const { result } = renderHook(() => useQuickActions());
    const tooMany = Array.from({ length: 5 }, (_, i) => ({
      type: `t${i}`,
      title: 't',
      iconName: 'i',
      userInfo: { route: '/r' },
    }));
    await expect(result.current.setItems(tooMany)).rejects.toThrow(/cap exceeded/);
    expect(qaMock.setItems).not.toHaveBeenCalled();
  });

  it('cold-launch invocation routes via router.replace', async () => {
    qaMock.getInitial.mockResolvedValue({
      id: 'open-sensors',
      title: 'Open Sensors',
      params: { route: '/modules/sensors-playground' },
    });
    renderHook(() => useQuickActions());
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/modules/sensors-playground');
    });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('warm-launch listener invocation routes via router.navigate', async () => {
    renderHook(() => useQuickActions());
    await waitFor(() => expect(qaMock.addListener).toHaveBeenCalled());
    const handler = qaMock.__getHandler();

    act(() => {
      handler?.({
        id: 'open-audio-lab',
        params: { route: '/modules/audio-lab' },
      });
    });

    await waitFor(() => {
      expect(routerMock.navigate).toHaveBeenCalledWith('/modules/audio-lab');
    });
  });

  it('add-mood-happy writes to the mood log in addition to routing', async () => {
    renderHook(() => useQuickActions());
    await waitFor(() => expect(qaMock.addListener).toHaveBeenCalled());
    const handler = qaMock.__getHandler();

    act(() => {
      handler?.({
        id: 'add-mood-happy',
        params: { route: '/modules/app-intents-lab', mood: 'happy' },
      });
    });

    await waitFor(() => {
      expect(routerMock.navigate).toHaveBeenCalledWith('/modules/app-intents-lab');
    });
    const entries = getMoodEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].mood).toBe('happy');
    expect(entries[0].source).toBe('quick-action');
  });

  it('missing route → no navigation; warns in __DEV__', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => useQuickActions());
    await waitFor(() => expect(qaMock.addListener).toHaveBeenCalled());
    const handler = qaMock.__getHandler();

    act(() => {
      handler?.({
        id: 'mystery',
        params: {},
      });
    });

    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[quick-actions] no route for', 'mystery');
    warnSpy.mockRestore();
  });

  it('lastInvoked surfaces the most recent invocation', async () => {
    const { result } = renderHook(() => useQuickActions());
    await waitFor(() => expect(qaMock.addListener).toHaveBeenCalled());
    const handler = qaMock.__getHandler();

    act(() => {
      handler?.({
        id: 'open-sensors',
        params: { route: '/modules/sensors-playground' },
      });
    });

    await waitFor(() => {
      expect(result.current.lastInvoked?.type).toBe('open-sensors');
    });

    act(() => {
      handler?.({
        id: 'open-audio-lab',
        params: { route: '/modules/audio-lab' },
      });
    });

    await waitFor(() => {
      expect(result.current.lastInvoked?.type).toBe('open-audio-lab');
    });
  });

  it('clearItems delegates to bridge.clearItems', async () => {
    const { result } = renderHook(() => useQuickActions());
    await act(async () => {
      await result.current.clearItems();
    });
    expect(qaMock.clearItems).toHaveBeenCalledTimes(1);
  });
});
