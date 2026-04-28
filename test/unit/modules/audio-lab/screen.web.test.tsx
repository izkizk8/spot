/**
 * T056 [US-cross-platform]: AudioLabScreen Web variant smoke test.
 *
 * Verifies the Web screen mounts, renders RecorderCard + RecordingsList +
 * the degraded AudioSessionCard (informational tooltip in place of the
 * Apply button per FR-045), honors a `Platform.OS = 'web'` mock, never
 * calls `setAudioModeAsync` from this surface (R-007), and produces no
 * `act()` / console warnings on mount/unmount (FR-036).
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

import WebScreen from '@/modules/audio-lab/screen.web';

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AudioLabScreen (Web smoke)', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  const originalOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'web';
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

  it('honors Platform.OS = "web" for the duration of the test', () => {
    expect(Platform.OS).toBe('web');
  });

  it('mounts; renders RecorderCard, RecordingsList empty state, and the degraded AudioSessionCard (tooltip, no Apply button)', async () => {
    const view = render(<WebScreen />);
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

    // Web variant: tooltip present, Apply button absent (FR-045).
    const tooltip = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-session-web-tooltip',
    );
    expect(tooltip.length).toBeGreaterThanOrEqual(1);

    const applyBtn = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-session-apply-button',
    );
    expect(applyBtn.length).toBe(0);
  });

  it('never calls setAudioModeAsync on mount/unmount (R-007 / FR-045)', async () => {
    const view = render(<WebScreen />);
    await flush();
    await act(async () => {
      view.unmount();
    });
    expect(mockExpoAudio.setAudioModeAsync).not.toHaveBeenCalled();
  });

  it('calls loadRecordings() once on mount', async () => {
    render(<WebScreen />);
    await flush();
    expect(mockLoadRecordings).toHaveBeenCalledTimes(1);
  });

  it('mount/unmount produces no console warnings or errors (no act() warnings)', async () => {
    const view = render(<WebScreen />);
    await flush();
    await act(async () => {
      view.unmount();
    });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
