/**
 * @jest-environment jsdom
 *
 * Keychain Services Lab — Web screen tests (feature 023, T027).
 *
 * Covers FR-005, US5-AS1, NFR-005.
 *
 * Verifies:
 *   - IOSOnlyBanner renders with the alert role.
 *   - No interactive add/save/try surfaces are present.
 *   - The native keychain bridge is never instantiated (call recorder empty).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import * as NativeKeychainMock from '@test/__mocks__/native-keychain';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: { OS: 'web', select: (objs: Record<string, unknown>) => objs.web ?? objs.default },
  OS: 'web',
  select: (objs: Record<string, unknown>) => objs.web ?? objs.default,
}));

let KeychainLabScreenWeb: typeof import('@/modules/keychain-lab/screen.web').default;

describe('KeychainLabScreen (Web)', () => {
  beforeAll(() => {
    KeychainLabScreenWeb = require('@/modules/keychain-lab/screen.web').default;
  });

  beforeEach(() => {
    NativeKeychainMock.__reset();
  });

  it('renders the IOSOnlyBanner', () => {
    const { getByText } = render(<KeychainLabScreenWeb />);
    expect(getByText(/Keychain Services is unavailable on the Web/i)).toBeTruthy();
  });

  it('exposes no interactive add/save/try surfaces', () => {
    const { queryByTestId, queryByPlaceholderText } = render(<KeychainLabScreenWeb />);

    expect(queryByTestId('add-item-save')).toBeNull();
    expect(queryByTestId('add-item-label')).toBeNull();
    expect(queryByTestId('add-item-value')).toBeNull();
    expect(queryByTestId('add-item-biometry')).toBeNull();
    expect(queryByTestId('access-group-try')).toBeNull();
    expect(queryByPlaceholderText(/label/i)).toBeNull();
    expect(queryByPlaceholderText(/value/i)).toBeNull();
  });

  it('never instantiates the native keychain bridge (recorder is empty)', () => {
    render(<KeychainLabScreenWeb />);

    expect(NativeKeychainMock.__getCallHistory()).toEqual([]);
    expect(NativeKeychainMock.addItem).not.toHaveBeenCalled();
    expect(NativeKeychainMock.getItem).not.toHaveBeenCalled();
    expect(NativeKeychainMock.listLabels).not.toHaveBeenCalled();
    expect(NativeKeychainMock.tryAccessGroupProbe).not.toHaveBeenCalled();
  });
});
