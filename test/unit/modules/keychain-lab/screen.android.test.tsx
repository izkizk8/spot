/**
 * @jest-environment jsdom
 *
 * Keychain Services Lab — Android screen tests (feature 023, T026).
 *
 * Covers FR-005, US5-AS2, US4-AS4.
 *
 * Verifies:
 *   - AccessGroupCard is NOT rendered (no shared keychain on Android).
 *   - AccessibilityPicker is disabled with the Android-only note.
 *   - Basic Add flow still delegates through the bridge mock.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import * as NativeKeychainMock from '@test/__mocks__/native-keychain';

// Force Platform.OS = 'android' before the screen (and AccessibilityPicker) are required.
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'android',
    select: (objs: Record<string, unknown>) => objs.android ?? objs.default,
  },
  OS: 'android',
  select: (objs: Record<string, unknown>) => objs.android ?? objs.default,
}));

let KeychainLabScreenAndroid: typeof import('@/modules/keychain-lab/screen.android').default;

describe('KeychainLabScreen (Android)', () => {
  beforeAll(() => {
    KeychainLabScreenAndroid = require('@/modules/keychain-lab/screen.android').default;
  });

  beforeEach(() => {
    NativeKeychainMock.__reset();
  });

  it('does NOT render AccessGroupCard', async () => {
    const { queryByTestId, findByText } = render(<KeychainLabScreenAndroid />);
    await findByText(/No keychain items yet/i);

    expect(queryByTestId('access-group-try')).toBeNull();
  });

  it('disables AccessibilityPicker options and shows the Android-only note', async () => {
    const { findByText, getByTestId } = render(<KeychainLabScreenAndroid />);
    await findByText(/No keychain items yet/i);

    // Note copy from AccessibilityPicker when Platform.OS === 'android'.
    expect(await findByText(/Picker is iOS-only/i)).toBeTruthy();

    const option = getByTestId('accessibility-option-whenUnlocked');
    expect(option.props.accessibilityState?.disabled).toBe(true);
  });

  it('Add flow still delegates to the keychain bridge mock', async () => {
    const { getByTestId, getByPlaceholderText, findByText, queryByText } = render(
      <KeychainLabScreenAndroid />,
    );
    await findByText(/No keychain items yet/i);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'android-demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'val');

    await act(async () => {
      fireEvent.press(getByTestId('add-item-save'));
    });

    await waitFor(() => {
      expect(queryByText('android-demo')).toBeTruthy();
    });

    const calls = NativeKeychainMock.__getCallHistory();
    const userAdd = calls.find(
      (c: { method: string; label?: string }) =>
        c.method === 'addItem' && c.label === 'android-demo',
    );
    expect(userAdd).toBeDefined();
  });
});
