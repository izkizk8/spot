/**
 * T030: MicButton component test (US1).
 *
 * Coverage:
 *   - Idle vs listening visual states from `listening` prop
 *   - Pulse animation enabled when `listening && !reduceMotion`
 *   - Reduced-motion short-circuits to a static "active" indicator
 *   - `onPress` invoked exactly once on tap
 *   - `disabled` prop renders inert; tap is a no-op
 *   - accessibilityRole="button" + accessibilityState={ disabled, selected: listening }
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@/hooks/useReducedMotion', () => ({
  __esModule: true,
  useReducedMotion: jest.fn(() => false),
}));

import MicButton from '@/modules/speech-recognition-lab/components/MicButton';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function findPressables(root: any) {
  return root.findAll((n: any) => Boolean(n.props && n.props.accessibilityRole === 'button'));
}

describe('MicButton', () => {
  beforeEach(() => {
    (useReducedMotion as jest.Mock).mockReset();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  it('renders without crashing in idle state', () => {
    expect(() => render(<MicButton listening={false} onPress={jest.fn()} />)).not.toThrow();
  });

  it('renders without crashing in listening state', () => {
    expect(() => render(<MicButton listening={true} onPress={jest.fn()} />)).not.toThrow();
  });

  it('produces a different rendered tree for idle vs listening', () => {
    const idle = render(<MicButton listening={false} onPress={jest.fn()} />);
    const listening = render(<MicButton listening={true} onPress={jest.fn()} />);
    expect(JSON.stringify(idle.toJSON())).not.toBe(JSON.stringify(listening.toJSON()));
  });

  it('reads useReducedMotion() to decide whether to animate when listening', () => {
    render(<MicButton listening={true} onPress={jest.fn()} />);
    expect(useReducedMotion).toHaveBeenCalled();
  });

  it('does not crash when reduced-motion is true while listening (static indicator)', () => {
    (useReducedMotion as jest.Mock).mockReturnValue(true);
    expect(() => render(<MicButton listening={true} onPress={jest.fn()} />)).not.toThrow();
  });

  it('invokes onPress exactly once on tap', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(<MicButton listening={false} onPress={onPress} />);
    const buttons = findPressables(UNSAFE_root);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.press(buttons[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is inert when disabled — tap does not fire onPress', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(<MicButton listening={false} disabled onPress={onPress} />);
    const buttons = findPressables(UNSAFE_root);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.press(buttons[0]);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes accessibilityRole="button"', () => {
    const { UNSAFE_root } = render(<MicButton listening={false} onPress={jest.fn()} />);
    expect(findPressables(UNSAFE_root).length).toBeGreaterThan(0);
  });

  it('exposes accessibilityState reflecting disabled + selected (listening)', () => {
    const { UNSAFE_root } = render(
      <MicButton listening={true} disabled={false} onPress={jest.fn()} />,
    );
    const buttons = findPressables(UNSAFE_root);
    const state = buttons[0].props.accessibilityState;
    expect(state).toBeTruthy();
    expect(state.selected).toBe(true);
    expect(state.disabled).toBe(false);
  });

  it('accessibilityState.selected reflects listening=false correctly', () => {
    const { UNSAFE_root } = render(<MicButton listening={false} onPress={jest.fn()} />);
    const buttons = findPressables(UNSAFE_root);
    const state = buttons[0].props.accessibilityState;
    expect(state.selected).toBe(false);
  });

  it('accessibilityState.disabled reflects disabled=true correctly', () => {
    const { UNSAFE_root } = render(<MicButton listening={false} disabled onPress={jest.fn()} />);
    const buttons = findPressables(UNSAFE_root);
    const state = buttons[0].props.accessibilityState;
    expect(state.disabled).toBe(true);
  });
});
