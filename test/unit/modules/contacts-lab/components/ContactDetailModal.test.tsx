/**
 * ContactDetailModal component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert');

import { ContactDetailModal } from '@/modules/contacts-lab/components/ContactDetailModal';

describe('ContactDetailModal', () => {
  const mockContact = {
    id: 'c1',
    name: 'Alice Smith',
    givenName: 'Alice',
    familyName: 'Smith',
    phoneNumbers: [{ number: '5551234567', label: 'mobile' }],
    emails: [{ email: 'alice@example.com', label: 'work' }],
    company: 'Acme Corp',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when contact is null', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { queryByTestId } = render(
      <ContactDetailModal
        contact={null}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(queryByTestId('contacts-detail-modal')).toBeNull();
  });

  it('renders contact details in view mode', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId, getByText } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(getByTestId('contacts-detail-modal')).toBeTruthy();
    expect(getByText('Contact Details')).toBeTruthy();
    expect(getByText(/Alice Smith/)).toBeTruthy();
    expect(getByText(/5551234567/)).toBeTruthy();
    expect(getByText(/alice@example\.com/)).toBeTruthy();
    expect(getByText(/Acme Corp/)).toBeTruthy();
  });

  it('shows edit, delete, and close buttons in view mode', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(getByTestId('contacts-detail-edit-button')).toBeTruthy();
    expect(getByTestId('contacts-detail-delete-button')).toBeTruthy();
    expect(getByTestId('contacts-detail-close-button')).toBeTruthy();
  });

  it('switches to edit mode when edit button pressed', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId, getByText } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-edit-button'));

    expect(getByText('Edit Contact')).toBeTruthy();
    expect(getByTestId('contacts-detail-edit-given-name')).toBeTruthy();
    expect(getByTestId('contacts-detail-save-button')).toBeTruthy();
    expect(getByTestId('contacts-detail-cancel-button')).toBeTruthy();
  });

  it('pre-fills edit inputs with contact data', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-edit-button'));

    expect(getByTestId('contacts-detail-edit-given-name').props.value).toBe('Alice');
    expect(getByTestId('contacts-detail-edit-family-name').props.value).toBe('Smith');
    expect(getByTestId('contacts-detail-edit-phone').props.value).toBe('5551234567');
    expect(getByTestId('contacts-detail-edit-email').props.value).toBe('alice@example.com');
    expect(getByTestId('contacts-detail-edit-company').props.value).toBe('Acme Corp');
  });

  it('calls onUpdate and closes modal when save button pressed', async () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-edit-button'));
    fireEvent.changeText(getByTestId('contacts-detail-edit-given-name'), 'Bob');
    fireEvent.press(getByTestId('contacts-detail-save-button'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c1',
          givenName: 'Bob',
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('cancels edit mode when cancel button pressed', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId, getByText } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-edit-button'));
    expect(getByText('Edit Contact')).toBeTruthy();

    fireEvent.press(getByTestId('contacts-detail-cancel-button'));
    expect(getByText('Contact Details')).toBeTruthy();
  });

  it('shows alert when delete button pressed', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-delete-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Contact',
      expect.stringContaining('Alice Smith'),
      expect.any(Array),
    );
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <ContactDetailModal
        contact={mockContact}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('contacts-detail-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
