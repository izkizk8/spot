/**
 * SearchCard component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { SearchCard } from '@/modules/contacts-lab/components/SearchCard';

describe('SearchCard', () => {
  const mockResults = [
    {
      id: 'c1',
      name: 'Alice Smith',
      givenName: 'Alice',
      familyName: 'Smith',
      phoneNumbers: [{ number: '5551234567', label: 'mobile' }],
      emails: [{ email: 'alice@example.com', label: 'work' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input and button', () => {
    const onSearch = jest.fn();
    const { getByTestId, getByText } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    expect(getByTestId('contacts-search-card')).toBeTruthy();
    expect(getByTestId('contacts-search-input')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
  });

  it('updates query when text is entered', () => {
    const onSearch = jest.fn();
    const { getByTestId } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    const input = getByTestId('contacts-search-input');
    fireEvent.changeText(input, 'Alice');

    expect(input.props.value).toBe('Alice');
  });

  it('calls onSearch when button pressed with valid query', async () => {
    const onSearch = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    const input = getByTestId('contacts-search-input');
    fireEvent.changeText(input, 'Alice');

    const button = getByTestId('contacts-search-button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('Alice');
    });
  });

  it('disables button when query is empty', () => {
    const onSearch = jest.fn();
    const { getByTestId } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    const button = getByTestId('contacts-search-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables input and button when disabled prop is true', () => {
    const onSearch = jest.fn();
    const { getByTestId } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={true} />,
    );

    const input = getByTestId('contacts-search-input');
    const button = getByTestId('contacts-search-button');

    expect(input.props.editable).toBe(false);
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('renders search results when provided', () => {
    const onSearch = jest.fn();
    const { getByTestId, getByText } = render(
      <SearchCard onSearch={onSearch} results={mockResults} disabled={false} />,
    );

    expect(getByTestId('contacts-search-results')).toBeTruthy();
    expect(getByText('Alice Smith')).toBeTruthy();
  });

  it('shows "No contacts found" when results are empty and query exists', () => {
    const onSearch = jest.fn();
    const { getByTestId, getByText } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    const input = getByTestId('contacts-search-input');
    fireEvent.changeText(input, 'Bob');

    expect(getByText('No contacts found')).toBeTruthy();
  });

  it('shows "Searching..." while in flight', async () => {
    let resolveSearch: () => void;
    const searchPromise = new Promise<void>((resolve) => {
      resolveSearch = resolve;
    });
    const onSearch = jest.fn().mockReturnValue(searchPromise);

    const { getByTestId, getByText } = render(
      <SearchCard onSearch={onSearch} results={[]} disabled={false} />,
    );

    const input = getByTestId('contacts-search-input');
    fireEvent.changeText(input, 'Test');

    const button = getByTestId('contacts-search-button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(getByText('Searching...')).toBeTruthy();
    });

    resolveSearch!();
    await searchPromise;
  });
});
