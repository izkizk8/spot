/**
 * ActionRow tests.
 * Feature: 039-quick-actions
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ActionRow } from '@/modules/quick-actions-lab/components/ActionRow';

describe('ActionRow', () => {
  it('renders title, subtitle, route, and icon placeholder', () => {
    const { getByText, getByTestId } = render(
      <ActionRow
        title='Open Sensors'
        subtitle='Motion & device data'
        iconName='gauge'
        route='/modules/sensors-playground'
      />,
    );
    expect(getByText('Open Sensors')).toBeTruthy();
    expect(getByText('Motion & device data')).toBeTruthy();
    expect(getByText('/modules/sensors-playground')).toBeTruthy();
    expect(getByTestId('action-row-icon')).toBeTruthy();
  });

  it('calls onPress when not disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ActionRow title='t' iconName='i' route='/r' onPress={onPress} testID='row-active' />,
    );
    fireEvent.press(getByTestId('row-active'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ActionRow
        title='t'
        iconName='i'
        route='/r'
        onPress={onPress}
        disabled
        testID='row-disabled'
      />,
    );
    fireEvent.press(getByTestId('row-disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
