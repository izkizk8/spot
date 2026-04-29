/**
 * Tests for useFocusFilter hook per T021.
 *
 * @see specs/029-focus-filters/tasks.md T021
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';
import * as focusFiltersBridge from '@/native/focus-filters';

jest.mock('@/native/focus-filters');

const mockBridge = focusFiltersBridge as jest.Mocked<typeof focusFiltersBridge>;

describe('useFocusFilter hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('mount fetch: calls getCurrentFilterValues() exactly once on first render', async () => {
    const payload: ShowcaseFilterPersistedPayload = {
      mode: 'relaxed',
      accentColor: 'blue',
      event: 'activated',
      updatedAt: '2026-05-07T12:34:56.000Z',
    };
    mockBridge.getCurrentFilterValues.mockResolvedValue(payload);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(1);
    });

    expect(result.current.values).toEqual(payload);
  });

  it('AppState refetch: change to "active" triggers another getCurrentFilterValues() call', async () => {
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(1);
    });

    // Simulate AppState change to 'active'
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = (AppState.addEventListener as any).mock.calls[0][1];
      listener('active');
    });

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(2);
    });
  });

  it('AppState non-"active" is a no-op', async () => {
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(1);
    });

    // Simulate AppState change to 'background' and 'inactive'
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listener = (AppState.addEventListener as any).mock.calls[0][1];
      listener('background');
      listener('inactive');
    });

    // Should still be only 1 call (mount)
    expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(1);
  });

  it('tolerates FocusFiltersNotSupported: resolves values to null, no error propagation', async () => {
    const { FocusFiltersNotSupported } = require('@/native/focus-filters');
    mockBridge.getCurrentFilterValues.mockRejectedValue(
      new FocusFiltersNotSupported('not supported'),
    );

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(result.current.values).toBeNull();
    });
  });

  it('refresh() is callable and triggers additional getCurrentFilterValues() call', async () => {
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockBridge.getCurrentFilterValues).toHaveBeenCalledTimes(2);
    });
  });

  it('simulateActivation(values) prepends a simulated entry to eventLog', () => {
    jest.useFakeTimers();
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    act(() => {
      result.current.simulateActivation({ mode: 'focused', accentColor: 'orange' });
      jest.advanceTimersByTime(300); // Flush debounce
    });

    expect(result.current.eventLog.length).toBeGreaterThan(0);
    expect(result.current.eventLog[0].kind).toBe('simulated');
    expect(result.current.eventLog[0].values.mode).toBe('focused');
    expect(result.current.eventLog[0].values.accentColor).toBe('orange');
    expect(result.current.eventLog[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    jest.useRealTimers();
  });

  it('event log ring buffer caps at 10', async () => {
    jest.useFakeTimers();
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    // Prepend 11 entries
    for (let i = 0; i < 11; i++) {
      act(() => {
        result.current.simulateActivation({ mode: 'relaxed', accentColor: 'blue' });
        jest.advanceTimersByTime(300); // Flush debounce
      });
    }

    expect(result.current.eventLog.length).toBe(10);
    jest.useRealTimers();
  });

  it('debounce ~300 ms: 5 rapid calls produce one entry after debounce flush', () => {
    jest.useFakeTimers();
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    // 5 rapid calls
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.simulateActivation({ mode: 'quiet', accentColor: 'green' });
      }
    });

    // Before debounce flush
    expect(result.current.eventLog.length).toBe(0);

    // Advance 300 ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // After debounce flush
    expect(result.current.eventLog.length).toBe(1);

    jest.useRealTimers();
  });

  it('unmount cleanup: removes AppState listener', () => {
    mockBridge.getCurrentFilterValues.mockResolvedValue(null);

    const mockRemove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { unmount } = renderHook(() => useFocusFilter());

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it('bridge errors other than FocusFiltersNotSupported resolve to null AND log once', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockBridge.getCurrentFilterValues.mockRejectedValue(new Error('boom'));

    const { useFocusFilter } = require('@/modules/focus-filters-lab/hooks/useFocusFilter');
    const { result } = renderHook(() => useFocusFilter());

    await waitFor(() => {
      expect(result.current.values).toBeNull();
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });
});
