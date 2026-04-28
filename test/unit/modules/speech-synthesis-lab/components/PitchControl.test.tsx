/**
 * T039: PitchControl component tests.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PitchControl from '@/modules/speech-synthesis-lab/components/PitchControl';

function findSegment(root: any, label: string) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      n.props.accessibilityLabel === `Pitch: ${label}`,
  )[0];
}

describe('PitchControl', () => {
  it('renders three segments labelled Low / Normal / High', () => {
    const view = render(<PitchControl value="Normal" onChange={jest.fn()} />);
    expect(findSegment(view.UNSAFE_root, 'Low')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'Normal')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'High')).toBeTruthy();
  });

  it('selected segment has accessibilityState.selected === true', () => {
    const view = render(<PitchControl value="High" onChange={jest.fn()} />);
    expect(findSegment(view.UNSAFE_root, 'High').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('tapping a segment invokes onChange with the enum literal', () => {
    const onChange = jest.fn();
    const view = render(<PitchControl value="Normal" onChange={onChange} />);
    fireEvent.press(findSegment(view.UNSAFE_root, 'Low'));
    expect(onChange).toHaveBeenCalledWith('Low');
  });
});
