/**
 * Tests for background-tasks-lab Android screen — feature 030 / T036.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import * as bridge from '@/native/background-tasks';

jest.mock('@/native/background-tasks');

const mockBridge = bridge as jest.Mocked<typeof bridge>;

beforeEach(() => {
  jest.clearAllMocks();
  // Make every mutating method throw — defensive assertion that the
  // android screen never invokes them.
  const err = new Error('should not be called');
  mockBridge.scheduleAppRefresh.mockRejectedValue(err);
  mockBridge.scheduleProcessing.mockRejectedValue(err);
  mockBridge.cancelAll.mockRejectedValue(err);
  mockBridge.getLastRun.mockRejectedValue(err);
  mockBridge.isAvailable.mockReturnValue(false);
});

describe('background-tasks-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner, ExplainerCard, and TestTriggerCard only (FR-011)', () => {
    const Screen = require('@/modules/background-tasks-lab/screen.android').default;
    render(<Screen />);
    expect(screen.getByText('Background Tasks require iOS 13+')).toBeTruthy();
    expect(screen.getByText('About Background Tasks')).toBeTruthy();
    expect(screen.getByText(/Test triggers/)).toBeTruthy();
  });

  it('schedule CTAs are absent', () => {
    const Screen = require('@/modules/background-tasks-lab/screen.android').default;
    render(<Screen />);
    expect(screen.queryByText('Schedule App Refresh')).toBeNull();
    expect(screen.queryByText('Schedule Processing')).toBeNull();
  });

  it('RunHistoryList is absent', () => {
    const Screen = require('@/modules/background-tasks-lab/screen.android').default;
    render(<Screen />);
    expect(screen.queryByText('Run history')).toBeNull();
    expect(screen.queryByText('No background runs recorded yet')).toBeNull();
  });

  it('does not invoke any mutating bridge method (FR-071)', () => {
    const Screen = require('@/modules/background-tasks-lab/screen.android').default;
    render(<Screen />);
    expect(mockBridge.scheduleAppRefresh).not.toHaveBeenCalled();
    expect(mockBridge.scheduleProcessing).not.toHaveBeenCalled();
    expect(mockBridge.cancelAll).not.toHaveBeenCalled();
    expect(mockBridge.getLastRun).not.toHaveBeenCalled();
  });

  it('render is exception-free even with throwing-mocked bridge', () => {
    expect(() => {
      const Screen = require('@/modules/background-tasks-lab/screen.android').default;
      render(<Screen />);
    }).not.toThrow();
  });
});
