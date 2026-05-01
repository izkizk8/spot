/**
 * T055 [US-cross-platform]: AudioLabScreen Android variant smoke test.
 *
 * Verifies the Android screen mounts, renders the three cards (RecorderCard,
 * RecordingsList, AudioSessionCard with the Apply button), honors a
 * `Platform.OS = 'android'` mock, and produces no `act()` / console
 * warnings on mount/unmount (FR-036).
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('expo-audio');

const mockExpoAudio = jest.requireMock(
  'expo-audio',
) as typeof import('../../../__mocks__/expo-audio');

const mockLoadRecordings = jest.fn(async () => [] as unknown[]);
jest.mock('@/modules/audio-lab/recordings-store', () => ({
  __esModule: true,
  STORAGE_KEY: 'spot.audio.recordings',
  loadRecordings: () => mockLoadRecordings(),
  saveRecording: jest.fn(async () => []),
  deleteRecording: jest.fn(async () => []),
  clearRecordings: jest.fn(async () => undefined),
}));

import AndroidScreen from '@/modules/audio-lab/screen.android';

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AudioLabScreen (Android smoke)', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  const originalOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'android';
    mockExpoAudio.__reset();
    mockLoadRecordings.mockClear();
    mockLoadRecordings.mockResolvedValue([]);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Platform.OS = originalOS;
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('honors Platform.OS = "android" for the duration of the test', () => {
    expect(Platform.OS).toBe('android');
  });

  it('mounts; renders RecorderCard, RecordingsList empty state, and AudioSessionCard with Apply button', async () => {
    const view = render(<AndroidScreen />);
    await flush();

    const recordBtn = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-record-button',
    );
    expect(recordBtn.length).toBeGreaterThanOrEqual(1);

    const empty = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-empty-state',
    );
    expect(empty.length).toBeGreaterThanOrEqual(1);

    const session = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-session-card',
    );
    expect(session.length).toBeGreaterThanOrEqual(1);

    // Android still renders the Apply button (the web tooltip variant is the
    // exception, not the rule).
    const applyBtn = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-session-apply-button',
    );
    expect(applyBtn.length).toBeGreaterThanOrEqual(1);

    const tooltip = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-session-web-tooltip',
    );
    expect(tooltip.length).toBe(0);
  });

  it('calls loadRecordings() once on mount', async () => {
    render(<AndroidScreen />);
    await flush();
    expect(mockLoadRecordings).toHaveBeenCalledTimes(1);
  });

  it('mount/unmount produces no console warnings or errors (no act() warnings)', async () => {
    const view = render(<AndroidScreen />);
    await flush();
    await act(async () => {
      view.unmount();
    });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
