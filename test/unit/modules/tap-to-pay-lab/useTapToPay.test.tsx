/**
 * useTapToPay Hook Test
 * Feature: 051-tap-to-pay
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach } from '@jest/globals';

import {
  __setTapToPayBridgeForTests,
  useTapToPay,
} from '@/modules/tap-to-pay-lab/hooks/useTapToPay';
import type { TapToPayBridge } from '@/native/taptopay.types';

describe('useTapToPay', () => {
  let mockBridge: TapToPayBridge;

  beforeEach(() => {
    mockBridge = {
      isSupported: jest.fn(async () => true),
      discover: jest.fn(async () => {}),
      acceptPayment: jest.fn(async () => ({
        outcome: 'success' as const,
        transactionId: 'tx-123',
        amount: 1000,
        currency: 'USD',
      })),
    };
    __setTapToPayBridgeForTests(mockBridge);
  });

  it('initial state', () => {
    const { result } = renderHook(() => useTapToPay());
    expect(result.current.supported).toBeNull();
    expect(result.current.entitled).toBeNull();
    expect(result.current.discovery).toBe('idle');
    expect(result.current.lastResult).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('checkSupport updates supported', async () => {
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.checkSupport();
    });
    expect(result.current.supported).toBe(true);
  });

  it('discover success updates discovery to ready', async () => {
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.discover();
    });
    expect(result.current.discovery).toBe('ready');
  });

  it('discover error updates discovery to error', async () => {
    mockBridge.discover = jest.fn(async () => {
      throw new Error('Discovery failed');
    });
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.discover();
    });
    expect(result.current.discovery).toBe('error');
    expect(result.current.lastError).toBeTruthy();
  });

  it('acceptPayment success sets lastResult', async () => {
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.acceptPayment({ amount: 1000, currency: 'USD' });
    });
    expect(result.current.lastResult).toBeTruthy();
    expect(result.current.lastResult?.outcome).toBe('success');
  });

  it('acceptPayment declined sets lastResult', async () => {
    mockBridge.acceptPayment = jest.fn(async () => ({
      outcome: 'declined' as const,
      declinedReason: 'Insufficient funds',
    }));
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.acceptPayment({ amount: 1000, currency: 'USD' });
    });
    expect(result.current.lastResult?.outcome).toBe('declined');
  });

  it('acceptPayment error sets lastError', async () => {
    mockBridge.acceptPayment = jest.fn(async () => {
      throw new Error('Payment failed');
    });
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.acceptPayment({ amount: 1000, currency: 'USD' });
    });
    expect(result.current.lastError).toBeTruthy();
  });

  it('acceptPayment not-entitled sets entitled to false', async () => {
    mockBridge.acceptPayment = jest.fn(async () => {
      throw new Error('not-entitled: Entitlement missing');
    });
    const { result } = renderHook(() => useTapToPay());
    await act(async () => {
      await result.current.acceptPayment({ amount: 1000, currency: 'USD' });
    });
    expect(result.current.entitled).toBe(false);
  });
});
