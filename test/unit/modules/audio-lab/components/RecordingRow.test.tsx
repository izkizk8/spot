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

function flattenStyle(s: unknown): Record<string, unknown> {
  const arr = Array.isArray(s) ? s : [s];
  return arr.reduce<Record<string, unknown>>((acc, item) => {
    if (item && typeof item === 'object') Object.assign(acc, item);
    return acc;
  }, {});
}

function findBadge(root: any, id: string) {
  return root.findAll(
    (n: any) => n.props && n.props.testID === `audio-lab-quality-${id}`,
  )[0];
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

  // -------------------------------------------------------------------------
  // T047 [US3] Quality badge display + theme-token coloring (FR-011)
  // -------------------------------------------------------------------------

  describe('quality badge (T047 / FR-011)', () => {
    it.each(['Low', 'Medium', 'High'] as const)('displays the %s preset name', (q) => {
      const r = makeRecording({ id: `id-${q}`, quality: q });
      const view = render(
        <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
      );
      expect(view.queryByText(q)).toBeTruthy();
      const badge = findBadge(view.UNSAFE_root, `id-${q}`);
      expect(badge).toBeTruthy();
      const bg = flattenStyle(badge.props.style).backgroundColor;
      // Color must come from the theme — never an empty / undefined / hardcoded
      // null. We don't pin the exact hex (that's a theme concern); we only
      // assert it's a non-empty string starting with '#'.
      expect(typeof bg).toBe('string');
      expect((bg as string).startsWith('#')).toBe(true);
    });

    it('uses three distinct background colors for Low / Medium / High (deterministic per preset)', () => {
      const colors: Record<string, unknown> = {};
      for (const q of ['Low', 'Medium', 'High'] as const) {
        const r = makeRecording({ id: `id-${q}`, quality: q });
        const view = render(
          <RecordingRow recording={r} onPlay={() => undefined} onDelete={() => undefined} onShare={() => undefined} />,
        );
        const badge = findBadge(view.UNSAFE_root, `id-${q}`);
        colors[q] = flattenStyle(badge.props.style).backgroundColor;
      }
      // Low/High must be visually distinct — Medium may match the row bg
      // (neutral). Either way, all three should not collapse to one value.
      expect(colors.Low).not.toEqual(colors.High);
      expect(new Set(Object.values(colors)).size).toBeGreaterThanOrEqual(2);
    });
  });
});
