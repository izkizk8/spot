/**
 * T040: VolumeControl component tests.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import VolumeControl from '@/modules/speech-synthesis-lab/components/VolumeControl';

function findSegment(root: any, label: string) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      n.props.accessibilityLabel === `Volume: ${label}`,
  )[0];
}

describe('VolumeControl', () => {
  it('renders three segments labelled Low / Normal / High', () => {
    const view = render(<VolumeControl value='Normal' onChange={jest.fn()} />);
    expect(findSegment(view.UNSAFE_root, 'Low')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'Normal')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'High')).toBeTruthy();
  });

  it('selected segment is reflected via accessibilityState', () => {
    const view = render(<VolumeControl value='Low' onChange={jest.fn()} />);
    expect(findSegment(view.UNSAFE_root, 'Low').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('tapping a segment invokes onChange with the enum literal', () => {
    const onChange = jest.fn();
    const view = render(<VolumeControl value='Normal' onChange={onChange} />);
    fireEvent.press(findSegment(view.UNSAFE_root, 'High'));
    expect(onChange).toHaveBeenCalledWith('High');
  });
});
