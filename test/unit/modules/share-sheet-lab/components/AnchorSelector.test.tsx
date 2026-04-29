/**
 * Tests for AnchorSelector — feature 033 / T021.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import AnchorSelector from '@/modules/share-sheet-lab/components/AnchorSelector';

describe('AnchorSelector', () => {
  beforeEach(() => {
    // Reset Platform.OS before each test
    Platform.OS = 'android';
  });

  it('renders 4 buttons', () => {
    Platform.OS = 'ios';
    const { getAllByRole } = render(<AnchorSelector onAnchorChange={() => {}} />);

    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('selecting each propagates the latest AnchorRect from the most recent onLayout event', () => {
    Platform.OS = 'ios';
    const onAnchorChange = jest.fn();
    const { getAllByRole } = render(<AnchorSelector onAnchorChange={onAnchorChange} />);

    const buttons = getAllByRole('button');

    // Simulate layout event for first button
    fireEvent(buttons[0], 'layout', {
      nativeEvent: { layout: { x: 10, y: 20, width: 44, height: 44 } },
    });

    // Press the first button
    fireEvent.press(buttons[0]);

    expect(onAnchorChange).toHaveBeenCalledTimes(1);
    expect(onAnchorChange.mock.calls[0][0]).toEqual({
      x: 10,
      y: 20,
      width: 44,
      height: 44,
    });
  });

  it('returns null when Platform.OS is not ios', () => {
    Platform.OS = 'android';
    const onAnchorChange = jest.fn();
    const { toJSON } = render(<AnchorSelector onAnchorChange={onAnchorChange} />);

    // Component returns null, so toJSON should be null
    expect(toJSON()).toBeNull();
  });
});
