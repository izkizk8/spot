/**
 * PickerCard component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { PickerCard } from '@/modules/contacts-lab/components/PickerCard';

describe('PickerCard', () => {
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

  it('renders picker button', () => {
    const onPick = jest.fn();
    const { getByTestId, getByText } = render(<PickerCard onPick={onPick} disabled={false} />);

    expect(getByTestId('contacts-picker-card')).toBeTruthy();
    expect(getByText('Open contact picker')).toBeTruthy();
  });

  it('shows "No contact selected" initially', () => {
    const onPick = jest.fn();
    const { getByText } = render(<PickerCard onPick={onPick} disabled={false} />);

    expect(getByText('No contact selected')).toBeTruthy();
  });

  it('calls onPick when button pressed', async () => {
    const onPick = jest.fn().mockResolvedValue(mockContact);
    const { getByTestId } = render(<PickerCard onPick={onPick} disabled={false} />);

    fireEvent.press(getByTestId('contacts-picker-button'));

    await waitFor(() => {
      expect(onPick).toHaveBeenCalledTimes(1);
    });
  });

  it('displays selected contact after picking', async () => {
    const onPick = jest.fn().mockResolvedValue(mockContact);
    const { getByTestId, getByText } = render(<PickerCard onPick={onPick} disabled={false} />);

    fireEvent.press(getByTestId('contacts-picker-button'));

    await waitFor(() => {
      expect(getByTestId('contacts-picker-result')).toBeTruthy();
      expect(getByText('Alice Smith')).toBeTruthy();
      expect(getByText(/\(555\) 123-4567/)).toBeTruthy();
      expect(getByText(/alice@example\.com/)).toBeTruthy();
    });
  });

  it('handles null return from picker (cancelled)', async () => {
    const onPick = jest.fn().mockResolvedValue(null);
    const { getByTestId, queryByTestId } = render(<PickerCard onPick={onPick} disabled={false} />);

    fireEvent.press(getByTestId('contacts-picker-button'));

    await waitFor(() => {
      expect(onPick).toHaveBeenCalledTimes(1);
    });

    expect(queryByTestId('contacts-picker-result')).toBeNull();
  });

  it('disables button when disabled prop is true', () => {
    const onPick = jest.fn();
    const { getByTestId } = render(<PickerCard onPick={onPick} disabled={true} />);

    const button = getByTestId('contacts-picker-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows "Opening..." while in flight', async () => {
    let resolvePick: () => void;
    const pickPromise = new Promise<null>((resolve) => {
      resolvePick = () => resolve(null);
    });
    const onPick = jest.fn().mockReturnValue(pickPromise);

    const { getByTestId, getByText } = render(<PickerCard onPick={onPick} disabled={false} />);

    fireEvent.press(getByTestId('contacts-picker-button'));

    await waitFor(() => {
      expect(getByText('Opening...')).toBeTruthy();
    });

    resolvePick!();
    await pickPromise;
  });
});
