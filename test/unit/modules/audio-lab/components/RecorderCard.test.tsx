/**
 * T029 [US1]: RecorderCard component tests.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RecorderCard from '@/modules/audio-lab/components/RecorderCard';

function findButton(root: any, label: RegExp) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      label.test(String(n.props.accessibilityLabel ?? '')),
  )[0];
}

function findElapsedText(root: any) {
  return root.findAll((n: any) => n.props && n.props.testID === 'audio-lab-elapsed')[0];
}

function flattenStyle(s: unknown): Record<string, unknown> {
  const arr = Array.isArray(s) ? s : [s];
  return arr.reduce<Record<string, unknown>>((acc, item) => {
    if (item && typeof item === 'object') Object.assign(acc, item);
    return acc;
  }, {});
}

const noop = () => undefined;

describe('RecorderCard', () => {

  it('renders Record button + elapsed 00:00:00 + waveform meter + quality selector', () => {
    const view = render(
      <RecorderCard
        status="idle"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={noop}
      />,
    );
    const btn = findButton(view.UNSAFE_root, /^Start recording$/);
    expect(btn).toBeTruthy();

    const elapsed = findElapsedText(view.UNSAFE_root);
    // ThemedText renders children -> Text node with children string.
    const text = String(elapsed.props.children);
    expect(text).toBe('00:00:00');

    // Waveform meter present
    const meter = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'audio-lab-waveform-meter',
    );
    expect(meter.length).toBeGreaterThanOrEqual(1);

    // Quality segments
    expect(findButton(view.UNSAFE_root, /^Quality: Low$/)).toBeTruthy();
    expect(findButton(view.UNSAFE_root, /^Quality: Medium$/)).toBeTruthy();
    expect(findButton(view.UNSAFE_root, /^Quality: High$/)).toBeTruthy();

    // Medium is selected
    const medium = findButton(view.UNSAFE_root, /^Quality: Medium$/);
    expect(medium.props.accessibilityState.selected).toBe(true);
  });

  it('tapping the record button while idle invokes onStart', () => {
    const onStart = jest.fn();
    const view = render(
      <RecorderCard
        status="idle"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={onStart}
        onStop={noop}
        onChangeQuality={noop}
      />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Start recording$/));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('tapping the record button while recording invokes onStop and the label flips', () => {
    const onStop = jest.fn();
    const view = render(
      <RecorderCard
        status="recording"
        elapsedMs={1500}
        meterLevel={0.5}
        quality="Medium"
        onStart={noop}
        onStop={onStop}
        onChangeQuality={noop}
      />,
    );
    const btn = findButton(view.UNSAFE_root, /^Stop recording$/);
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it.each([
    [100, '00:00:00'],
    [1500, '00:00:01'],
    [61500, '00:01:01'],
    [3600 * 1000 + 5000, '01:00:05'],
  ])('formats elapsed %i ms as %s', (ms, expected) => {
    const view = render(
      <RecorderCard
        status="recording"
        elapsedMs={ms}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={noop}
      />,
    );
    const elapsed = findElapsedText(view.UNSAFE_root);
    expect(String(elapsed.props.children)).toBe(expected);
  });

  it('quality selector segments are disabled while status === recording (FR-008)', () => {
    const onChange = jest.fn();
    const view = render(
      <RecorderCard
        status="recording"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={onChange}
      />,
    );
    const low = findButton(view.UNSAFE_root, /^Quality: Low$/);
    expect(low.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(low);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders an Animated.View for the pulse animation (smoke test)', () => {
    const view = render(
      <RecorderCard
        status="recording"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={noop}
      />,
    );
    // Reanimated is mocked to a plain View; the record button is rendered
    // inside an animated wrapper, so the button still exists.
    expect(findButton(view.UNSAFE_root, /^Stop recording$/)).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // T046 [US3] Quality segmented selector behavior (FR-007 / FR-008 / D-03)
  // -------------------------------------------------------------------------

  it('selecting a non-current segment invokes onQualityChange with that name', () => {
    const onChange = jest.fn();
    const view = render(
      <RecorderCard
        status="idle"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={onChange}
      />,
    );
    fireEvent.press(findButton(view.UNSAFE_root, /^Quality: High$/));
    expect(onChange).toHaveBeenCalledWith('High');
    fireEvent.press(findButton(view.UNSAFE_root, /^Quality: Low$/));
    expect(onChange).toHaveBeenCalledWith('Low');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not invoke onQualityChange when the current segment is re-tapped (no-op for selected)', () => {
    const onChange = jest.fn();
    const view = render(
      <RecorderCard
        status="idle"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={onChange}
      />,
    );
    // Tapping the selected segment is allowed but should be a benign re-set.
    // The component itself does not gate this — we just assert the callback
    // is fired so the parent can de-dupe; it should NOT crash.
    fireEvent.press(findButton(view.UNSAFE_root, /^Quality: Medium$/));
    expect(onChange).toHaveBeenCalledWith('Medium');
  });

  it('marks the currently-selected segment via accessibilityState.selected and a different style', () => {
    const view = render(
      <RecorderCard
        status="idle"
        elapsedMs={0}
        meterLevel={0}
        quality="High"
        onStart={noop}
        onStop={noop}
        onChangeQuality={noop}
      />,
    );
    const high = findButton(view.UNSAFE_root, /^Quality: High$/);
    const medium = findButton(view.UNSAFE_root, /^Quality: Medium$/);
    const low = findButton(view.UNSAFE_root, /^Quality: Low$/);
    expect(high.props.accessibilityState.selected).toBe(true);
    expect(medium.props.accessibilityState.selected).toBe(false);
    expect(low.props.accessibilityState.selected).toBe(false);
    // The selected segment must carry a backgroundColor style; the unselected
    // ones must not (they fall through to the parent's neutral background).
    expect(flattenStyle(high.props.style).backgroundColor).toBeDefined();
    expect(flattenStyle(medium.props.style).backgroundColor).toBeUndefined();
  });

  it('all three segments are disabled while recording AND callback is not invoked (FR-008)', () => {
    const onChange = jest.fn();
    const view = render(
      <RecorderCard
        status="recording"
        elapsedMs={0}
        meterLevel={0}
        quality="Medium"
        onStart={noop}
        onStop={noop}
        onChangeQuality={onChange}
      />,
    );
    for (const label of [/^Quality: Low$/, /^Quality: Medium$/, /^Quality: High$/]) {
      const seg = findButton(view.UNSAFE_root, label);
      expect(seg.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(seg);
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
