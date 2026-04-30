/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import CounterActivity from '@/modules/shareplay-lab/components/CounterActivity';

describe('CounterActivity', () => {
  it('renders the current value', () => {
    const { getByTestId } = render(<CounterActivity value={3} onChange={() => {}} />);
    expect(getByTestId('shareplay-counter-value').props.children).toBe(3);
  });

  it('invokes onChange with value+1 when + is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<CounterActivity value={3} onChange={onChange} />);
    fireEvent.press(getByTestId('shareplay-counter-plus'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('invokes onChange with value-1 when – is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<CounterActivity value={3} onChange={onChange} />);
    fireEvent.press(getByTestId('shareplay-counter-minus'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not invoke onChange when disabled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <CounterActivity value={3} onChange={onChange} disabled={true} />,
    );
    fireEvent.press(getByTestId('shareplay-counter-plus'));
    fireEvent.press(getByTestId('shareplay-counter-minus'));
    expect(onChange).not.toHaveBeenCalled();
    expect(getByTestId('shareplay-counter-plus').props.accessibilityState.disabled).toBe(true);
  });
});
