/**
 * T040 [US2]: RecordingRow component tests.
 *
 * Verifies row rendering (name + duration + size + quality badge), the three
 * action buttons with accessibility labels, the Delete confirm flow via
 * `Alert.alert`, the Share happy-path through `expo-sharing`, and the
 * fallback path when `Sharing.isAvailableAsync()` returns false (FR-014 / D-06
 * — must never throw).
 */

import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import type { Recording } from '@/modules/audio-lab/audio-types';
import RecordingRow from '@/modules/audio-lab/components/RecordingRow';

jest.mock('expo-sharing');

const mockSharing = jest.requireMock('expo-sharing') as typeof import('../../../../__mocks__/expo-sharing');

function makeRecording(over: Partial<Recording> = {}): Recording {
  return {
    id: 'id-1',
    name: '2026-04-28-12-00-00.m4a',
    uri: 'file:///r.m4a',
    durationMs: 1500,
    sizeBytes: 4096,
    createdAt: '2026-04-28T12:00:00.000Z',
    quality: 'Medium',
    ...over,
  };
}

function findButton(root: any, label: RegExp) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      label.test(String(n.props.accessibilityLabel ?? '')),
  )[0];
}

async function flushMicrotasks() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe('RecordingRow', () => {
  let alertSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let linkingSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSharing.__reset();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    linkingSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    warnSpy.mockRestore();
    linkingSpy.mockRestore();
  });

  it('renders the recording name, formatted duration, humanized size, and quality badge', () => {
    const r = makeRecording({
      name: 'a.m4a',
      durationMs: 65 * 1000, // 1:05
      sizeBytes: 12_800, // ≈ 12.5 KB
      quality: 'High',
    });
    const view = render(
      <RecordingRow
        recording={r}
        onPlay={() => undefined}
        onDelete={() => undefined}
        onShare={() => undefined}
      />,
    );
    expect(view.queryByText('a.m4a')).toBeTruthy();
    expect(view.queryByText(/1:05/)).toBeTruthy();
    expect(view.queryByText(/12\.5 KB/)).toBeTruthy();
    expect(view.queryByText('High')).toBeTruthy();
  });

  it('formats sizes per bytesToHuman: 512 B and 4.2 MB', () => {
    const a = makeRecording({ id: 'a', name: 'a.m4a', sizeBytes: 512 });
    const view1 = render(
      <RecordingRow recording={a} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
    );
    expect(view1.queryByText(/512 B/)).toBeTruthy();

    const b = makeRecording({ id: 'b', name: 'b.m4a', sizeBytes: Math.round(4.2 * 1024 * 1024) });
    const view2 = render(
      <RecordingRow recording={b} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
    );
    expect(view2.queryByText(/4\.2 MB/)).toBeTruthy();
  });

  it('formats durations ≥ 1h as H:MM:SS', () => {
    const r = makeRecording({ durationMs: 3_661_000 }); // 1:01:01
    const view = render(
      <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
    );
    expect(view.queryByText(/1:01:01/)).toBeTruthy();
  });

  it('renders Play / Delete / Share buttons with accessibility labels', () => {
    const r = makeRecording({ name: 'thing.m4a' });
    const view = render(
      <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
    );
    expect(findButton(view.UNSAFE_root, /^Play thing\.m4a$/)).toBeDefined();
    expect(findButton(view.UNSAFE_root, /^Share thing\.m4a$/)).toBeDefined();
    expect(findButton(view.UNSAFE_root, /^Delete thing\.m4a$/)).toBeDefined();
  });

  it('tapping Play invokes onPlay(recording.id)', () => {
    const onPlay = jest.fn();
    const r = makeRecording({ id: 'rid', name: 'p.m4a' });
    const view = render(
      <RecordingRow recording={r} onPlay={onPlay} onDelete={() => undefined} onShare={() => undefined} />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Play p\.m4a$/));
    expect(onPlay).toHaveBeenCalledWith('rid');
  });

  it('tapping Delete shows Alert.alert confirm; invokes onDelete only on confirm', () => {
    const onDelete = jest.fn();
    const r = makeRecording({ id: 'rid', name: 'd.m4a' });
    const view = render(
      <RecordingRow recording={r} onPlay={() => undefined} onDelete={onDelete} onShare={() => undefined} />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Delete d\.m4a$/));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    // Simulate the user tapping Cancel: find the cancel button and invoke its onPress.
    const cancelArgs = alertSpy.mock.calls[0];
    const buttons = cancelArgs[2] as Array<{ text: string; style?: string; onPress?: () => void }>;
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    cancelBtn?.onPress?.();
    expect(onDelete).not.toHaveBeenCalled();

    // Tap Delete again, confirm.
    fireEvent.press(findButton(view.UNSAFE_root, /^Delete d\.m4a$/));
    const confirmArgs = alertSpy.mock.calls[1];
    const confirmButtons = confirmArgs[2] as Array<{ text: string; style?: string; onPress?: () => void }>;
    const destructive = confirmButtons.find((b) => b.style === 'destructive');
    destructive?.onPress?.();
    expect(onDelete).toHaveBeenCalledWith('rid');
  });

  it('tapping Share invokes onShare(recording) and calls Sharing.shareAsync when available', async () => {
    mockSharing.__setAvailable(true);
    const onShare = jest.fn();
    const r = makeRecording({ id: 'rid', name: 's.m4a', uri: 'file:///s.m4a' });
    const view = render(
      <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={onShare} />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Share s\.m4a$/));
    expect(onShare).toHaveBeenCalledWith(r);
    await flushMicrotasks();
    expect(mockSharing.isAvailableAsync).toHaveBeenCalled();
    expect(mockSharing.shareAsync).toHaveBeenCalledWith('file:///s.m4a', expect.anything());
  });

  it('falls back to Linking.openURL when Sharing.isAvailableAsync() resolves false (no throw)', async () => {
    mockSharing.__setAvailable(false);
    const onShare = jest.fn();
    const r = makeRecording({ id: 'rid', name: 'f.m4a', uri: 'file:///f.m4a' });
    const view = render(
      <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={onShare} />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Share f\.m4a$/));
    await flushMicrotasks();
    expect(mockSharing.shareAsync).not.toHaveBeenCalled();
    expect(linkingSpy).toHaveBeenCalledWith('file:///f.m4a');
  });
});
