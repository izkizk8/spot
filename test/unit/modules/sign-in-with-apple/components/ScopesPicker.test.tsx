/**
 * Test suite for ScopesPicker component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import ScopesPicker from '@/modules/sign-in-with-apple/components/ScopesPicker';

describe('ScopesPicker', () => {
  it('renders both scopes', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ScopesPicker value={{ email: true, fullName: true }} onChange={onChange} />,
    );
    expect(getByTestId('siwa-scope-email')).toBeTruthy();
    expect(getByTestId('siwa-scope-fullName')).toBeTruthy();
  });

  it('calls onChange when email is toggled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ScopesPicker value={{ email: true, fullName: true }} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('siwa-scope-email'));
    expect(onChange).toHaveBeenCalledWith({ email: false, fullName: true });
  });

  it('calls onChange when fullName is toggled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ScopesPicker value={{ email: true, fullName: false }} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('siwa-scope-fullName'));
    expect(onChange).toHaveBeenCalledWith({ email: true, fullName: true });
  });

  it('does not call onChange when disabled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ScopesPicker value={{ email: true, fullName: true }} onChange={onChange} disabled />,
    );
    fireEvent.press(getByTestId('siwa-scope-email'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
