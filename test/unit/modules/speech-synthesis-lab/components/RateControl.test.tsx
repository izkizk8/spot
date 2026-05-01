/**
 * T038: RateControl component tests.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RateControl from '@/modules/speech-synthesis-lab/components/RateControl';

function findSegment(root: any, label: string) {
  return root.findAll(
    (n: any) =>
      n.props &&
      n.props.accessibilityRole === 'button' &&
      n.props.accessibilityLabel === `Rate: ${label}`,
  )[0];
}

describe('RateControl', () => {
  it('renders three segments labelled Slow / Normal / Fast', () => {
    const view = render(<RateControl value='Normal' onChange={jest.fn()} />);
    expect(findSegment(view.UNSAFE_root, 'Slow')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'Normal')).toBeTruthy();
    expect(findSegment(view.UNSAFE_root, 'Fast')).toBeTruthy();
  });

  it('selected segment has accessibilityState.selected === true', () => {
    const view = render(<RateControl value='Fast' onChange={jest.fn()} />);
    const seg = findSegment(view.UNSAFE_root, 'Fast');
    expect(seg.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('tapping a segment invokes onChange exactly once with the enum literal', () => {
    const onChange = jest.fn();
    const view = render(<RateControl value='Normal' onChange={onChange} />);
    fireEvent.press(findSegment(view.UNSAFE_root, 'Slow'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Slow');
  });
});
