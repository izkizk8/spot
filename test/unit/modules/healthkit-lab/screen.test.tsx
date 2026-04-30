/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

const mockNative = {
  initHealthKit: jest.fn((_opts: unknown, cb: (e: string | null) => void) => cb(null)),
  getAuthStatus: jest.fn((_opts: unknown, cb: (e: string | null, r: unknown) => void) =>
    cb(null, { permissions: { read: [2, 2, 2, 2, 2], write: [2, 2] } }),
  ),
  getDailyStepCountSamples: jest.fn(
    (_opts: unknown, cb: (e: string | null, r: unknown[]) => void) => cb(null, []),
  ),
  getHeartRateSamples: jest.fn((_opts: unknown, cb: (e: string | null, r: unknown[]) => void) =>
    cb(null, []),
  ),
  getSleepSamples: jest.fn((_opts: unknown, cb: (e: string | null, r: unknown[]) => void) =>
    cb(null, []),
  ),
  getAnchoredWorkouts: jest.fn((_opts: unknown, cb: (e: unknown, r: { data: unknown[] }) => void) =>
    cb(null, { data: [] }),
  ),
  getLatestWeight: jest.fn((_opts: unknown, cb: (e: string | null, r: unknown) => void) =>
    cb(null, {}),
  ),
  saveWeight: jest.fn((_opts: unknown, cb: (e: string | null) => void) => cb(null)),
  saveHeartRateSample: jest.fn((_opts: unknown, cb: (e: string | null) => void) => cb(null)),
  setObserver: jest.fn(),
};

jest.mock('react-native-health', () => ({
  __esModule: true,
  default: mockNative,
}));

import HealthKitLabScreen from '@/modules/healthkit-lab/screen';

async function renderAndFlush() {
  const utils = render(<HealthKitLabScreen />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return utils;
}

describe('healthkit-lab screen (iOS)', () => {
  it('renders the six cards', async () => {
    const { getByTestId } = await renderAndFlush();
    expect(getByTestId('healthkit-auth-card')).toBeTruthy();
    expect(getByTestId('healthkit-step-card')).toBeTruthy();
    expect(getByTestId('healthkit-hr-card')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-card')).toBeTruthy();
    expect(getByTestId('healthkit-workouts-card')).toBeTruthy();
    expect(getByTestId('healthkit-live-card')).toBeTruthy();
  });

  it('renders chart and empty states when the hook returns no data', async () => {
    const { getByTestId } = await renderAndFlush();
    // Step bucketing always produces 7 zero entries when no samples are
    // returned, so the chart (not the empty state) is rendered.
    expect(getByTestId('healthkit-step-chart')).toBeTruthy();
    expect(getByTestId('healthkit-hr-empty')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-empty')).toBeTruthy();
    expect(getByTestId('healthkit-workouts-empty')).toBeTruthy();
  });
});
