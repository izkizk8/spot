/**
 * ContactRow component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ContactRow } from '@/modules/contacts-lab/components/ContactRow';

describe('ContactRow', () => {
  const mockContact = {
    id: 'c1',
    name: 'Alice Smith',
    givenName: 'Alice',
    familyName: 'Smith',
    phoneNumbers: [{ number: '5551234567', label: 'mobile' }],
    emails: [{ email: 'alice@example.com', label: 'work' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders contact name', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ContactRow contact={mockContact} onPress={onPress} />);

    expect(getByText('Alice Smith')).toBeTruthy();
  });

  it('renders phone number', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ContactRow contact={mockContact} onPress={onPress} />);

    expect(getByText('(555) 123-4567')).toBeTruthy();
  });

  it('renders email', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ContactRow contact={mockContact} onPress={onPress} />);

    expect(getByText('alice@example.com')).toBeTruthy();
  });

  it('shows "No phone" when phoneNumbers is empty', () => {
    const onPress = jest.fn();
    const contactWithoutPhone = { ...mockContact, phoneNumbers: [] };
    const { getByText } = render(<ContactRow contact={contactWithoutPhone} onPress={onPress} />);

    expect(getByText('No phone')).toBeTruthy();
  });

  it('shows "No email" when emails is empty', () => {
    const onPress = jest.fn();
    const contactWithoutEmail = { ...mockContact, emails: [] };
    const { getByText } = render(<ContactRow contact={contactWithoutEmail} onPress={onPress} />);

    expect(getByText('No email')).toBeTruthy();
  });

  it('calls onPress when row is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ContactRow contact={mockContact} onPress={onPress} />);

    fireEvent.press(getByTestId(`contact-row-${mockContact.id}`));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
