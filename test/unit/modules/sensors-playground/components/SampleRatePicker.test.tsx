/**
 * @file SampleRatePicker.test.tsx
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SampleRatePicker } from '@/modules/sensors-playground/components/SampleRatePicker';

describe('SampleRatePicker', () => {
  it('renders three segments labelled 30 Hz, 60 Hz, 120 Hz', () => {
    const { getByText } = render(<SampleRatePicker value={60} onChange={() => {}} />);
    expect(getByText('30 Hz')).toBeTruthy();
    expect(getByText('60 Hz')).toBeTruthy();
    expect(getByText('120 Hz')).toBeTruthy();
  });

  it('marks the current value as selected', () => {
    const { getByTestId } = render(<SampleRatePicker value={60} onChange={() => {}} />);
    expect(getByTestId('sample-rate-60').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('sample-rate-30').props.accessibilityState.selected).toBe(false);
    expect(getByTestId('sample-rate-120').props.accessibilityState.selected).toBe(false);
  });

  it('calls onChange with the pressed rate', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<SampleRatePicker value={60} onChange={onChange} />);
    fireEvent.press(getByTestId('sample-rate-120'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(120);
  });
});
