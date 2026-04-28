/**
 * T052 [US4]: AudioSessionCard component tests.
 *
 * Covers the 5-segment category picker, the Apply flow's stop-before-apply
 * invariants (FR-024 / FR-025 / D-09), the Web tooltip variant (FR-045 /
 * R-007), and the active-category status pill.
 */

import React from 'react';
import { fireEvent, render, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

import AudioSessionCard from '@/modules/audio-lab/components/AudioSessionCard';
import type {
  AudioSessionCategory,
  PlayerState,
  RecorderState,
} from '@/modules/audio-lab/audio-types';

function findButton(root: any, label: RegExp) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      label.test(String(n.props.accessibilityLabel ?? '')),
  )[0];
}

function findAllButtons(root: any, label: RegExp) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      label.test(String(n.props.accessibilityLabel ?? '')),
  );
}

function findByTestId(root: any, id: string) {
  return root.findAll((n: any) => n.props && n.props.testID === id)[0];
}

function setPlatform(os: 'ios' | 'android' | 'web') {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

const noop = () => undefined;
const asyncNoop = async () => undefined;

const ALL_CATEGORIES: ReadonlyArray<AudioSessionCategory> = [
  'Playback',
  'Record',
  'PlayAndRecord',
  'Ambient',
  'SoloAmbient',
];

interface RenderOpts {
  selected?: AudioSessionCategory;
  activeCategory?: AudioSessionCategory;
  recorderStatus?: RecorderState;
  playerStatus?: PlayerState;
  onSelect?: (c: AudioSessionCategory) => void;
  onApply?: (c: AudioSessionCategory) => void | Promise<void>;
  onStopRecorder?: () => Promise<unknown> | void;
  onStopPlayer?: () => Promise<unknown> | void;
}

function renderCard(opts: RenderOpts = {}) {
  return render(
    <AudioSessionCard
      selected={opts.selected ?? 'Playback'}
      activeCategory={opts.activeCategory ?? 'Playback'}
      recorderStatus={opts.recorderStatus ?? 'idle'}
      playerStatus={opts.playerStatus ?? 'idle'}
      onSelect={opts.onSelect ?? noop}
      onApply={opts.onApply ?? noop}
      onStopRecorder={opts.onStopRecorder ?? asyncNoop}
      onStopPlayer={opts.onStopPlayer ?? asyncNoop}
    />,
  );
}

describe('AudioSessionCard', () => {
  beforeEach(() => {
    setPlatform('ios');
  });

  // -------------------------------------------------------------------------
  // Rendering — 5-segment picker
  // -------------------------------------------------------------------------

  it('renders all 5 category segments', () => {
    const view = renderCard();
    for (const cat of ALL_CATEGORIES) {
      const btn = findButton(view.UNSAFE_root, new RegExp(`^Category: ${cat}$`));
      expect(btn).toBeTruthy();
    }
  });

  it('marks the `selected` segment via accessibilityState.selected', () => {
    const view = renderCard({ selected: 'PlayAndRecord' });
    for (const cat of ALL_CATEGORIES) {
      const btn = findButton(view.UNSAFE_root, new RegExp(`^Category: ${cat}$`));
      expect(btn.props.accessibilityState.selected).toBe(cat === 'PlayAndRecord');
    }
  });

  it('tapping a segment invokes onSelect with that category', () => {
    const onSelect = jest.fn();
    const view = renderCard({ selected: 'Playback', onSelect });
    fireEvent.press(findButton(view.UNSAFE_root, /^Category: Record$/));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Record');
    fireEvent.press(findButton(view.UNSAFE_root, /^Category: SoloAmbient$/));
    expect(onSelect).toHaveBeenCalledWith('SoloAmbient');
  });

  // -------------------------------------------------------------------------
  // Status pill
  // -------------------------------------------------------------------------

  it('status pill displays the activeCategory', () => {
    const view = renderCard({ activeCategory: 'Ambient' });
    const pill = findByTestId(view.UNSAFE_root, 'audio-session-active-pill');
    expect(pill).toBeTruthy();
    // The accessibilityLabel is the stable contract; the visible <ThemedText>
    // child carries the same value but lives inside a fiber subtree we don't
    // walk here to avoid touching React internals.
    expect(String(pill.props.accessibilityLabel)).toContain('Ambient');
  });

  // -------------------------------------------------------------------------
  // Apply button — happy path
  // -------------------------------------------------------------------------

  it('renders an Apply button on iOS', () => {
    const view = renderCard();
    expect(findButton(view.UNSAFE_root, /^Apply audio session category$/)).toBeTruthy();
  });

  it('tapping Apply invokes onApply(selected) exactly once when idle', async () => {
    const onApply = jest.fn();
    const view = renderCard({ selected: 'Record', onApply });
    await act(async () => {
      fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('Record');
  });

  // -------------------------------------------------------------------------
  // Stop-before-apply (FR-024 / FR-025 / D-09)
  // -------------------------------------------------------------------------

  it('stops the recorder before invoking onApply when recorderStatus === recording', async () => {
    const order: string[] = [];
    const onStopRecorder = jest.fn(async () => {
      order.push('stopRecorder');
    });
    const onApply = jest.fn(() => {
      order.push('apply');
    });
    const view = renderCard({
      selected: 'Playback',
      recorderStatus: 'recording',
      onStopRecorder,
      onApply,
    });
    await act(async () => {
      fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onStopRecorder).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['stopRecorder', 'apply']);
  });

  it('stops the player before invoking onApply when playerStatus === playing', async () => {
    const order: string[] = [];
    const onStopPlayer = jest.fn(async () => {
      order.push('stopPlayer');
    });
    const onApply = jest.fn(() => {
      order.push('apply');
    });
    const view = renderCard({
      selected: 'Playback',
      playerStatus: 'playing',
      onStopPlayer,
      onApply,
    });
    await act(async () => {
      fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onStopPlayer).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['stopPlayer', 'apply']);
  });

  it.each<PlayerState>(['paused', 'loading'])(
    'also stops the player when playerStatus === %s (FR-025)',
    async (state) => {
      const onStopPlayer = jest.fn(async () => undefined);
      const onApply = jest.fn();
      const view = renderCard({
        playerStatus: state,
        onStopPlayer,
        onApply,
      });
      await act(async () => {
        fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(onStopPlayer).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledTimes(1);
    },
  );

  it('does NOT call stop callbacks when neither is active', async () => {
    const onStopRecorder = jest.fn(async () => undefined);
    const onStopPlayer = jest.fn(async () => undefined);
    const onApply = jest.fn();
    const view = renderCard({
      recorderStatus: 'idle',
      playerStatus: 'idle',
      onStopRecorder,
      onStopPlayer,
      onApply,
    });
    await act(async () => {
      fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onStopRecorder).not.toHaveBeenCalled();
    expect(onStopPlayer).not.toHaveBeenCalled();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('stops both recorder and player when both are active before apply', async () => {
    const order: string[] = [];
    const onStopRecorder = jest.fn(async () => {
      order.push('stopRecorder');
    });
    const onStopPlayer = jest.fn(async () => {
      order.push('stopPlayer');
    });
    const onApply = jest.fn(() => {
      order.push('apply');
    });
    const view = renderCard({
      recorderStatus: 'recording',
      playerStatus: 'playing',
      onStopRecorder,
      onStopPlayer,
      onApply,
    });
    await act(async () => {
      fireEvent.press(findButton(view.UNSAFE_root, /^Apply audio session category$/));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(order[order.length - 1]).toBe('apply');
    expect(order).toContain('stopRecorder');
    expect(order).toContain('stopPlayer');
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Web variant (FR-045 / R-007)
  // -------------------------------------------------------------------------

  describe('on web', () => {
    beforeEach(() => {
      setPlatform('web');
    });

    it('does NOT render an Apply button', () => {
      const view = renderCard();
      const matches = findAllButtons(view.UNSAFE_root, /^Apply audio session category$/);
      expect(matches.length).toBe(0);
    });

    it('renders an informational tooltip element instead', () => {
      const view = renderCard();
      const tooltip = findByTestId(view.UNSAFE_root, 'audio-session-web-tooltip');
      expect(tooltip).toBeTruthy();
    });

    it('still renders all 5 category segments and forwards onSelect', () => {
      const onSelect = jest.fn();
      const view = renderCard({ onSelect });
      for (const cat of ALL_CATEGORIES) {
        expect(
          findButton(view.UNSAFE_root, new RegExp(`^Category: ${cat}$`)),
        ).toBeTruthy();
      }
      fireEvent.press(findButton(view.UNSAFE_root, /^Category: Record$/));
      expect(onSelect).toHaveBeenCalledWith('Record');
    });

    it('never invokes onApply, even when stop callbacks would otherwise gate it', async () => {
      const onApply = jest.fn();
      const onStopRecorder = jest.fn(async () => undefined);
      const onStopPlayer = jest.fn(async () => undefined);
      const view = renderCard({
        recorderStatus: 'recording',
        playerStatus: 'playing',
        onApply,
        onStopRecorder,
        onStopPlayer,
      });
      // No Apply button to press; tapping a segment must not trigger apply.
      fireEvent.press(findButton(view.UNSAFE_root, /^Category: PlayAndRecord$/));
      await act(async () => {
        await Promise.resolve();
      });
      expect(onApply).not.toHaveBeenCalled();
    });
  });
});
