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
});
