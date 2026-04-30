/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import RestoreButton from '@/modules/storekit-lab/components/RestoreButton';

describe('RestoreButton', () => {
  it('fires onPress when pressed and not disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RestoreButton onPress={onPress} />);
    fireEvent.press(getByTestId('storekit-restore-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RestoreButton onPress={onPress} disabled={true} />);
    fireEvent.press(getByTestId('storekit-restore-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while loading and renders a spinner', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RestoreButton onPress={onPress} loading={true} />);
    fireEvent.press(getByTestId('storekit-restore-button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(getByTestId('storekit-restore-button-spinner')).toBeTruthy();
  });

  it('reports busy/disabled accessibility state', () => {
    const { getByTestId } = render(<RestoreButton onPress={() => {}} loading={true} />);
    const btn = getByTestId('storekit-restore-button');
    expect(btn.props.accessibilityState.busy).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});
