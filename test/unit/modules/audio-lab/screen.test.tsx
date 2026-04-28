/**
 * T031 [US1]: AudioLabScreen iOS smoke test.
 *
 * Verifies the screen mounts, calls `loadRecordings()` on mount, renders the
 * three cards, and toggles the PermissionBanner based on permission status —
 * with no `act()` / console warnings on mount or unmount.
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

jest.mock('expo-audio');

const mockExpoAudio = jest.requireMock('expo-audio') as typeof import('../../../__mocks__/expo-audio');

const mockLoadRecordings = jest.fn(async () => [] as unknown[]);
jest.mock('@/modules/audio-lab/recordings-store', () => ({
  __esModule: true,
  STORAGE_KEY: 'spot.audio.recordings',
  loadRecordings: () => mockLoadRecordings(),
  saveRecording: jest.fn(async () => []),
  deleteRecording: jest.fn(async () => []),
  clearRecordings: jest.fn(async () => undefined),
}));

import AudioLabScreen from '@/modules/audio-lab/screen';

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AudioLabScreen (iOS smoke)', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockExpoAudio.__reset();
    mockLoadRecordings.mockClear();
    mockLoadRecordings.mockResolvedValue([]);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('mounts; renders RecorderCard, RecordingsList empty state, and AudioSessionCard', async () => {
    const view = render(<AudioLabScreen />);
    await flush();

    // Record button (RecorderCard surface) — Animated.View wrapper produces
    // duplicate fibers in the test renderer, so accept any positive count.
    const recordBtn = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-record-button',
    );
    expect(recordBtn.length).toBeGreaterThanOrEqual(1);

    // Empty state (RecordingsList surface)
    const empty = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-empty-state',
    );
    expect(empty.length).toBeGreaterThanOrEqual(1);

    // Audio session card placeholder
    const session = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-session-card',
    );
    expect(session.length).toBeGreaterThanOrEqual(1);
  });

  it('calls loadRecordings() once on mount and renders the resulting list', async () => {
    mockLoadRecordings.mockResolvedValueOnce([
      {
        id: 'a',
        name: 'first.m4a',
        uri: 'file:///a.m4a',
        durationMs: 1000,
        sizeBytes: 4096,
        createdAt: '2026-04-28T12:00:00.000Z',
        quality: 'Medium',
      },
    ] as unknown[]);
    const view = render(<AudioLabScreen />);
    await flush();
    expect(mockLoadRecordings).toHaveBeenCalledTimes(1);
    expect(view.queryByText('first.m4a')).toBeTruthy();
  });

  it('PermissionBanner is hidden by default (undetermined)', async () => {
    const view = render(<AudioLabScreen />);
    await flush();
    const banner = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-permission-banner',
    );
    expect(banner.length).toBe(0);
  });

  it('PermissionBanner appears after a denied permission attempt', async () => {
    mockExpoAudio.__setPermission('denied');
    const view = render(<AudioLabScreen />);
    await flush();

    // Simulate the user pressing the record button — the screen kicks off
    // start(), which lazily requests permission, sees denial, and updates the
    // hook's hasPermission to 'denied'.
    const recordBtn = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-record-button',
    )[0];
    await act(async () => {
      recordBtn.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    const banner = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-permission-banner',
    );
    expect(banner.length).toBeGreaterThanOrEqual(1);
  });

  it('mount/unmount produces no console warnings or errors (no act() warnings)', async () => {
    const view = render(<AudioLabScreen />);
    await flush();
    await act(async () => {
      view.unmount();
    });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
