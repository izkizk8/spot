/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupNotes from '@/modules/apple-pay-lab/components/SetupNotes';

describe('SetupNotes', () => {
  it('renders the setup-notes test id', () => {
    const { getByTestId } = render(<SetupNotes />);
    expect(getByTestId('apple-pay-setup-notes')).toBeTruthy();
  });

  it('mentions Merchant ID, entitlement, processor, and sandbox testing', () => {
    const { getAllByText, getByText } = render(<SetupNotes />);
    expect(getAllByText(/Merchant ID/i).length).toBeGreaterThan(0);
    expect(getByText(/in-app payments/i)).toBeTruthy();
    expect(getByText(/payment processor/i)).toBeTruthy();
    expect(getAllByText(/sandbox/i).length).toBeGreaterThan(0);
  });
});
