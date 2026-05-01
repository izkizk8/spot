/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CapabilityCard from '@/modules/storekit-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('renders the available message when products are present', () => {
    const { getByTestId } = render(
      <CapabilityCard available={true} productIds={['com.acme.coins']} />,
    );
    expect(getByTestId('storekit-capability-card')).toBeTruthy();
    expect(getByTestId('storekit-capability-overall').props.children).toMatch(/✅/);
  });

  it('renders the unavailable message when no products are returned', () => {
    const { getByTestId } = render(<CapabilityCard available={false} productIds={[]} />);
    expect(getByTestId('storekit-capability-overall').props.children).toMatch(/⚠️/);
  });

  it('lists every configured product id', () => {
    const ids = ['com.acme.a', 'com.acme.b'];
    const { getByTestId } = render(<CapabilityCard available={true} productIds={ids} />);
    ids.forEach((id) => {
      expect(getByTestId(`storekit-capability-product-${id}`)).toBeTruthy();
    });
  });
});
