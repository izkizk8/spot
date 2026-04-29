/**
 * ContactsList component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ContactsList } from '@/modules/contacts-lab/components/ContactsList';

describe('ContactsList', () => {
  const mockContacts = [
    {
      id: 'c1',
      name: 'Alice Smith',
      givenName: 'Alice',
      familyName: 'Smith',
      phoneNumbers: [{ number: '1234567890', label: 'mobile' }],
    },
    {
      id: 'c2',
      name: 'Bob Jones',
      givenName: 'Bob',
      familyName: 'Jones',
      emails: [{ email: 'bob@example.com', label: 'work' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of contacts', () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getByTestId, getAllByTestId } = render(
      <ContactsList
        contacts={mockContacts}
        hasNextPage={false}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    expect(getByTestId('contacts-list-card')).toBeTruthy();
    const rows = getAllByTestId(/^contact-row-/);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows empty message when no contacts', () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getByText } = render(
      <ContactsList
        contacts={[]}
        hasNextPage={false}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    expect(getByText('No contacts found. Tap Refresh to load contacts.')).toBeTruthy();
  });

  it('calls onRefresh when refresh button pressed', async () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const onSelectContact = jest.fn();

    const { getByTestId } = render(
      <ContactsList
        contacts={[]}
        hasNextPage={false}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    fireEvent.press(getByTestId('contacts-list-refresh-button'));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('shows load more button when hasNextPage is true', () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getByTestId } = render(
      <ContactsList
        contacts={mockContacts}
        hasNextPage={true}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    expect(getByTestId('contacts-list-load-more-button')).toBeTruthy();
  });

  it('calls onLoadMore when load more button pressed', async () => {
    const onLoadMore = jest.fn().mockResolvedValue(undefined);
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getByTestId } = render(
      <ContactsList
        contacts={mockContacts}
        hasNextPage={true}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    fireEvent.press(getByTestId('contacts-list-load-more-button'));

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons when disabled prop is true', () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getByTestId } = render(
      <ContactsList
        contacts={mockContacts}
        hasNextPage={true}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={true}
      />,
    );

    const refreshButton = getByTestId('contacts-list-refresh-button');
    const loadMoreButton = getByTestId('contacts-list-load-more-button');

    expect(refreshButton.props.accessibilityState?.disabled).toBe(true);
    expect(loadMoreButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('calls onSelectContact when contact row pressed', () => {
    const onLoadMore = jest.fn();
    const onRefresh = jest.fn();
    const onSelectContact = jest.fn();

    const { getAllByTestId } = render(
      <ContactsList
        contacts={mockContacts}
        hasNextPage={false}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        onSelectContact={onSelectContact}
        disabled={false}
      />,
    );

    const rows = getAllByTestId(/^contact-row-/);
    fireEvent.press(rows[0]);

    expect(onSelectContact).toHaveBeenCalledWith(mockContacts[0]);
  });
});
