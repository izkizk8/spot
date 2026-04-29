/**
 * ContactsLabScreen tests (Web).
 * Feature: 038-contacts
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import ContactsLabScreen from '@/modules/contacts-lab/screen.web';

describe('ContactsLabScreen (Web)', () => {
  it('renders IOSOnlyBanner', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-ios-only-banner')).toBeTruthy();
  });

  it('renders AuthorizationCard with stub props', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-auth-card')).toBeTruthy();
  });

  it('renders PickerCard', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-picker-card')).toBeTruthy();
  });

  it('renders SearchCard', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-search-card')).toBeTruthy();
  });

  it('renders ComposeCard', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-compose-card')).toBeTruthy();
  });

  it('renders ContactsList', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    expect(getByTestId('contacts-list-card')).toBeTruthy();
  });

  it('all interactive cards are disabled', () => {
    const { getByTestId } = render(<ContactsLabScreen />);
    
    // All buttons should be disabled on web via accessibilityState
    expect(getByTestId('contacts-picker-button').props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('contacts-list-refresh-button').props.accessibilityState?.disabled).toBe(true);
  });
});
