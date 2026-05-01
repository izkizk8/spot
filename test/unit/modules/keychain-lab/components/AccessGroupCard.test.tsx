/**
 * @jest-environment jsdom
 *
 * Covers FR-018, US4-AS1, US4-AS2, US4-AS3, NFR-005, NFR-006, SC-005.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import AccessGroupCard from '@/modules/keychain-lab/components/AccessGroupCard';
import * as keychainStore from '@/modules/keychain-lab/keychain-store';
import type { KeychainResult } from '@/modules/keychain-lab/types';

jest.mock('@/modules/keychain-lab/keychain-store', () => ({
  tryAccessGroupProbe: jest.fn(),
}));

const mockProbe = keychainStore.tryAccessGroupProbe as jest.MockedFunction<
  typeof keychainStore.tryAccessGroupProbe
>;

describe('AccessGroupCard', () => {
  const ACCESS_GROUP = '$(AppIdentifierPrefix)com.izkizk8.spot';

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockProbe.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders explainer text, the resolved access-group string, and a Try button', () => {
    const { getAllByText, getByText, getByTestId } = render(
      <AccessGroupCard accessGroup={ACCESS_GROUP} />,
    );

    expect(getAllByText(/access group/i).length).toBeGreaterThan(0);
    expect(getByText(ACCESS_GROUP)).toBeTruthy();
    expect(getByTestId('access-group-try')).toBeTruthy();
  });

  it('shows the byte-count success message when probe returns ok', async () => {
    mockProbe.mockResolvedValue({
      kind: 'ok',
      value: { bytes: 27 },
    } satisfies KeychainResult<{ bytes: number }>);

    const { getByText, getByTestId } = render(<AccessGroupCard accessGroup={ACCESS_GROUP} />);
    fireEvent.press(getByTestId('access-group-try'));

    await waitFor(() => {
      expect(getByText(/27/)).toBeTruthy();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('shows a distinct cancellation message when probe returns cancelled', async () => {
    mockProbe.mockResolvedValue({ kind: 'cancelled' });

    const { getByText, getByTestId } = render(<AccessGroupCard accessGroup={ACCESS_GROUP} />);
    fireEvent.press(getByTestId('access-group-try'));

    await waitFor(() => {
      expect(getByText(/cancel/i)).toBeTruthy();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('shows the missing-entitlement copy when probe returns missing-entitlement', async () => {
    mockProbe.mockResolvedValue({ kind: 'missing-entitlement' });

    const { getByText, getByTestId } = render(<AccessGroupCard accessGroup={ACCESS_GROUP} />);
    fireEvent.press(getByTestId('access-group-try'));

    await waitFor(() => {
      expect(getByText(/entitlement/i)).toBeTruthy();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('shows the unsupported copy when probe returns unsupported', async () => {
    mockProbe.mockResolvedValue({ kind: 'unsupported' });

    const { getByText, getByTestId } = render(<AccessGroupCard accessGroup={ACCESS_GROUP} />);
    fireEvent.press(getByTestId('access-group-try'));

    await waitFor(() => {
      expect(getByText(/unsupported|not supported/i)).toBeTruthy();
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('never throws or calls console.error across all bridge result kinds', async () => {
    const results: KeychainResult<{ bytes: number }>[] = [
      { kind: 'ok', value: { bytes: 12 } },
      { kind: 'cancelled' },
      { kind: 'missing-entitlement' },
      { kind: 'unsupported' },
    ];

    for (const result of results) {
      mockProbe.mockResolvedValueOnce(result);
      const { getByTestId, unmount } = render(<AccessGroupCard accessGroup={ACCESS_GROUP} />);
      fireEvent.press(getByTestId('access-group-try'));
      await waitFor(() => {
        expect(mockProbe).toHaveBeenCalled();
      });
      unmount();
    }

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
