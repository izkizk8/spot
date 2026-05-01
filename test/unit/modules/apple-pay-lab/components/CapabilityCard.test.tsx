/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CapabilityCard from '@/modules/apple-pay-lab/components/CapabilityCard';
import type { SupportedNetwork } from '@/native/applepay.types';

const ALL_FALSE: Readonly<Record<SupportedNetwork, boolean>> = {
  Visa: false,
  MasterCard: false,
  AmEx: false,
  Discover: false,
  ChinaUnionPay: false,
};

describe('CapabilityCard', () => {
  it('shows the supported message when canMakePayments is true', () => {
    const { getByTestId } = render(
      <CapabilityCard
        canMakePayments={true}
        perNetwork={{ ...ALL_FALSE, Visa: true, MasterCard: true }}
      />,
    );
    expect(getByTestId('apple-pay-capability-overall').props.children).toMatch(
      /canMakePayments\(\) returned true/,
    );
  });

  it('shows the unsupported message when canMakePayments is false', () => {
    const { getByTestId } = render(
      <CapabilityCard canMakePayments={false} perNetwork={ALL_FALSE} />,
    );
    expect(getByTestId('apple-pay-capability-overall').props.children).toMatch(
      /Apple Pay is unavailable/,
    );
  });

  it('renders one row per supported network', () => {
    const perNetwork: Readonly<Record<SupportedNetwork, boolean>> = {
      Visa: true,
      MasterCard: false,
      AmEx: true,
      Discover: false,
      ChinaUnionPay: false,
    };
    const { getByTestId } = render(
      <CapabilityCard canMakePayments={true} perNetwork={perNetwork} />,
    );
    expect(getByTestId('apple-pay-capability-network-Visa').props.children).toBe('✅');
    expect(getByTestId('apple-pay-capability-network-MasterCard').props.children).toBe('⛔');
    expect(getByTestId('apple-pay-capability-network-AmEx').props.children).toBe('✅');
    expect(getByTestId('apple-pay-capability-network-Discover').props.children).toBe('⛔');
    expect(getByTestId('apple-pay-capability-network-ChinaUnionPay').props.children).toBe('⛔');
  });
});
