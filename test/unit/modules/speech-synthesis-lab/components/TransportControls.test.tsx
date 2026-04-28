/**
 * T025: TransportControls component tests (FR-019, FR-021).
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import TransportControls from '@/modules/speech-synthesis-lab/components/TransportControls';

function findButtonByLabel(root: any, label: string) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      n.props.accessibilityLabel === label,
  )[0];
}

const noop = () => {};

describe('TransportControls', () => {
  describe("status === 'idle' (canSpeak=true, pauseSupported=true)", () => {
    let root: any;
    beforeEach(() => {
      root = render(
        <TransportControls
          status="idle"
          canSpeak
          pauseSupported
          onSpeak={noop}
          onPause={noop}
          onContinue={noop}
          onStop={noop}
        />,
      ).UNSAFE_root;
    });

    it('Speak enabled, others disabled', () => {
      expect(findButtonByLabel(root, 'Speak').props.accessibilityState.disabled).toBe(false);
      expect(findButtonByLabel(root, 'Pause').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Continue').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Stop').props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("status === 'speaking'", () => {
    let root: any;
    beforeEach(() => {
      root = render(
        <TransportControls
          status="speaking"
          canSpeak
          pauseSupported
          onSpeak={noop}
          onPause={noop}
          onContinue={noop}
          onStop={noop}
        />,
      ).UNSAFE_root;
    });

    it('Speak disabled; Pause + Stop enabled; Continue disabled', () => {
      expect(findButtonByLabel(root, 'Speak').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Pause').props.accessibilityState.disabled).toBe(false);
      expect(findButtonByLabel(root, 'Continue').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Stop').props.accessibilityState.disabled).toBe(false);
    });
  });

  describe("status === 'paused'", () => {
    let root: any;
    beforeEach(() => {
      root = render(
        <TransportControls
          status="paused"
          canSpeak
          pauseSupported
          onSpeak={noop}
          onPause={noop}
          onContinue={noop}
          onStop={noop}
        />,
      ).UNSAFE_root;
    });

    it('Speak + Pause disabled; Continue + Stop enabled', () => {
      expect(findButtonByLabel(root, 'Speak').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Pause').props.accessibilityState.disabled).toBe(true);
      expect(findButtonByLabel(root, 'Continue').props.accessibilityState.disabled).toBe(false);
      expect(findButtonByLabel(root, 'Stop').props.accessibilityState.disabled).toBe(false);
    });
  });

  describe('pauseSupported === false', () => {
    it('Pause + Continue rendered disabled in every state', () => {
      for (const status of ['idle', 'speaking', 'paused'] as const) {
        const root = render(
          <TransportControls
            status={status}
            canSpeak
            pauseSupported={false}
            onSpeak={noop}
            onPause={noop}
            onContinue={noop}
            onStop={noop}
          />,
        ).UNSAFE_root;
        expect(findButtonByLabel(root, 'Pause').props.accessibilityState.disabled).toBe(true);
        expect(findButtonByLabel(root, 'Continue').props.accessibilityState.disabled).toBe(true);
      }
    });
  });

  it('each enabled button invokes its callback exactly once on tap; disabled is no-op', () => {
    const onSpeak = jest.fn();
    const onPause = jest.fn();
    const onContinue = jest.fn();
    const onStop = jest.fn();
    const view = render(
      <TransportControls
        status="speaking"
        canSpeak
        pauseSupported
        onSpeak={onSpeak}
        onPause={onPause}
        onContinue={onContinue}
        onStop={onStop}
      />,
    );
    fireEvent.press(findButtonByLabel(view.UNSAFE_root, 'Speak')); // disabled
    fireEvent.press(findButtonByLabel(view.UNSAFE_root, 'Pause'));
    fireEvent.press(findButtonByLabel(view.UNSAFE_root, 'Continue')); // disabled
    fireEvent.press(findButtonByLabel(view.UNSAFE_root, 'Stop'));
    expect(onSpeak).not.toHaveBeenCalled();
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('canSpeak=false keeps Speak disabled even when status === idle', () => {
    const root = render(
      <TransportControls
        status="idle"
        canSpeak={false}
        pauseSupported
        onSpeak={noop}
        onPause={noop}
        onContinue={noop}
        onStop={noop}
      />,
    ).UNSAFE_root;
    expect(findButtonByLabel(root, 'Speak').props.accessibilityState.disabled).toBe(true);
  });
});
