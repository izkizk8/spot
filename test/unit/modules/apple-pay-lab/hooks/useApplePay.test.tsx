/**
 * useApplePay hook tests.
 * Feature: 049-apple-pay
 *
 * The native bridge is mocked at the import boundary via
 * `__setApplePayBridgeForTests`. The hook is exercised inside a
 * minimal React component via @testing-library/react-native.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  __setApplePayBridgeForTests,
  useApplePay,
  type UseApplePayReturn,
} from '@/modules/apple-pay-lab/hooks/useApplePay';
import { DEFAULT_REQUEST } from '@/modules/apple-pay-lab/supported-networks';
import type { ApplePayBridge, PaymentRequestOptions, PaymentResult } from '@/native/applepay.types';

interface MockBridge extends ApplePayBridge {
  canMakePayments: jest.Mock;
  canMakePaymentsUsingNetworks: jest.Mock;
  presentPaymentRequest: jest.Mock;
}

function makeBridge(): MockBridge {
  return {
    canMakePayments: jest.fn(() => true),
    canMakePaymentsUsingNetworks: jest.fn(() => true),
    presentPaymentRequest: jest.fn(
      async (_opts: PaymentRequestOptions): Promise<PaymentResult> => ({
        status: 'success',
        token: {
          transactionIdentifier: 'tx-1',
          paymentNetwork: 'Visa',
          paymentDataBase64: 'ABCD',
        },
        errorMessage: null,
      }),
    ),
  };
}

const handle: { current: UseApplePayReturn | null } = { current: null };

function Probe() {
  const r = useApplePay();
  React.useEffect(() => {
    handle.current = r;
  });
  return <Text testID="probe">probe</Text>;
}

describe('useApplePay', () => {
  let bridge: MockBridge;

  beforeEach(() => {
    handle.current = null;
    bridge = makeBridge();
    __setApplePayBridgeForTests(bridge);
  });

  afterEach(() => {
    __setApplePayBridgeForTests(null);
  });

  it('seeds canMakePayments + perNetwork from the bridge on mount', () => {
    render(<Probe />);
    expect(handle.current?.canMakePayments).toBe(true);
    expect(bridge.canMakePayments).toHaveBeenCalledTimes(1);
    expect(handle.current?.perNetwork.Visa).toBe(true);
    expect(handle.current?.perNetwork.MasterCard).toBe(true);
    expect(bridge.canMakePaymentsUsingNetworks).toHaveBeenCalledTimes(5);
  });

  it('starts with the DEFAULT_REQUEST and a null lastResult', () => {
    render(<Probe />);
    expect(handle.current?.request).toEqual(DEFAULT_REQUEST);
    expect(handle.current?.lastResult).toBeNull();
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.isPaying).toBe(false);
  });

  it('setRequest replaces the controlled request shape', () => {
    render(<Probe />);
    const next: PaymentRequestOptions = {
      ...DEFAULT_REQUEST,
      countryCode: 'GB',
      currencyCode: 'GBP',
    };
    act(() => {
      handle.current?.setRequest(next);
    });
    expect(handle.current?.request).toEqual(next);
  });

  it('pay() forwards the request to the bridge and stores the result', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.pay();
    });
    expect(bridge.presentPaymentRequest).toHaveBeenCalledWith(DEFAULT_REQUEST);
    expect(handle.current?.lastResult?.status).toBe('success');
    expect(handle.current?.lastResult?.token?.transactionIdentifier).toBe('tx-1');
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.isPaying).toBe(false);
  });

  it('pay() short-circuits with a validation message when the request is invalid', async () => {
    render(<Probe />);
    act(() => {
      handle.current?.setRequest({ ...DEFAULT_REQUEST, merchantIdentifier: '' });
    });
    await act(async () => {
      await handle.current?.pay();
    });
    expect(bridge.presentPaymentRequest).not.toHaveBeenCalled();
    expect(handle.current?.lastResult?.status).toBe('failure');
    expect(handle.current?.lastError).toMatch(/Merchant identifier/);
  });

  it('pay() surfaces a bridge rejection as a failure result + lastError', async () => {
    bridge.presentPaymentRequest.mockRejectedValueOnce(new Error('boom'));
    render(<Probe />);
    await act(async () => {
      await handle.current?.pay();
    });
    expect(handle.current?.lastResult?.status).toBe('failure');
    expect(handle.current?.lastResult?.errorMessage).toBe('boom');
    expect(handle.current?.lastError).toBe('boom');
  });

  it('pay() surfaces a "failure" status returned by the bridge', async () => {
    bridge.presentPaymentRequest.mockResolvedValueOnce({
      status: 'failure',
      token: null,
      errorMessage: 'Card declined.',
    });
    render(<Probe />);
    await act(async () => {
      await handle.current?.pay();
    });
    expect(handle.current?.lastResult?.status).toBe('failure');
    expect(handle.current?.lastError).toBe('Card declined.');
  });

  it('reset() clears lastResult and lastError', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.pay();
    });
    expect(handle.current?.lastResult).not.toBeNull();
    act(() => {
      handle.current?.reset();
    });
    expect(handle.current?.lastResult).toBeNull();
    expect(handle.current?.lastError).toBeNull();
  });

  it('survives a bridge whose canMakePayments throws', () => {
    bridge.canMakePayments.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    render(<Probe />);
    expect(handle.current?.canMakePayments).toBe(false);
  });
});
