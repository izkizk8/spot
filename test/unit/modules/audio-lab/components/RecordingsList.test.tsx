/**
 * T030 [US1]: RecordingsList component tests (FR-009 / FR-017 visual surface).
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import type { Recording } from '@/modules/audio-lab/audio-types';
import RecordingsList from '@/modules/audio-lab/components/RecordingsList';

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

const noop = () => undefined;
const noopShare = (_r: Recording) => undefined;

function uniqueRowTestIds(root: any): string[] {
  const ids = new Set<string>();
  root.findAll((n: any) => {
    const id = n.props?.testID;
    if (typeof id === 'string' && id.startsWith('audio-lab-row-')) ids.add(id);
    return false;
  });
  return [...ids];
}

describe('RecordingsList', () => {

  it('renders the empty-state copy when recordings is empty', () => {
    const view = render(
      <RecordingsList
        recordings={[]}
        onPlay={noop}
        onDelete={noop}
        onShare={noopShare}
      />,
    );
    expect(view.queryByText(/No recordings yet/i)).toBeTruthy();
  });

  it('renders one row per entry with stable keyExtractor (recording.id)', () => {
    const a = makeRecording({ id: 'a', name: 'a.m4a' });
    const b = makeRecording({ id: 'b', name: 'b.m4a' });
    const view = render(
      <RecordingsList
        recordings={[a, b]}
        onPlay={noop}
        onDelete={noop}
        onShare={noopShare}
      />,
    );
    const rowIds = uniqueRowTestIds(view.UNSAFE_root);
    expect(rowIds.toSorted()).toEqual(['audio-lab-row-a', 'audio-lab-row-b']);
    expect(view.queryByText('a.m4a')).toBeTruthy();
    expect(view.queryByText('b.m4a')).toBeTruthy();
  });

  it('passes onPlay / onDelete / onShare callbacks through', () => {
    const onPlay = jest.fn();
    const onDelete = jest.fn();
    const onShare = jest.fn();
    const r = makeRecording({ id: 'a', name: 'a.m4a' });
    const view = render(
      <RecordingsList
        recordings={[r]}
        onPlay={onPlay}
        onDelete={onDelete}
        onShare={onShare}
      />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Play a\.m4a$/));
    expect(onPlay).toHaveBeenCalledWith('a');
    fireEvent.press(findButton(view.UNSAFE_root, /^Share a\.m4a$/));
    expect(onShare).toHaveBeenCalledWith(r);
    fireEvent.press(findButton(view.UNSAFE_root, /^Delete a\.m4a$/));
    expect(onDelete).toHaveBeenCalledWith('a');
  });

  it('FlatList ordering matches the input array order', () => {
    const a = makeRecording({ id: 'a', name: 'newest.m4a', createdAt: '2026-04-28T13:00:00.000Z' });
    const b = makeRecording({ id: 'b', name: 'older.m4a', createdAt: '2026-04-28T12:00:00.000Z' });
    const view = render(
      <RecordingsList
        recordings={[a, b]}
        onPlay={noop}
        onDelete={noop}
        onShare={noopShare}
      />,
    );
    const rowIds = uniqueRowTestIds(view.UNSAFE_root);
    expect(rowIds).toEqual(['audio-lab-row-a', 'audio-lab-row-b']);
  });
});
