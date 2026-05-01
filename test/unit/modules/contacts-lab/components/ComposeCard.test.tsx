/**
 * ComposeCard component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ComposeCard } from '@/modules/contacts-lab/components/ComposeCard';

describe('ComposeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields and save button', () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<ComposeCard onSave={onSave} disabled={false} />);

    expect(getByTestId('contacts-compose-card')).toBeTruthy();
    expect(getByTestId('contacts-compose-given-name')).toBeTruthy();
    expect(getByTestId('contacts-compose-family-name')).toBeTruthy();
    expect(getByTestId('contacts-compose-phone')).toBeTruthy();
    expect(getByTestId('contacts-compose-email')).toBeTruthy();
    expect(getByTestId('contacts-compose-company')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('updates given name when text is entered', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<ComposeCard onSave={onSave} disabled={false} />);

    const input = getByTestId('contacts-compose-given-name');
    fireEvent.changeText(input, 'Alice');

    expect(input.props.value).toBe('Alice');
  });

  it('calls onSave with correct data when button pressed', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ComposeCard onSave={onSave} disabled={false} />);

    fireEvent.changeText(getByTestId('contacts-compose-given-name'), 'Alice');
    fireEvent.changeText(getByTestId('contacts-compose-family-name'), 'Smith');
    fireEvent.changeText(getByTestId('contacts-compose-phone'), '5551234567');
    fireEvent.changeText(getByTestId('contacts-compose-email'), 'alice@example.com');
    fireEvent.changeText(getByTestId('contacts-compose-company'), 'Acme Corp');

    fireEvent.press(getByTestId('contacts-compose-save-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        givenName: 'Alice',
        familyName: 'Smith',
        phoneNumbers: [{ number: '5551234567' }],
        emails: [{ email: 'alice@example.com' }],
        company: 'Acme Corp',
      });
    });
  });

  it('clears fields after successful save', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ComposeCard onSave={onSave} disabled={false} />);

    fireEvent.changeText(getByTestId('contacts-compose-given-name'), 'Alice');
    fireEvent.changeText(getByTestId('contacts-compose-phone'), '5551234567');

    fireEvent.press(getByTestId('contacts-compose-save-button'));

    await waitFor(() => {
      expect(getByTestId('contacts-compose-given-name').props.value).toBe('');
      expect(getByTestId('contacts-compose-phone').props.value).toBe('');
    });
  });

  it('does not call onSave when all fields are empty', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ComposeCard onSave={onSave} disabled={false} />);

    fireEvent.press(getByTestId('contacts-compose-save-button'));

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('disables all inputs and button when disabled prop is true', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<ComposeCard onSave={onSave} disabled={true} />);

    expect(getByTestId('contacts-compose-given-name').props.editable).toBe(false);
    expect(getByTestId('contacts-compose-family-name').props.editable).toBe(false);
    expect(getByTestId('contacts-compose-phone').props.editable).toBe(false);
    expect(getByTestId('contacts-compose-email').props.editable).toBe(false);
    expect(getByTestId('contacts-compose-company').props.editable).toBe(false);
    expect(getByTestId('contacts-compose-save-button').props.accessibilityState?.disabled).toBe(
      true,
    );
  });

  it('shows "Saving..." while in flight', async () => {
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const onSave = jest.fn().mockReturnValue(savePromise);

    const { getByTestId, getByText } = render(<ComposeCard onSave={onSave} disabled={false} />);

    fireEvent.changeText(getByTestId('contacts-compose-given-name'), 'Test');
    fireEvent.press(getByTestId('contacts-compose-save-button'));

    await waitFor(() => {
      expect(getByText('Saving...')).toBeTruthy();
    });

    resolveSave!();
    await savePromise;
  });
});
