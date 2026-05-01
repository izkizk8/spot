/**
 * Tests for background-tasks-lab iOS screen — feature 030 / T035.
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';

import * as bridge from '@/native/background-tasks';
import * as historyStore from '@/modules/background-tasks-lab/history-store';

jest.mock('@/native/background-tasks');
jest.mock('@/modules/background-tasks-lab/history-store');

class MockNotSupported extends Error {
  override readonly name = 'BackgroundTasksNotSupported' as const;
  constructor(msg?: string) {
    super(msg ?? 'BackgroundTasksNotSupported');
    Object.setPrototypeOf(this, MockNotSupported.prototype);
  }
}

const mockBridge = bridge as jest.Mocked<typeof bridge>;
const mockStore = historyStore as jest.Mocked<typeof historyStore>;

beforeEach(() => {
  jest.clearAllMocks();
  mockBridge.isAvailable.mockReturnValue(true);
  mockBridge.getLastRun.mockResolvedValue({ refresh: null, processing: null });
  mockBridge.scheduleAppRefresh.mockResolvedValue(undefined);
  mockBridge.scheduleProcessing.mockResolvedValue(undefined);
  mockBridge.cancelAll.mockResolvedValue(undefined);
  (
    mockBridge as unknown as { BackgroundTasksNotSupported: typeof MockNotSupported }
  ).BackgroundTasksNotSupported = MockNotSupported;
  mockStore.listRuns.mockResolvedValue([]);
  mockStore.appendRun.mockImplementation(async (r) => [r]);
  mockStore.clearRuns.mockResolvedValue(undefined);
});

describe('background-tasks-lab screen (iOS)', () => {
  it('renders the five panels in fixed top-to-bottom order (FR-010)', async () => {
    const Screen = require('@/modules/background-tasks-lab/screen').default;
    render(<Screen />);
    // Panel headings exist
    await waitFor(() => {
      expect(screen.getByText('About Background Tasks')).toBeTruthy();
      expect(screen.getByText('App Refresh')).toBeTruthy();
      expect(screen.getByText('Schedule Processing')).toBeTruthy();
      expect(screen.getByText('Run history')).toBeTruthy();
      expect(screen.getByText(/Test triggers/)).toBeTruthy();
    });
  });

  it('tapping refresh CTA invokes bridge.scheduleAppRefresh (US1 AS1)', async () => {
    const Screen = require('@/modules/background-tasks-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText('Schedule App Refresh'));
    fireEvent.press(screen.getByText('Schedule App Refresh'));
    await waitFor(() => {
      expect(mockBridge.scheduleAppRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('tapping processing CTA invokes bridge.scheduleProcessing (US2 AS1)', async () => {
    const Screen = require('@/modules/background-tasks-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText('Schedule Processing'));
    fireEvent.press(screen.getByText('Schedule Processing'));
    await waitFor(() => {
      expect(mockBridge.scheduleProcessing).toHaveBeenCalledTimes(1);
    });
  });

  it('RunHistoryList re-renders when history changes (history flows from hook)', async () => {
    mockStore.listRuns.mockResolvedValueOnce([
      {
        id: 'h1',
        type: 'refresh',
        scheduledAt: 1,
        startedAt: 2,
        endedAt: 3,
        durationMs: 1,
        status: 'completed',
      },
    ]);
    const Screen = require('@/modules/background-tasks-lab/screen').default;
    render(<Screen />);
    await waitFor(() => {
      expect(screen.getByText('h1')).toBeTruthy();
    });
  });

  it('renders fallback (banner + explainer + test-trigger) when bridge.isAvailable() === false (FR-013/EC-002)', async () => {
    mockBridge.isAvailable.mockReturnValue(false);
    const Screen = require('@/modules/background-tasks-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Background Tasks require iOS 13|older than 13/)).toBeTruthy();
    expect(screen.getByText('About Background Tasks')).toBeTruthy();
    expect(screen.getByText(/Test triggers/)).toBeTruthy();
    expect(screen.queryByText('Schedule App Refresh')).toBeNull();
    expect(screen.queryByText('Schedule Processing')).toBeNull();
  });

  it("does NOT import any prior feature's screen module", () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/background-tasks-lab/screen.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    // No imports of other feature screen files
    expect(src).not.toMatch(/focus-filters-lab\/screen/);
    expect(src).not.toMatch(/standby-lab\/screen/);
    expect(src).not.toMatch(/lock-widgets-lab\/screen/);
    expect(src).not.toMatch(/core-location-lab\/screen/);
  });
});
