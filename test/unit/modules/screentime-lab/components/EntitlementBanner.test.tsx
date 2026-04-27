/**
 * @file T025 — EntitlementBanner test.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { EntitlementBanner } from '@/modules/screentime-lab/components/EntitlementBanner';

describe('EntitlementBanner', () => {
  it('renders nothing when visible=false', () => {
    const { queryByLabelText } = render(<EntitlementBanner visible={false} />);
    expect(queryByLabelText('Entitlement banner')).toBeNull();
  });

  it('renders banner copy + link to quickstart when visible=true', () => {
    const { getByText, getByLabelText } = render(<EntitlementBanner visible={true} />);
    expect(getByLabelText('Entitlement banner')).toBeTruthy();
    expect(getByText(/Entitlement required/i)).toBeTruthy();
    expect(getByText(/quickstart\.md/)).toBeTruthy();
  });
});
