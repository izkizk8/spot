/**
 * Unit tests: universal-links-lab iOS screen.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { UniversalLinkEvent } from '@/modules/universal-links-lab/types';

const mockClear = jest.fn();
const mockDispatch = jest.fn().mockResolvedValue(undefined);

const hookState: { log: UniversalLinkEvent[] } = { log: [] };

jest.mock('@/modules/universal-links-lab/hooks/useUniversalLinks', () => ({
  useUniversalLinks: () => ({
    log: hookState.log,
    clear: mockClear,
    dispatch: mockDispatch,
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

import UniversalLinksLabScreen from '@/modules/universal-links-lab/screen';

describe('universal-links-lab screen (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookState.log = [];
  });

  it('renders ExplainerCard, DomainsList, TestComposer, AASAPreviewCard, SetupInstructions, InvocationsLog', async () => {
    const view = render(<UniversalLinksLabScreen />);
    await act(async () => {});
    const { getByText, getAllByText } = view;
    expect(getByText(/About Universal Links/)).toBeTruthy();
    expect(getByText(/Configured Domains/)).toBeTruthy();
    expect(getByText(/Test Composer/)).toBeTruthy();
    expect(getAllByText(/AASA Preview/).length).toBeGreaterThan(0);
    expect(getByText(/Setup Instructions/)).toBeTruthy();
    expect(getByText(/Recent Invocations/)).toBeTruthy();
  });

  it('Test Composer dispatch button calls hook.dispatch', async () => {
    const view = render(<UniversalLinksLabScreen />);
    await act(async () => {});
    const { getByTestId } = view;
    await act(async () => {
      fireEvent.press(getByTestId('dispatch-btn'));
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('renders incoming invocations from hook log', async () => {
    hookState.log = [
      {
        url: 'https://spot.example.com/incoming/1',
        host: 'spot.example.com',
        path: '/incoming/1',
        receivedAt: new Date(0).toISOString(),
      },
    ];
    const view = render(<UniversalLinksLabScreen />);
    await act(async () => {});
    const { getByText, getAllByTestId } = view;
    expect(getByText('https://spot.example.com/incoming/1')).toBeTruthy();
    expect(getAllByTestId(/invocation-row-/).length).toBe(1);
  });
});
