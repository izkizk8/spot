/**
 * ContactsLabScreen tests (Android).
 * Feature: 038-contacts
 */

import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/modules/contacts-lab/hooks/useContacts', () => ({
  useContacts: jest.fn(),
}));

import { useContacts } from '@/modules/contacts-lab/hooks/useContacts';
import ContactsLabScreen from '@/modules/contacts-lab/screen.android';

describe('ContactsLabScreen (Android)', () => {
  const mockUseContacts = useContacts as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContacts.mockReturnValue({
      status: 'notDetermined',
      contacts: [],
      hasNextPage: false,
      inFlight: false,
      lastError: null,
      requestPermissions: jest.fn(),
      refresh: jest.fn(),
      loadMore: jest.fn(),
      search: jest.fn(),
      addContact: jest.fn(),
      updateContact: jest.fn(),
      removeContact: jest.fn(),
      getContactById: jest.fn(),
      presentContactPicker: jest.fn(),
      presentLimitedContactsPicker: jest.fn(),
    });
  });

  it('renders AuthorizationCard', () => {
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

  it('does not render LimitedAccessBanner (Android)', () => {
    mockUseContacts.mockReturnValue({
      status: 'limited',
      contacts: [],
      hasNextPage: false,
      inFlight: false,
      lastError: null,
      requestPermissions: jest.fn(),
      refresh: jest.fn(),
      loadMore: jest.fn(),
      search: jest.fn(),
      addContact: jest.fn(),
      updateContact: jest.fn(),
      removeContact: jest.fn(),
      getContactById: jest.fn(),
      presentContactPicker: jest.fn(),
      presentLimitedContactsPicker: jest.fn(),
    });

    const { queryByTestId } = render(<ContactsLabScreen />);
    expect(queryByTestId('contacts-limited-banner')).toBeNull();
  });
});
