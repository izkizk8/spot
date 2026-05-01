/**
 * @jest-environment jsdom
 *
 * Keychain Services Lab — iOS screen tests (feature 023, T025).
 *
 * Covers FR-005, US1, US2, US4, SC-007.
 *
 * Verifies:
 *   - Mounts and renders ItemsList + AddItemForm + AccessGroupCard.
 *   - Add → Show → Delete flow wires through useKeychainItems.
 *   - Bridge recorder asserts the exact kSecAttrAccessible* constant on Save.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import * as NativeKeychainMock from '@test/__mocks__/native-keychain';

import KeychainLabScreen from '@/modules/keychain-lab/screen';

describe('KeychainLabScreen (iOS)', () => {
  beforeEach(() => {
    NativeKeychainMock.__reset();
  });

  it('mounts and renders ItemsList, AddItemForm and AccessGroupCard', async () => {
    const { getByTestId, getByText } = render(<KeychainLabScreen />);

    // AddItemForm — save button
    expect(getByTestId('add-item-save')).toBeTruthy();
    // AccessGroupCard — try button
    expect(getByTestId('access-group-try')).toBeTruthy();
    // ItemsList — empty state copy initially
    await waitFor(() => {
      expect(getByText(/No keychain items yet/i)).toBeTruthy();
    });
  });

  it('Add → Show → Delete flow wires through useKeychainItems', async () => {
    const { getByTestId, getByPlaceholderText, queryByText, findByText } = render(
      <KeychainLabScreen />,
    );

    // Wait for the initial empty load to settle.
    await findByText(/No keychain items yet/i);

    // ── Add ──────────────────────────────────────────────────────────────
    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 's3cret');

    await act(async () => {
      fireEvent.press(getByTestId('add-item-save'));
    });

    // The new item should appear in the list and the empty state goes away.
    await waitFor(() => {
      expect(queryByText(/No keychain items yet/i)).toBeNull();
    });
    await waitFor(() => {
      expect(queryByText('demo')).toBeTruthy();
    });

    // ── Show ─────────────────────────────────────────────────────────────
    // ItemRow renders a "Show" button that toggles to "Hide" once revealed.
    const showButton = await findByText('Show');
    await act(async () => {
      fireEvent.press(showButton);
    });
    await waitFor(() => {
      expect(queryByText('s3cret')).toBeTruthy();
      expect(queryByText('Hide')).toBeTruthy();
    });

    // ── Delete ───────────────────────────────────────────────────────────
    const deleteButton = await findByText('Delete');
    await act(async () => {
      fireEvent.press(deleteButton);
    });
    await waitFor(() => {
      expect(queryByText('demo')).toBeNull();
      expect(queryByText(/No keychain items yet/i)).toBeTruthy();
    });
  });

  it('passes the exact kSecAttrAccessible* constant to the bridge on Save (default class)', async () => {
    const { getByTestId, getByPlaceholderText, findByText } = render(<KeychainLabScreen />);

    await findByText(/No keychain items yet/i);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 's3cret');

    await act(async () => {
      fireEvent.press(getByTestId('add-item-save'));
    });

    await waitFor(() => {
      const calls = NativeKeychainMock.__getCallHistory();
      // The first addItem call writes the user item (default = whenUnlockedThisDeviceOnly).
      const userAdd = calls.find(
        (c: { method: string; label?: string }) => c.method === 'addItem' && c.label === 'demo',
      );
      expect(userAdd).toBeDefined();
      expect(userAdd!.accessibleConstant).toBe('kSecAttrAccessibleWhenUnlockedThisDeviceOnly');
    });
  });

  it('passes the exact kSecAttrAccessible* constant when a non-default class is selected', async () => {
    const { getByTestId, getByPlaceholderText, findByText } = render(<KeychainLabScreen />);

    await findByText(/No keychain items yet/i);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'passcode-only');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'topsecret');

    // Pick the strictest class.
    fireEvent.press(getByTestId('accessibility-option-whenPasscodeSetThisDeviceOnly'));

    await act(async () => {
      fireEvent.press(getByTestId('add-item-save'));
    });

    await waitFor(() => {
      const calls = NativeKeychainMock.__getCallHistory();
      const userAdd = calls.find(
        (c: { method: string; label?: string }) =>
          c.method === 'addItem' && c.label === 'passcode-only',
      );
      expect(userAdd).toBeDefined();
      expect(userAdd!.accessibleConstant).toBe('kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly');
    });
  });
});
