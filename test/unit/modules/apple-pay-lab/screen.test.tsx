/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { __setApplePayBridgeForTests } from '@/modules/apple-pay-lab/hooks/useApplePay';
import type { ApplePayBridge } from '@/native/applepay.types';

const mockBridge: ApplePayBridge = {
  canMakePayments: jest.fn(() => true),
  canMakePaymentsUsingNetworks: jest.fn(() => true),
  presentPaymentRequest: jest.fn(async () => ({
    status: 'success' as const,
    token: {
      transactionIdentifier: 'tx-1',
      paymentNetwork: 'Visa',
      paymentDataBase64: 'BLOB',
    },
    errorMessage: null,
  })),
};

beforeEach(() => {
  __setApplePayBridgeForTests(mockBridge);
});

afterEach(() => {
  __setApplePayBridgeForTests(null);
  jest.clearAllMocks();
});

import ApplePayLabScreen from '@/modules/apple-pay-lab/screen';

describe('apple-pay-lab screen (iOS)', () => {
  it('renders all primary sections', () => {
    const { getByTestId } = render(<ApplePayLabScreen />);
    expect(getByTestId('apple-pay-capability-card')).toBeTruthy();
    expect(getByTestId('apple-pay-payment-composer')).toBeTruthy();
    expect(getByTestId('apple-pay-summary-items-editor')).toBeTruthy();
    expect(getByTestId('apple-pay-pay-button')).toBeTruthy();
    expect(getByTestId('apple-pay-result-card')).toBeTruthy();
    expect(getByTestId('apple-pay-setup-notes')).toBeTruthy();
  });

  it('renders the empty result state by default', () => {
    const { getByTestId } = render(<ApplePayLabScreen />);
    expect(getByTestId('apple-pay-result-empty')).toBeTruthy();
  });
});
