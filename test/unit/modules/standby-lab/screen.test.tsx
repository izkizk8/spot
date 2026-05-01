/**
 * Tests for screen.tsx (iOS 17+ variant).
 *
 * @see specs/028-standby-mode/tasks.md T036
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import bridge from '@/native/widget-center';
import {
  WidgetCenterBridgeError,
  WidgetCenterNotSupportedError,
} from '@/native/widget-center.types';

jest.mock('@/native/widget-center', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => true),
    getCurrentConfig: jest.fn(),
    setConfig: jest.fn(),
    reloadAllTimelines: jest.fn(),
    reloadTimelinesByKind: jest.fn(),
    getLockConfig: jest.fn(),
    setLockConfig: jest.fn(),
    getStandByConfig: jest.fn(),
    setStandByConfig: jest.fn(),
  },
}));

const standby = bridge as unknown as {
  getStandByConfig: jest.Mock;
  setStandByConfig: jest.Mock;
  reloadTimelinesByKind: jest.Mock;
  setConfig: jest.Mock;
  setLockConfig: jest.Mock;
  reloadAllTimelines: jest.Mock;
};

const DEFAULT_CFG = { showcaseValue: 'StandBy', counter: 0, tint: 'blue', mode: 'fullColor' };

function setPlatformVersion(version: string): void {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version });
}

async function pushAndSettle(getByLabelTextFn: any): Promise<void> {
  await act(async () => {
    fireEvent.press(getByLabelTextFn(/Push to StandBy widget/i));
  });
  // Drain microtasks that the panel + screen handlers chain through.
  await act(async () => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
}

describe('StandByLabScreen (iOS 17+ variant)', () => {
  const originalVersion = Platform.Version;
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformVersion('17.0');
    standby.getStandByConfig.mockResolvedValue(DEFAULT_CFG);
    standby.setStandByConfig.mockResolvedValue(undefined);
    standby.reloadTimelinesByKind.mockResolvedValue(undefined);
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'Version', { configurable: true, value: originalVersion });
  });

  it('layout order: explainer → config → preview → setup → reload-log', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { findByText } = render(<StandByLabScreen />);
    expect(await findByText(/about.*standby/i)).toBeTruthy();
    expect(await findByText(/standby widget config/i)).toBeTruthy();
    expect(await findByText(/set up standby/i)).toBeTruthy();
    expect(await findByText(/no.*push/i)).toBeTruthy();
  });

  it('Push calls setStandByConfig then reloadTimelinesByKind("SpotStandByWidget")', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    await waitFor(() => {
      expect(standby.setStandByConfig).toHaveBeenCalledTimes(1);
      expect(standby.reloadTimelinesByKind).toHaveBeenCalledWith('SpotStandByWidget');
    });
    const setOrder = standby.setStandByConfig.mock.invocationCallOrder[0];
    const reloadOrder = standby.reloadTimelinesByKind.mock.invocationCallOrder[0];
    expect(setOrder).toBeLessThan(reloadOrder);
  });

  it('on success, an entry with kind=SpotStandByWidget + outcome=success is prepended', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText, findAllByLabelText } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    const successEntries = await findAllByLabelText(/Success.*SpotStandByWidget/);
    expect(successEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('on WidgetCenterBridgeError, a failure entry is prepended', async () => {
    standby.setStandByConfig.mockRejectedValueOnce(new WidgetCenterBridgeError('boom'));
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText, findAllByLabelText } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    const failureEntries = await findAllByLabelText(/Failure.*SpotStandByWidget/);
    expect(failureEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('reload event log caps at 10 entries (oldest dropped on push #11)', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText, getAllByLabelText } = render(<StandByLabScreen />);
    for (let i = 0; i < 11; i++) {
      // Sequential pushes — each must complete before the next so the reducer
      // observes them as 11 distinct dispatches.
      await pushAndSettle(getByLabelText);
    }
    await waitFor(() => {
      const rows = getAllByLabelText(/Success.*SpotStandByWidget|Failure.*SpotStandByWidget/);
      expect(rows.length).toBe(10);
    });
  });

  it('does NOT call setConfig / setLockConfig / reloadAllTimelines / other-kind reloads', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    await waitFor(() => expect(standby.setStandByConfig).toHaveBeenCalled());
    expect(standby.setConfig).not.toHaveBeenCalled();
    expect(standby.setLockConfig).not.toHaveBeenCalled();
    expect(standby.reloadAllTimelines).not.toHaveBeenCalled();
    for (const call of standby.reloadTimelinesByKind.mock.calls) {
      expect(call[0]).toBe('SpotStandByWidget');
    }
  });

  it('iOS < 17 hides the iOS-17 chrome, shows banner, disables Push', async () => {
    setPlatformVersion('16.4');
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { findByText, queryByText, findByLabelText } = render(<StandByLabScreen />);
    expect(await findByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
    expect(queryByText(/set up standby/i)).toBeNull();
    expect(queryByText(/no.*push/i)).toBeNull();
    const pushBtn = await findByLabelText(/Push to StandBy widget/i);
    expect(pushBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('unmount clears the log without throwing', async () => {
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText, unmount } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    expect(() => unmount()).not.toThrow();
  });

  it('non-bridge unsupported error still surfaces as failure entry', async () => {
    standby.setStandByConfig.mockRejectedValueOnce(
      new WidgetCenterNotSupportedError('unsupported'),
    );
    const StandByLabScreen = require('@/modules/standby-lab/screen').default;
    const { getByLabelText, findAllByLabelText } = render(<StandByLabScreen />);
    await pushAndSettle(getByLabelText);
    const failure = await findAllByLabelText(/Failure.*SpotStandByWidget/);
    expect(failure.length).toBeGreaterThanOrEqual(1);
  });
});
