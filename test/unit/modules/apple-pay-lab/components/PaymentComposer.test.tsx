/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import PaymentComposer from '@/modules/apple-pay-lab/components/PaymentComposer';
import { DEFAULT_REQUEST } from '@/modules/apple-pay-lab/supported-networks';
import type { PaymentRequestOptions } from '@/native/applepay.types';

function setup(initial: PaymentRequestOptions = DEFAULT_REQUEST) {
  const onChange = jest.fn();
  let request = initial;
  const utils = render(
    <PaymentComposer
      request={request}
      onChange={(next) => {
        request = next;
        onChange(next);
      }}
    />,
  );
  return { ...utils, onChange, getRequest: () => request };
}

describe('PaymentComposer', () => {
  it('renders the composer test id', () => {
    const { getByTestId } = setup();
    expect(getByTestId('apple-pay-payment-composer')).toBeTruthy();
  });

  it('updates the merchant identifier on change', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.changeText(getByTestId('apple-pay-composer-merchant'), 'merchant.com.acme');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ merchantIdentifier: 'merchant.com.acme' }),
    );
  });

  it('uppercases the country and currency codes', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.changeText(getByTestId('apple-pay-composer-country'), 'gb');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ countryCode: 'GB' }));
    fireEvent.changeText(getByTestId('apple-pay-composer-currency'), 'gbp');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ currencyCode: 'GBP' }));
  });

  it('toggles a network off and back on', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.press(getByTestId('apple-pay-composer-network-Visa'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        supportedNetworks: expect.not.arrayContaining(['Visa']),
      }),
    );
  });

  it('toggles a contact field requirement', () => {
    const { getByTestId, onChange } = setup();
    fireEvent.press(getByTestId('apple-pay-composer-contact-shipping'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        requiredContactFields: expect.objectContaining({ shipping: true }),
      }),
    );
  });
});
