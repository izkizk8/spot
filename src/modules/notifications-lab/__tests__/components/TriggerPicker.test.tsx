import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TriggerPicker } from '../../components/TriggerPicker';

describe('TriggerPicker', () => {
  it('renders 5 trigger segments', () => {
    const { getByText } = render(
      <TriggerPicker
        value={{ kind: 'immediate' }}
        onChange={jest.fn()}
        locationAuthorized={true}
      />,
    );
    expect(getByText(/immediate/i)).toBeTruthy();
    expect(getByText(/seconds/i)).toBeTruthy();
    expect(getByText(/specific time/i)).toBeTruthy();
    expect(getByText(/daily/i)).toBeTruthy();
    expect(getByText(/region/i)).toBeTruthy();
  });

  it('validates N >= 1 for in-seconds', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TriggerPicker
        value={{ kind: 'in-seconds', seconds: 0 }}
        onChange={onChange}
        locationAuthorized={true}
      />,
    );
    // Should show validation message
    expect(getByTestId('validation-error')).toBeTruthy();
  });

  it('disables region-entry when location not authorized', () => {
    const { getByText } = render(
      <TriggerPicker
        value={{ kind: 'immediate' }}
        onChange={jest.fn()}
        locationAuthorized={false}
      />,
    );
    const regionButton = getByText(/region/i);
    expect(regionButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows tooltip when region-entry disabled', () => {
    const { getByText } = render(
      <TriggerPicker
        value={{ kind: 'immediate' }}
        onChange={jest.fn()}
        locationAuthorized={false}
      />,
    );
    expect(getByText(/location permission/i)).toBeTruthy();
  });
});
