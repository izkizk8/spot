/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PayButton from '@/modules/apple-pay-lab/components/PayButton';

describe('PayButton', () => {
  it('fires onPress when pressed and not disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<PayButton onPress={onPress} />);
    fireEvent.press(getByTestId('apple-pay-pay-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<PayButton onPress={onPress} disabled={true} />);
    fireEvent.press(getByTestId('apple-pay-pay-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while loading and renders a spinner', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<PayButton onPress={onPress} loading={true} />);
    fireEvent.press(getByTestId('apple-pay-pay-button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(getByTestId('apple-pay-pay-button-spinner')).toBeTruthy();
  });

  it('reports busy/disabled accessibility state', () => {
    const { getByTestId } = render(<PayButton onPress={() => {}} loading={true} />);
    const btn = getByTestId('apple-pay-pay-button');
    expect(btn.props.accessibilityState.busy).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});
