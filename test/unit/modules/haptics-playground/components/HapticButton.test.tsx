import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  class Keyframe {
    duration() {
      return this;
    }
    delay() {
      return this;
    }
    withCallback() {
      return this;
    }
  }
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
        ReactLib.createElement(View, props, props.children),
    },
    Keyframe,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

jest.mock('@/modules/haptics-playground/haptic-driver', () => ({
  play: jest.fn(() => Promise.resolve()),
}));

import { play } from '@/modules/haptics-playground/haptic-driver';
import { HapticButton } from '@/modules/haptics-playground/components/HapticButton';

describe('HapticButton', () => {
  beforeEach(() => {
    (play as jest.Mock).mockClear();
  });

  it('renders the label', () => {
    const { getByText } = render(<HapticButton kind="impact" intensity="medium" label="Medium" />);
    expect(getByText('Medium')).toBeTruthy();
  });

  it('calls driver.play with (kind, intensity) on press', () => {
    const { getByText } = render(<HapticButton kind="impact" intensity="medium" label="Medium" />);
    fireEvent.press(getByText('Medium'));
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('impact', 'medium');
  });

  it('routes selection without intensity', () => {
    const { getByText } = render(<HapticButton kind="selection" label="Tick" />);
    fireEvent.press(getByText('Tick'));
    expect(play).toHaveBeenCalledWith('selection', undefined);
  });
});
