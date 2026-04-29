/**
 * Tests for useBackgroundTasks hook — feature 030 / T018.
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AppState } from 'react-native';

import * as bridge from '@/native/background-tasks';
import * as historyStore from '@/modules/background-tasks-lab/history-store';
import type { TaskRunRecord } from '@/native/background-tasks.types';

jest.mock('@/native/background-tasks');
jest.mock('@/modules/background-tasks-lab/history-store');

const mockBridge = bridge as jest.Mocked<typeof bridge>;
const mockStore = historyStore as jest.Mocked<typeof historyStore>;

class MockNotSupported extends Error {
  override readonly name = 'BackgroundTasksNotSupported' as const;
  constructor(msg?: string) {
    super(msg ?? 'BackgroundTasksNotSupported');
    Object.setPrototypeOf(this, MockNotSupported.prototype);
  }
}

function makeRecord(id: string, type: 'refresh' | 'processing' = 'refresh'): TaskRunRecord {
  return {
    id,
    type,
    scheduledAt: 1,
    startedAt: 2,
    endedAt: 3,
    durationMs: 1,
    status: 'completed',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default mocks: happy idle state
  mockBridge.getLastRun.mockResolvedValue({ refresh: null, processing: null });
  mockBridge.scheduleAppRefresh.mockResolvedValue(undefined);
  mockBridge.scheduleProcessing.mockResolvedValue(undefined);
  mockBridge.cancelAll.mockResolvedValue(undefined);
  // The error class needs to be on the mocked module so instanceof checks work.
  // jest.mock auto-mocks classes as jest.fn — we override with our concrete class.
  (mockBridge as unknown as { BackgroundTasksNotSupported: typeof MockNotSupported }).BackgroundTasksNotSupported =
    MockNotSupported;
  mockStore.listRuns.mockResolvedValue([]);
  mockStore.appendRun.mockImplementation(async (r) => [r]);
  mockStore.clearRuns.mockResolvedValue(undefined);
});

describe('useBackgroundTasks', () => {
  it('on mount calls bridge.getLastRun() and historyStore.listRuns() once each (FR-081)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    renderHook(() => useBackgroundTasks());

    await waitFor(() => {
      expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1);
      expect(mockStore.listRuns).toHaveBeenCalledTimes(1);
    });
  });

  it('mount populates lastRunByType and history from initial reads', async () => {
    const rec = makeRecord('a');
    mockBridge.getLastRun.mockResolvedValueOnce({ refresh: rec, processing: null });
    mockStore.listRuns.mockResolvedValueOnce([rec]);

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => {
      expect(result.current.lastRunByType.refresh).toEqual(rec);
      expect(result.current.history).toEqual([rec]);
    });
  });

  it('AppState background → active triggers a refetch (FR-081 / EC-003)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      const listener = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      listener('active');
    });

    await waitFor(() => {
      expect(mockBridge.getLastRun).toHaveBeenCalledTimes(2);
      expect(mockStore.listRuns).toHaveBeenCalledTimes(2);
    });
  });

  it('schedule("refresh") calls bridge.scheduleAppRefresh(60_000) exactly once (US1 AS1)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.schedule('refresh');
    });

    await waitFor(() => {
      expect(mockBridge.scheduleAppRefresh).toHaveBeenCalledTimes(1);
      expect(mockBridge.scheduleAppRefresh).toHaveBeenCalledWith(60_000);
    });
  });

  it('schedule("processing") forwards both default flags (US2 AS1)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.schedule('processing');
    });

    await waitFor(() => {
      expect(mockBridge.scheduleProcessing).toHaveBeenCalledTimes(1);
      expect(mockBridge.scheduleProcessing).toHaveBeenCalledWith({
        requiresExternalPower: true,
        requiresNetworkConnectivity: true,
      });
    });
  });

  it('two rapid schedule("refresh") produce two ordered native invocations (FR-083)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.schedule('refresh');
      result.current.schedule('refresh');
    });

    await waitFor(() => {
      expect(mockBridge.scheduleAppRefresh).toHaveBeenCalledTimes(2);
    });
  });

  it('cancelAll() delegates and resets scheduledByType to idle (FR-082 / US2 AS3)', async () => {
    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.schedule('refresh');
    });

    await waitFor(() =>
      expect(mockBridge.scheduleAppRefresh).toHaveBeenCalledTimes(1),
    );

    act(() => {
      result.current.cancelAll();
    });

    await waitFor(() => {
      expect(mockBridge.cancelAll).toHaveBeenCalledTimes(1);
      expect(result.current.scheduledByType).toEqual({ refresh: 'idle', processing: 'idle' });
    });
  });

  it('bridge.getLastRun rejecting BackgroundTasksNotSupported -> degraded state, error null (US4 AS3 / EC-002)', async () => {
    mockBridge.getLastRun.mockRejectedValueOnce(new MockNotSupported());

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => {
      expect(result.current.lastRunByType).toEqual({ refresh: null, processing: null });
      expect(result.current.history).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  it('historyStore.listRuns failure surfaces error via onError + history === [] (FR-044)', async () => {
    const failure = new Error('storage broken');
    mockStore.listRuns.mockImplementationOnce(async (opts) => {
      opts?.onError?.(failure);
      return [];
    });

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
      expect(result.current.error).toEqual(failure);
    });
  });

  it('schedule rejection surfaces error and reverts scheduled state', async () => {
    const failure = new Error('schedule failed');
    mockBridge.scheduleAppRefresh.mockRejectedValueOnce(failure);

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => expect(mockBridge.getLastRun).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.schedule('refresh');
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(failure);
      expect(result.current.scheduledByType.refresh).toBe('idle');
    });
  });

  it('completed snapshot triggers history append and reload', async () => {
    const completed = makeRecord('done');
    mockBridge.getLastRun.mockResolvedValueOnce({ refresh: completed, processing: null });
    mockStore.listRuns
      .mockResolvedValueOnce([]) // mount read (empty)
      .mockResolvedValueOnce([completed]); // post-append re-read

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { result } = renderHook(() => useBackgroundTasks());

    await waitFor(() => {
      expect(mockStore.appendRun).toHaveBeenCalledWith(
        completed,
        expect.objectContaining({ onError: expect.any(Function) }),
      );
      expect(result.current.history).toEqual([completed]);
      expect(result.current.scheduledByType.refresh).toBe('idle');
    });
  });

  it('unmount removes the AppState subscription', () => {
    const remove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValueOnce({ remove });

    const { useBackgroundTasks } = require('@/modules/background-tasks-lab/hooks/useBackgroundTasks');
    const { unmount } = renderHook(() => useBackgroundTasks());

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
